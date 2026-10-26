# lemonade · UI knowledge and brand production

This guide connects UI search, branding, design tokens, components, logos/CIP/icons, banners/posters, and HTML presentations.
Choose only the route relevant to the task. Original names indicate provenance; `lemonade` is the only active skill.
Prioritize user requirements, existing brand and content, the actual project structure, accessibility, and functional verification.
When producing web code, apply the [code and markup contract](code-and-markup.md) without changing brand tokens, layout or visual expression. Reuse the project's existing reset and cascade rather than injecting a new global baseline.
Consult mandatory styles, specific tools, and installation commands in preserved originals only when that approach has been chosen.

## Go directly to the knowledge you need

| Task and trigger | Original guide to read | Next action |
|---|---|---|
| UI direction, UX problems, color, typography, charts, interaction, or stack-specific implementation | [UI knowledge search][ui] | Start with one relevant domain using the search contract below |
| Toss or Sejong Center style, or another named-site reference | [Named styles](named-styles.md) | Read the matching profile, select task-relevant principles, and compose original content and layout within the customer's brand |
| Brand identity, voice, messaging, asset organization, or consistency review | [Brand][brand] | Inspect existing guidelines, logos, colors, and typography; then determine the change scope |
| Design tokens, component specifications, themes, or states | [Design system][system] | Inspect existing tokens → map semantic layers and states → review output |
| Selection/input dimensions, native styling mismatches, popups/focus, or calendars | [State contracts](interaction-edge-cases.md) | Define rendering ownership, dimensions, states, data, and dismissal → reproduce relevant edge cases |
| shadcn/Tailwind components, responsive layouts, themes, or canvases | [UI styling implementation][styling] | Verify the project stack and versions, then use only relevant references |
| Logos, corporate identity packages (CIP), icons, or social images | [Visual asset production][design] | Brand materials → brief → concepts and verification for each size and use |
| Social covers, advertising banners, web banners, or print concepts | [Banners][banner] | Check target dimensions and safe areas → create editable compositions → inspect at actual size |
| Presentations, pitches, or educational/informational HTML slides | [Slides][slides] | Use the actual knowledge files and slide search below |

Read an approved design system first, even for a new page. Generate a complete recommendation only when a new direction needs exploration.
Do not load all branding, token, and slide material for a small component change.

## Local tool locations and execution boundaries

Replace `<skill>` with the absolute path to the installed `lemonade` directory. The following examples use PowerShell.
Keep the current working directory at **the root of the project receiving the deliverable**. Do not write output into the preserved-resource folders.

```powershell
$uiBundle = "<skill>/sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main"
$uiGuides = Join-Path $uiBundle ".claude/skills"
$uiSearch = Join-Path $uiBundle "src/ui-ux-pro-max/scripts/search.py"
python -B -X utf8 $uiSearch "keyboard focus modal" --domain ux --json
python -B -X utf8 $uiSearch "chip badge overflow" --stack html-tailwind --json
python -B -X utf8 $uiSearch "cultural venue editorial" --design-system --json
```

These commands print recommendations. `--persist`, generators, and synchronization tools write files, so inspect output paths and existing files first.
If `python` is unavailable, check for an installed `python3` or `py -3`. The search engine requires no external Python packages.
The script locates its `data/` by relative path, so retain the preserved internal directory structure.
Node brand/token tools generally read or write `docs/`, `assets/`, and `src/` under the project cwd.
Set `DESIGN_SYSTEM_PROJECT_ROOT` explicitly if the project location for `fetch-background.py` is ambiguous.

## UI search contract and data interpretation

1. Form a query around one primary intent, 2–5 meaningful words, and any necessary platform or product conditions.
2. Use `--domain` for a specific problem, the verified `--stack` for implementation, and `--design-system` to explore a new visual system.
3. Read the returned domain, leading matches, and applicable platforms to assess relevance. Do not interpret search rank as a quality score.
4. If results are empty or irrelevant, retry once with a narrower query or an explicit domain.
5. If they still do not fit, record that no verified match was found and apply general principles. Do not fabricate support from empty results.

For design-system output, inspect match provenance and default/fallback flags. A `General` result or default reasoning is a starting suggestion, not evidence of an industry-specific match, even when the command succeeds.

