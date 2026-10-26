#!/usr/bin/env python3
"""Read-only checks for this single skill package and its repository contracts."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[3])
    args = parser.parse_args()
    root = args.repo.resolve()
    package = root / "skills/sejongpac-renewmakes"
    failures = []
    passed = []

    def check(label, condition):
        (passed if condition else failures).append(label)

    skill = (package / "SKILL.md").read_text()
    front = re.match(r"\A---\n(.*?)\n---\n", skill, re.S)
    check("valid frontmatter and exact skill name", bool(front and re.search(r"(?m)^name: sejongpac-renewmakes$", front[1])))
    check("description states when to use", bool(front and re.search(r"(?m)^description: Use when ", front[1])))
    required = [
        "references/collaboration-history.md", "references/design-contract.md",
        "references/engineering-runbook.md", "references/verification.md",
        "references/skill-tests.md", "references/cards-and-restoration.md",
        "scripts/check-routes.cjs", "scripts/check-decoration.cjs",
    ]
    check("all supporting files are in the same skill", all((package / name).is_file() for name in required))
    broken = []
    for document in package.rglob("*.md"):
        for target in re.findall(r"\]\(([^)]+)\)", document.read_text()):
            if "://" in target or target.startswith("#"):
                continue
            path = (document.parent / target.split("#", 1)[0]).resolve()
            if not path.is_file():
                broken.append(f"{document.relative_to(package)} -> {target}")
    check("local documentation and evidence links resolve", not broken)
    failures.extend(broken)
    manifest = json.loads((package / "evidence/manifest.json").read_text())
    check("retained screenshots match their provenance hashes", all(
        (package / "evidence" / item["file"]).is_file()
        and hashlib.sha256((package / "evidence" / item["file"]).read_bytes()).hexdigest() == item["sha256"]
        for item in manifest
    ) and len(manifest) == len(list((package / "evidence").glob("*.png"))))

    small = []
    for stylesheet in (root / "v2/styles").rglob("*.css"):
        for match in re.finditer(r"font-size:\s*(\d+(?:\.\d+)?)px", stylesheet.read_text()):
            if float(match[1]) < 16:
                small.append(str(stylesheet.relative_to(root)) + ": " + match[0])
    check("v2 has no literal UI font-size below 16px", not small)
    failures.extend(small)
    defaults = (root / "v2/styles/defaults.css").read_text()
    check("readability tokens are present", all(token in defaults for token in [
        "--text-sm: 1rem", "--text-body: 1.125rem", "--text-action: 1.375rem",
        "--text-item-title: 1.25rem", "--text-card-title: 1.25rem", "--weight-title: 650",
        "--control-size: 3rem", "--shortcut-size: 4rem", "--radius-dialog: 1.5rem",
    ]))
    pages = (root / "v2/src/features/pages.js").read_text()
    rejected = ["SINCE 1978 · GWANGHWAMUN, SEOUL", "A PLACE FOR EVERYONE", "세종문화회관 · 서울특별시 종로구 세종대로 175"]
    check("rejected about decoration stays out of application source", not any(text in pages for text in rejected))
    check("latest request preserves lower diagram while header decoration stays removed", "identity-story-channels" in pages and pages.count('class="identity-shape"') == 3 and "showIdentityMarks: false" in pages)
    carousel = (root / "v2/src/components/carousel.js").read_text()
    check("hero uses the current 2700ms and 800ms contract", "HERO_INTERVAL = 2700" in carousel and "HERO_DURATION = 800" in carousel)
    check("three card variants share rendering and input policy", all(name in (root / "v2/src/components/cards.js").read_text() for name in ["programCard", "heroCard", "bannerCard", "bindCards"]))
    info = (root / "v2/styles/information.css").read_text()
    check("automatic decorative mint eyebrow dots are removed", ".institution-story-heading .eyebrow::before" not in info and ".overview-intro-copy .eyebrow::before" not in info)
    feedback = (root / "assets/ui-feedback.css").read_text()
    check("toast uses the capsule token", "--radius-pill: 9999px" in feedback and "border-radius: var(--radius-pill)" in feedback)
    check("both versions load shared feedback", all("assets/ui-feedback.css" in (root / name).read_text() for name in ["legacy.html", "v2/index.html"]))
    check("modal corners use the shared radius", (root / "v2/styles/components.css").read_text().count("border-radius: var(--radius-dialog)") >= 2)

    icons = root / "assets/icons"
    catalog = json.loads((icons / "catalog.json").read_text())
    names = {p.stem for p in (icons / "rounded").glob("*.svg")}
    check("Rounded inventory matches the pinned 7858-file library", len(names) == 7858 and names == set(catalog["files"]) and catalog["version"] == "0.48.0")
    check("every unfilled icon has a filled counterpart", all(name + "-fill" in names for name in names if not name.endswith("-fill")))
    symbols = ET.parse(icons / "material-symbols-rounded.svg").getroot()
    check("runtime sprite contains only the 25 selected symbols", len(symbols) == 25)
    check("Google asset license is preserved", (icons / "LICENSE").is_file())

    for label in passed:
        print("PASS:", label)
    for label in failures:
        print("FAIL:", label, file=sys.stderr)
    print(f"{len(passed)} checks passed; {len(failures)} failures")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
