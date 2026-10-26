---
name: lemonade-image-to-code
description: Use when implementing a supplied screenshot, image or selected mockup as a faithful responsive frontend, or when an explicitly requested image-first design workflow must be turned into code.
---

# lemonade - Image to code

Read the reference at original pixels and implement its information hierarchy faithfully.

## Shared judgement

Read [lemonade principles](../lemonade/references/principles.md) for visual work. User intent, existing brand/content/behavior and accessibility take priority over the detailed mode presets. Use **lemonade / 레모네이드** for this skill brand; retain the actual client brand in outputs.

## Mode invariants

Use the supplied image first. Crop and zoom it for inspection; do not regenerate it to avoid examining details. Generate new concepts only when requested or when missing design decisions require them. Record section geometry, type roles, media crop, content and states. Check the implementation beside the source at matching widths, then recompose mobile without losing required fields.

## Reference study

For a large reference image or page composition, read [wireframe analysis](../lemonade/references/wireframe.md). Compare task, required fields, density, media geometry and hierarchy. Distinguish observed pixels from inferred behavior. Use `node <lemonade>/scripts/references.mjs --role <role>` to select observed cases; source records disclose live access limits.

## Detailed choices

Consult [workflow.md](references/workflow.md) for the relevant mode-specific techniques. Search its headings and read the portion needed by the brief. The shared priorities above govern any conflicting hard stylistic rules. Use available image tools only; disclose unavailable generation or browser verification.

## Review

Verify actual content, reference fidelity, readable Korean/Latin type, state clarity and the intended output. For coded pages, review desktop and 390px mobile, keyboard behavior, clipping and contrast. For raster concepts, describe which behaviors still need implementation and testing. Record source, adopted decisions, counterexamples and limitations; improve from demonstrated failures using [learning-loop.md](../lemonade/references/learning-loop.md).