| Need | Domains |
|---|---|
| Product type, style, or color | `product`, `style`, `color` |
| Font pairings or individual fonts | `typography`, `google-fonts` |
| Accessibility, usability, or landing-page structure | `ux`, `landing` |
| Icons, motion, or charts | `icons`, `gsap`, `chart` |
| React performance or app interfaces | `react`, `web` |

`web` also includes app/native interface material. Do not assume it covers only web pages because of its name.
For accessibility, search observable outcomes first, such as `"error summary validation" --domain ux`, then inspect the required stack implementation.
`--full` disables truncation of long fields; `--json` returns structured results. Use `--help` for the full stack list.
`--variance`, `--motion`, and `--density` are optional recommendation adjustments. They do not automatically determine whether motion is necessary or how the site should be structured.

Read both [catalog-summary.json][catalog] and [data-provenance.json][provenance] for the snapshot.
The 2026-08-26 catalog records 88 style rows (79 searchable, 50 active), and 192 entries each for products, palettes, and reasoning profiles.
It includes 74 font pairings, 1,934 Google Fonts, 119 UX guidelines, and 22 technology stacks.
These are the original record's date and classifications, not a fresh verification of current service specifications, APIs, frameworks, or licenses.
Verify the product versions and current specifications you will use. Check the individually preserved licenses when using fonts and icons.

To save recommendations in the project, review them first and specify the output root explicitly:

```powershell
python -B -X utf8 $uiSearch "cultural venue editorial" --design-system --persist -p "Project" --output-dir "<project-root>"
```

Read `design-system/<project-slug>/MASTER.md` and page-level overrides first. Use `--force`, which overwrites existing files, only for an intended replacement.
Search results are proposals. Reject entries that conflict with the actual brand, accessibility, or verified content, and record why.

## Brand → tokens → components

Branding covers voice, messaging, and visual assets together. If no existing guide is available, start with the minimum definitions needed.
Use the primitive → semantic → component relationship as a reference while respecting the project's existing token and theme system.
Detected color literals are review candidates, not proof that every literal is an error. Check states, contrast, and usage context.

```powershell
node "$uiGuides/brand/scripts/inject-brand-context.cjs" --json
node "$uiGuides/brand/scripts/validate-asset.cjs" "<asset-path>"
node "$uiGuides/design-system/scripts/generate-tokens.cjs" --config "<project-token-json>"
node "$uiGuides/design-system/scripts/validate-tokens.cjs" --dir "<project-source-dir>"
```

In this form, `generate-tokens.cjs` writes to stdout. To save a file, specify a reviewed `--output` path.
`sync-brand-to-tokens.cjs`, `--fix`, component additions, and Tailwind configuration generation modify the project. Make only the necessary changes and review the diff.
shadcn/Tailwind are implementation routes for projects that have adopted them. Do not automatically replace existing CSS or other frameworks.
Even with accessible primitives, verify the final labels, focus, keyboard behavior, error states, and responsive behavior in use.

## Logos, CIP, icons, and social assets

```powershell
python -B -X utf8 "$uiGuides/design/scripts/logo/search.py" "minimalist clean" --domain style --json
python -B -X utf8 "$uiGuides/design/scripts/logo/search.py" "cultural studio editorial" --design-brief -p "Brand"
python -B -X utf8 "$uiGuides/design/scripts/cip/search.py" "business card letterhead" --domain deliverable --json
python -B -X utf8 "$uiGuides/design/scripts/cip/search.py" "cultural studio" --cip-brief -b "Brand"
```

Before generation, establish trademark spelling, actual logo assets, usage sizes, backgrounds, output formats, and required variants.
A white background is one option in the original workflow. Prioritize the usage context, including transparent or dark backgrounds and reversed artwork.
Inspect icon silhouettes, strokes, and consistency at their actual small size. When placing them in UI, provide accessible names appropriate to their roles.
Keep social/banner copy in editable layers when possible, and check wrapping, safe areas, and clipping at the final size.
The preserved AI generators are optional. Available image-generation tools or user-supplied assets can also be used.
The original Gemini route requires `google-genai` and a key; CIP image loading requires Pillow. Atlas and MuAPI use their own provider keys and network access.
Model names and service URLs in originals do not establish current support. Verify the chosen provider and result storage location before use.

