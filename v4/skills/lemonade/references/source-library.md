# Preserving originals and using the unified library

One `lemonade` installation contains the complete originals and their supporting runtime resources.
The initial immutable snapshot comprises 1,999 external files and 70 files from the former skills: **2,069 files and 45,950,154 bytes**.
Its 53 entry documents include 39 external and 14 former lemonade guides. Six UI guides are distribution copies with identical text, but their supporting resources differ, so all are preserved.
The separate 2026-10-15 limsflex import adds **9 files, 26,732 bytes and one guide** without changing that snapshot. The combined inventory is **2,078 files, 45,976,886 bytes and 54 guides**.

## Where everything lives

| Location | Purpose |
| --- | --- |
| `SKILL.md` | The sole active entry point and current governing guidance |
| `references/` | Unified decision rules, capability routes, implementation guidance, and verification |
| `library/source-manifest.json` | Each file's original path, stored path, size, SHA-256, and original metadata |
| `sources/originals.zip` | Complete snapshot retaining original filenames and paths |
| `sources/exskills/` | Readable tree of all five external bundles, including tools that can be run when needed |
| `sources/legacy/skills/` | Sibling structure and supporting resources of the 14 former skills |
| `library/limsflex-manifest.json` | Later limsflex inventory, hashes, counts and original metadata |
| `imports/limsflex/` · `imports/limsflex-originals.zip` | Readable limsflex sources and an original-path ZIP, separate from the immutable initial snapshot |

In the readable tree, `SKILL.md` becomes `SKILL.source.md`, and `.gitignore`, `.gitattributes`, and `.gitmodules` receive a `.source` suffix.
File contents remain byte-identical. These renames prevent duplicate skill discovery and interference from original Git settings. The ZIP also preserves the original names.
`sources/.gitattributes` prevents Git's automatic line-ending conversion. Put improvements in the current `references/` and tools instead of editing the originals or ZIP directly.
The later import follows the same byte-preservation approach with `imports/.gitattributes`. Its `.git` pointer is stored as inert `.git.source`; it must never be activated or followed as a repository connection. Its original logo, agent metadata and name record provenance, not another installed skill or a visual style for deliverables.

The former repository-root `exskills/` and `archive/legacy-skills/` directories are no longer needed for installation, search, or execution.
Use the preserved tree inside this skill. `exskills/...` and `skills/...` in `originalPath` are lookup keys representing paths before consolidation, not instructions to recreate those paths at the repository root.

## Find and read

`<skill>` is the installed skill directory. These commands search documents and return paths; they do not execute original scripts.

```bash
node <skill>/scripts/knowledge.mjs --list
node <skill>/scripts/knowledge.mjs --id effects/shaders --json
node <skill>/scripts/knowledge.mjs --id code/limsflex --json
node <skill>/scripts/knowledge.mjs --resolve references/code-contract.md --from limsflex/SKILL.md
node <skill>/scripts/knowledge.mjs --search "reduced motion"
node <skill>/scripts/knowledge.mjs --resolve "exskills/web-animation-skills-main/web-animation-skills-main/skills/svg-animation/SKILL.md"
node <skill>/scripts/knowledge.mjs --resolve "components.md" --from "exskills/shaders-main/shaders-main/skills/shaders/SKILL.md"
```

JSON from `--list`/`--search` contains a `guides` list; `--id` returns one guide, and `--resolve` returns one file.
`originalPath` is the pre-consolidation path, `storedPath` is the preserved path relative to the skill, and `absolutePath` is the absolute path in the current installation.
`available` reports whether that file currently exists. `duplicateOf` identifies the canonical ID for identical guide text; it does not mean the resources or entire folders are duplicates.
A file's existence and a tool's successful execution are different facts. Names, absolute paths, and recorded versions do not establish current product support.

If an original relative link still points to `SKILL.md`, pass the document's `originalPath` to `--from` and resolve the link with `--resolve`.
Do not apply paths such as `.claude/skills/...` from an original document directly to the user's global configuration. Find and read the corresponding preserved file.
Route references to separate skill invocations through the [capability map](capabilities.md).

## Use tools and data

Run UI-search Python with `python -B -X utf8` to avoid creating `__pycache__` in the preserved tree.
Keep each script's relative `scripts/` and `data/` structure intact and run it from the project root. Save generated results to an explicit location in the project.
Do not run preserved installers, synchronization scripts, or update scripts as part of looking up resources. Use only the repository's lemonade installer to install this skill.
Before running an implementation tool, check its required packages, devices, keys, and network access, then use only what the actual request needs.
Do not assume that every included framework, AI provider, or video tool is installed or has been execution-tested in the current environment.

## Verify lossless preservation

The installed skill alone is sufficient to run this check using the Python standard library:

```bash
python -B <skill>/scripts/verify_sources.py --json
```

The verifier checks the initial snapshot and the later import: manifest counts and content hashes, ZIP paths and entry bytes, each ZIP's hash, and extra or missing files. Base-only historical packages remain supported; a remaining import tree without its manifest is an error.
The result establishes **original-source preservation**. It does not guarantee the originals' accuracy or every tool's execution, accessibility, or license suitability.
At initial consolidation, the original directories were independently enumerated and compared with the manifest. Later work on original material must not overwrite that snapshot.
The ZIP and manifest retain the original paths and filenames needed for reconstruction. Restore into a separate folder of your choice without overwriting existing work.

Retain original authorship, licenses, and individual font/icon provenance. Consult the installed [NOTICE.md](../NOTICE.md) and each original's license.
The unified lemonade name does not change the rights and conditions of the originals.
No separate license file accompanied the supplied limsflex material. Its README's private-submodule description is retained as historical provenance; it is not a network setup instruction or a claim of MIT relicensing.
