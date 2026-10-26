#!/usr/bin/env python3
"""Verify lemonade's preserved source files and archive without a checkout or network."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def preserved_path(relative, root):
    path = PurePosixPath(relative)
    if (path.is_absolute() or ".." in path.parts or "\\" in relative
            or ":" in relative or "\0" in relative or not path.parts or path.parts[0] != root):
        raise ValueError(f"Invalid preserved path: {relative}")
    return path


def contained(base, relative, root="sources"):
    path = preserved_path(relative, root)
    result = base.joinpath(*path.parts).resolve()
    if not result.is_relative_to(base.resolve()):
        raise ValueError(f"Path escapes bundle: {relative}")
    return result


def verify_snapshot(skill_root, manifest_path, directory):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schemaVersion") != 1:
        raise ValueError("Unsupported source manifest version.")
    errors = []
    records = {}
    destinations = set()
    for item in manifest["files"]:
        name = item["originalPath"]
        if directory == "imports":
            preserved_path(name, "limsflex")
        if name in records or item["storedPath"].casefold() in destinations:
            errors.append(f"Duplicate manifest path: {name}")
        records[name] = item
        destinations.add(item["storedPath"].casefold())
        target = contained(skill_root, item["storedPath"], directory)
        if not target.is_file():
            errors.append(f"Missing stored file: {name}")
            continue
        data = target.read_bytes()
        if len(data) != item["size"] or digest(data) != item["sha256"]:
            errors.append(f"Stored file mismatch: {name}")
    archive = contained(skill_root, manifest["archive"]["path"], directory)
    if not archive.is_file():
        errors.append("Archive is missing.")
    else:
        if digest(archive.read_bytes()) != manifest["archive"]["sha256"]:
            errors.append("Archive hash mismatch.")
        try:
            with zipfile.ZipFile(archive) as zf:
                names = zf.namelist()
                if len(names) != len(set(names)) or set(names) != set(records):
                    errors.append("Archive inventory mismatch.")
                for name in sorted(set(names) & set(records)):
                    data = zf.read(name)
                    item = records[name]
                    if len(data) != item["size"] or digest(data) != item["sha256"]:
                        errors.append(f"Archive entry mismatch: {name}")
        except (zipfile.BadZipFile, RuntimeError, OSError) as error:
            errors.append(f"Archive cannot be read: {error}")
    expected_skills = {name for name in records if PurePosixPath(name).name == "SKILL.md"}
    skill_paths = [item["originalPath"] for item in manifest["skills"]]
    if len(skill_paths) != len(set(skill_paths)):
        errors.append("Duplicate skill metadata originalPath.")
    if set(skill_paths) != expected_skills:
        errors.append("Skill metadata inventory mismatch.")
    for item in manifest["skills"]:
        original = records.get(item["originalPath"])
        if original and any(item[key] != original[key] for key in ("storedPath", "sha256")):
            errors.append(f"Skill metadata hash/path mismatch: {item['originalPath']}")
    external_files = sum(name.startswith("exskills/") for name in records)
    external_skills = sum(name.startswith("exskills/") for name in expected_skills)
    expected_counts = {
        "files": len(records),
        "bytes": sum(item["size"] for item in records.values()),
        "externalFiles": external_files,
        "legacyFiles": len(records) - external_files,
        "skills": len(expected_skills),
        "externalSkills": external_skills,
        "legacySkills": len(expected_skills) - external_skills,
    }
    if directory == "imports":
        expected_counts = {key: expected_counts[key] for key in ("files", "bytes", "skills")}
    recorded_counts = manifest.get("counts")
    if (not isinstance(recorded_counts, dict)
            or recorded_counts != expected_counts
            or any(type(value) is not int for value in recorded_counts.values())):
        errors.append("Recorded counts mismatch with verified inventory.")
    controls_path = f"{directory}/.gitattributes"
    controls = contained(skill_root, controls_path, directory)
    if not controls.is_file() or controls.read_bytes() != b"** -text\n":
        errors.append("Source byte-preservation attributes are missing or changed.")
    expected_stored = {item["storedPath"] for item in records.values()}
    expected_stored.update((manifest["archive"]["path"], controls_path))
    actual_stored = {
        path.relative_to(skill_root).as_posix()
        for path in (skill_root / directory).rglob("*") if path.is_file()
    }
    for unexpected in sorted(actual_stored - expected_stored):
        errors.append(f"Unrecorded stored file: {unexpected}")
    if errors:
        raise ValueError("\n".join(errors))
    return {"files": len(records), "skills": len(expected_skills), "bytes": sum(item["size"] for item in records.values()), "archive": "verified"}


def verify_bundle(skill_root):
    skill_root = Path(skill_root).resolve()
    original = verify_snapshot(skill_root, skill_root / "library/source-manifest.json", "sources")
    import_manifest = skill_root / "library/limsflex-manifest.json"
    if not import_manifest.is_file():
        if (skill_root / "imports").exists():
            raise ValueError("Import manifest is missing while preserved imports exist.")
        return original
    if not import_manifest.resolve().is_relative_to(skill_root):
        raise ValueError("Import manifest escapes bundle.")
    supplement = verify_snapshot(skill_root, import_manifest, "imports")
    return {
        **{key: original[key] + supplement[key] for key in ("files", "skills", "bytes")},
        "archive": "verified",
        "bundles": {"original": original, "limsflex": supplement},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skill-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        result = verify_bundle(args.skill_root)
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps(result))
    else:
        print(f"Verified {result['files']} preserved files and {result['skills']} source skill documents; archive bytes match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