## Different purposes of banners, posters, and slides

Banners are governed by the target platform, actual display size, safe areas, and copy priorities. Do not impose a maximum font count or a bottom-right CTA on every banner.
Original advertising text ratios and pixel dimensions do not replace current platform requirements. Distinguish a print concept from color and trim verification for printer-ready delivery.
For posters and canvases, use the [canvas composition guide][canvas] and preserved `ui-styling/canvas-fonts/` when appropriate.
"Minimize text" and "90% visual" are suggestions for specific art directions. Do not delete content required for instructions, education, or information delivery.

For slides, bypass `references/create.md`, which invokes `[slides]` again, and proceed to the actual knowledge below.
Read in this order: purpose/audience/story → [layouts][slide-layout] → relevant [copy structure][slide-copy] → [HTML template][slide-html].
For strategic comparisons, read [slide strategies][slide-strategy]. Use the design-system database to search tokens, charts, backgrounds, and typography.

```powershell
python -B -X utf8 "$uiGuides/design-system/scripts/search-slides.py" "investor pitch" --json
python -B -X utf8 "$uiGuides/design-system/scripts/search-slides.py" "revenue growth" --domain chart --json
python -B -X utf8 "$uiGuides/design-system/scripts/search-slides.py" "problem slide" --context --position 2 --total 9
```

Chart.js, centered alignment, and persuasive structures are tools for the chosen HTML presentation approach. Prioritize the purpose of education, reporting, or technical explanation and the actual data.
Label charts with sources, units, and periods; do not invent performance figures. Verify keyboard navigation, progress indicators, and clipping on actual screens or output.
If delivery requires PPTX or another format, use a production route suited to it. Do not present an HTML artifact as that format.

## Preserved duplicates, supporting tools, and licenses

The following six guides are distribution copies with identical text. Do not register them as separate active skills.
[Brand copy][copy-brand] · [Design copy][copy-design] · [Token copy][copy-system] · [Slides copy][copy-slides] · [Banner copy][copy-banner] · [UI styling copy][copy-styling]
The original UI-styling folder contains 81 font/license files absent from the distribution copy. Do not replace the original by retaining only the lighter copy.
The canonical search data, scripts, and templates are preserved in `src/ui-ux-pro-max/`; the existing UI guides are in `.claude/skills/`.
`cli/` is the former multi-skill installer. Do not run it to use lemonade. Do not automatically activate external MCP integrations or settings in `stack/` either.
`stack/scripts/design-audit.mjs` is an optional Playwright/Chromium tool; `gallery/` is a separate Next.js project. Check dependencies and cwd when needed.
Retain Next Level Builder's MIT copyright, individual font OFL licenses, and font/icon provenance records. Consolidating folders does not remove copyright or redistribution conditions.

[ui]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/SKILL.source.md
[brand]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/brand/SKILL.source.md
[system]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/design-system/SKILL.source.md
[styling]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/ui-styling/SKILL.source.md
[design]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/design/SKILL.source.md
[banner]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/banner-design/SKILL.source.md
[slides]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/slides/SKILL.source.md
[catalog]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/catalog-summary.json
[provenance]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/data-provenance.json
[canvas]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/ui-styling/references/canvas-design-system.md
[slide-layout]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/slides/references/layout-patterns.md
[slide-copy]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/slides/references/copywriting-formulas.md
[slide-html]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/slides/references/html-template.md
[slide-strategy]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/.claude/skills/slides/references/slide-strategies.md
[copy-brand]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/cli/assets/skills/brand/SKILL.source.md
[copy-design]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/cli/assets/skills/design/SKILL.source.md
[copy-system]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/cli/assets/skills/design-system/SKILL.source.md
[copy-slides]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/cli/assets/skills/slides/SKILL.source.md
[copy-banner]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/cli/assets/skills/banner-design/SKILL.source.md
[copy-styling]: ../sources/exskills/ui-ux-pro-max-skill-main/ui-ux-pro-max-skill-main/cli/assets/skills/ui-styling/SKILL.source.md
