---
name: lemonade-imagegen-mobile
description: Use when generating mobile app screen concepts or visual flows for iOS, Android or cross-platform products. This mode produces visual references; implementation belongs to a separate request.
---

# lemonade - Mobile concepts

Make coherent, readable app-native screen concepts for the actual flow.

## Shared judgement

Read [lemonade principles](../lemonade/references/principles.md) for visual work. User intent, existing brand/content/behavior and accessibility take priority over the detailed mode presets. Use **lemonade / 레모네이드** for this skill brand; retain the actual client brand in outputs.

## Mode invariants

Preserve product tasks, navigation continuity, content and meaningful selected/error/empty states. Inspect reference screens at readable size before designing variants. Show critical screens individually when a broad board makes text unreadable. Respect platform constraints and existing brand; do not imply a raster mockup is an interactive or tested application.

## Reference study

For a large reference image or page composition, read [wireframe analysis](../lemonade/references/wireframe.md). Compare task, required fields, density, media geometry and hierarchy. Distinguish observed pixels from inferred behavior. Use `node <lemonade>/scripts/references.mjs --role <role>` to select observed cases; source records disclose live access limits.

## Detailed choices

Consult [workflow.md](references/workflow.md) for the relevant mode-specific techniques. Search its headings and read the portion needed by the brief. The shared priorities above govern any conflicting hard stylistic rules. Use available image tools only; disclose unavailable generation or browser verification.

## Review

Verify actual content, reference fidelity, readable Korean/Latin type, state clarity and the intended output. For coded pages, review desktop and 390px mobile, keyboard behavior, clipping and contrast. For raster concepts, describe which behaviors still need implementation and testing. Record source, adopted decisions, counterexamples and limitations; improve from demonstrated failures using [learning-loop.md](../lemonade/references/learning-loop.md).
