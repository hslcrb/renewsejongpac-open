---
name: lemonade-imagegen-web
description: Use when generating website or individual section reference images, visual directions or website mockups. This mode produces images; use lemonade-image-to-code for implementation.
---

# lemonade - Web concepts

Generate implementable visual references with deliberate hierarchy and real content roles.

## Shared judgement

Read [lemonade principles](../lemonade/references/principles.md) for visual work. User intent, existing brand/content/behavior and accessibility take priority over the detailed mode presets. Use **lemonade / 레모네이드** for this skill brand; retain the actual client brand in outputs.

## Mode invariants

Read supplied references before generating. Choose section families from content tasks rather than a fixed hero/features/pricing sequence. Use readable individual section images when details matter. Preserve brand, practical metadata and primary actions. Functional cards, icons and rules are allowed. Generation is not a substitute for enlarging a supplied original.

## Reference study

For a large reference image or page composition, read [wireframe analysis](../lemonade/references/wireframe.md). Compare task, required fields, density, media geometry and hierarchy. Distinguish observed pixels from inferred behavior. Use `node <lemonade>/scripts/references.mjs --role <role>` to select observed cases; source records disclose live access limits.

## Detailed choices

Consult [workflow.md](references/workflow.md) for the relevant mode-specific techniques. Search its headings and read the portion needed by the brief. The shared priorities above govern any conflicting hard stylistic rules. Use available image tools only; disclose unavailable generation or browser verification.

## Review

Verify actual content, reference fidelity, readable Korean/Latin type, state clarity and the intended output. For coded pages, review desktop and 390px mobile, keyboard behavior, clipping and contrast. For raster concepts, describe which behaviors still need implementation and testing. Record source, adopted decisions, counterexamples and limitations; improve from demonstrated failures using [learning-loop.md](../lemonade/references/learning-loop.md).
