<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/logo-light.svg">
  <img src="assets/brand/logo.svg" alt="lemonade" width="320">
</picture>

# lemonade

Design and implement websites, UI, brands, motion and visual content through one entrypoint, [SKILL.md](SKILL.md). Inspect large images at sufficient scale to understand their information structure, then compose around the role and content.
The user's references, brand, behavior and accessibility needs take priority over style presets.
Maintained instructions and documentation are in English; output language follows the user's request. Preserved originals retain their original languages and bytes.

- [Board analysis](references/wireframe.md): eight section roles and individual inspection regions.
- [Named-site inspiration](references/named-styles.md): Toss and Sejong Center profiles, archive-backed visual relationships and original adaptation within the customer's brand.
- [Named-style evaluations](evals/named-style-evals.json): domain transfer, fixed brands, archive absence, combined references and code-only scope.
- [Observed cases](library/reference-cases.json): observations, comparisons and access limits for 12 GDWEB static captures.
- [Update process](references/learning-loop.md): improve rules through failures and counterexamples.
- [Reference evaluation scenarios](evals/reference-evals.json): a Korean venue, existing brands, small edits and large images.
- [Interaction boundaries](references/interaction-edge-cases.md): reproduction criteria for dropdown size, popups, focus, calendars, dates, input and asynchronous states.
- [Required code and markup contract](references/code-and-markup.md): four-space authored code, custom class names, native semantics, baseline CSS, fragments and web standards, integrated from limsflex without visual presets.
- [Code acceptance cases](evals/code-markup-evals.json) and [adaptable code assets](assets/code/README.md): observable verification criteria and project-owned baseline resources.
- [Control evaluation specifications](evals/interaction-evals.json): counterexample requests and independent date fixtures, distinct from executed UI results.
- [Capability map](references/capabilities.md): routes for web, brand, motion, native and image work.
- [Source library guide](references/source-library.md): search and verify 54 source guides across the initial 2,069-file snapshot and the separate limsflex import.
- [Logo](assets/brand/README.md): SVG wordmark and mark, skill-list icons and font attribution.

```bash
node scripts/knowledge.mjs --search "reduced motion"
python -B scripts/verify_sources.py --json
node scripts/references.mjs --role quick-access
node scripts/draw.mjs --list roles
node scripts/assets.mjs --help
node scripts/lint.mjs <project> --profile reference
node scripts/inspect.mjs <url-or-html> --profile reference --widths 1440,768,390
```

From a project, point commands to this skill's actual location. The default `reference` inspection profile treats style findings as review prompts
and actual breakage or contrast defects as issues to fix. Specify `house` only for the earlier strict style comparison.
Store work artifacts in the project's `.lemonade/`. The JavaScript tools require Node; the inspector also requires Chrome/Edge/Chromium.
Report what remains unverified when originals, a browser or network access are unavailable. This package creates no Git remotes or automatic update connections.

Distinguish the historical claim of 247 studied sites from the 181 bundled records. The 12 GDWEB reviews are separate observations;
they do not establish live mobile behavior, usability or conversion. Source lookup and preservation verification work from this folder alone.
With the full repository, installation and the ONSIL sample are documented in its root `README.md`. A standalone skill copy may not include the repository's examples or installers.
