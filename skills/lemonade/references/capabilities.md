# lemonade capability map

Use one invocation name: `$lemonade`. Choose the row that matches the task, then read only the resources it links.
All original guides, examples, data, code, fonts, and licenses are preserved internally. Resource names are not instructions to install separate skills.

## Unified routes

| Task | Start here | Also check |
| --- | --- | --- |
| New site, content portal, or redesign | [Core workflow](../SKILL.md), [wireframe](wireframe.md) | Actual task, reference screens, Korean text, responsive behavior, and states |
| Toss / Sejong Center style or named-site inspiration | [Named styles](named-styles.md) | Archive-backed signatures, independent composition, existing brand constraints and evidence limits |
| Write or review HTML, CSS, JavaScript, code formatting, or web standards | [Required code contract](code-and-markup.md), [acceptance cases](../evals/code-markup-evals.json) | Four-space authored code, semantics, baseline loading, fragments and verified behavior; preserve visual design |
| Search UI patterns, styles, colors, typography, icons, or stacks | [UI and brand](ui-and-brand.md) | The original search engine's domains, results, and recorded date |
| Brand, logo, corporate visuals, or social assets | [UI and brand](ui-and-brand.md) | Actual brand, usage size, editability, and provenance |
| Tokens, themes, components, or Tailwind/shadcn | [UI and brand](ui-and-brand.md) | Existing stack, semantic tokens, states, focus, and contrast |
| Banners, posters, or HTML presentations | [UI and brand](ui-and-brand.md) | Delivery format, audience, copy, data, and actual output size |
| Direction exploration, micro-interactions, GSAP, or route transitions | [Motion and native](motion-and-native.md) | Necessary feedback, interruption and reversal, actual router, and cleanup |
| SVG, Lottie, ASCII, glass effects, or shaders | [Motion and native](motion-and-native.md) | Chosen visual purpose, assets, supported environments, and alternatives |
| Mobile web, Expo, or Swift/SwiftUI | [Motion and native](motion-and-native.md) | Actual platform, versions, input, safe areas, and devices |
| Review, performance, extreme content, or accessibility | [Critique](critique.md), [implementation review](implementation-review.md), [motion verification](motion-and-native.md) | Distinct evidence from measurements, visual inspection, actual tasks, and sources |

## Select former lemonade modes internally

The original entry documents and supporting files for these 14 modes are also preserved. Describe the desired task to lemonade instead of invoking the table entries as separate skills.
The current [shared principles](principles.md) govern decisions. Treat fixed aesthetic rules in older originals as references within the chosen visual direction.

| Original mode | When to use its material | Preserved original |
| --- | --- | --- |
| lemonade | Compare the previous core workflow, references, and tools with their originals | [Original](../sources/legacy/skills/lemonade/SKILL.source.md) |
| lemonade-brandkit | Compose brand identity and application examples into a board | [Original](../sources/legacy/skills/lemonade-brandkit/SKILL.source.md) |
| lemonade-image-to-code | Implement a supplied image or screen faithfully and responsively | [Original](../sources/legacy/skills/lemonade-image-to-code/SKILL.source.md) |
| lemonade-redesign | Improve an existing service while preserving its purpose, brand, and behavior | [Original](../sources/legacy/skills/lemonade-redesign/SKILL.source.md) |
| lemonade-imagegen-web | Generate web visual directions or assets | [Original](../sources/legacy/skills/lemonade-imagegen-web/SKILL.source.md) |
| lemonade-imagegen-mobile | Generate mobile visual directions or assets | [Original](../sources/legacy/skills/lemonade-imagegen-mobile/SKILL.source.md) |
| lemonade-soft | A direction using soft materials and restrained depth has been chosen | [Original](../sources/legacy/skills/lemonade-soft/SKILL.source.md) |
| lemonade-minimalist | A direction centered on typography and whitespace has been chosen | [Original](../sources/legacy/skills/lemonade-minimalist/SKILL.source.md) |
| lemonade-brutalist | A direction using strong typography and an industrial character has been chosen | [Original](../sources/legacy/skills/lemonade-brutalist/SKILL.source.md) |
| lemonade-output | Complete the result without missing implementation or fake connections | [Original](../sources/legacy/skills/lemonade-output/SKILL.source.md) |
| lemonade-stitch | The user requests work with an available Stitch tool | [Original](../sources/legacy/skills/lemonade-stitch/SKILL.source.md) |
| lemonade-gpt | Consult specific design patterns from the previous GPT guidance | [Original](../sources/legacy/skills/lemonade-gpt/SKILL.source.md) |
| lemonade-v1 | Compare the initial dial and style system | [Original](../sources/legacy/skills/lemonade-v1/SKILL.source.md) |
| lemonade-v2-experimental | Compare experimental dials, blocks, and motion directions | [Original](../sources/legacy/skills/lemonade-v2-experimental/SKILL.source.md) |

If image generation, Stitch, or rendering tools are unavailable in the current environment, distinguish deliverables you can produce from capabilities still required. A tool name in an original guide is not evidence that the tool ran.

## Find originals and related files

```bash
node <skill>/scripts/knowledge.mjs --list
node <skill>/scripts/knowledge.mjs --id web/svg-animation
node <skill>/scripts/knowledge.mjs --id animation/animate-expo
node <skill>/scripts/knowledge.mjs --id code/limsflex
node <skill>/scripts/knowledge.mjs --search "layout typography"
```

Search covers the original guides' metadata and bodies. Find detailed supporting files through the original links or [original-path resolution](source-library.md).
Use the [UI search engine](ui-and-brand.md) to search rows in the UI data. To search text across the preserved tree, scope `rg` to the necessary subfolders.
