---
name: lemonade
description: Use when designing, building, redesigning or reviewing websites, app interfaces, brand systems, visual assets or reference-based layouts, including Toss or Sejong Center inspiration; writing semantic HTML, readable frontend code and standards-conscious markup; implementing web animation, SVG, GSAP, Lottie, shaders, mobile web, Expo or SwiftUI interactions; choosing UI patterns, tokens and typography; or creating banners, posters and HTML presentations. Supports Korean typography, accessibility, performance and real interaction verification. Preserve the existing product and use only capabilities relevant to the requested artifact.
---

# lemonade

Study both the appearance and purpose of references, then design and implement interfaces, assets and interactions around the actual content.
The skill's name is **lemonade**. Apply the customer's own brand to the deliverable.
There is one entrypoint and installation name. The capabilities and preserved sources below are internal resources; they require no separate skill installation or invocation.
These maintained instructions are in English. Use the user's requested language for communication and deliverables; preserve Korean typography and content when appropriate.

## Decision priorities

Explicit user requirements → existing brand, content and behavior → accessibility and the actual task → observed references → style presets.
Choose cards, icons, dividers, status labels and colors for their purpose. Do not remove schedules, prices, performance names or booking states merely to eliminate a visual device.
Use [principles.md](references/principles.md) for shared criteria and [wireframe.md](references/wireframe.md) for reading images and choosing section roles.

## Route by task

Start with the task, identify the actual platform and existing system, read the relevant resources, implement, then verify that artifact.
Read only the relevant path for a small edit. Do not impose the web workflow below on native code or a standalone image task.
In commands, `<skill>` is the absolute path to this installed skill directory.

| Request | Read |
| --- | --- |
| Web composition, Korean typography, reference images, redesign | The web workflow below and [implementation review](references/implementation-review.md) |
| Named-site inspiration, including Toss or Sejong Center style | [Named-style translation](references/named-styles.md), then only the matching archive-based profile; preserve the customer's identity and compose original work |
| Any authored or reviewed web markup, CSS, or JavaScript | Required [code and markup contract](references/code-and-markup.md); code conventions and standards checks without a new visual direction |
| Dropdowns, forms, popups, focus, size changes, calendars, state boundaries | [Interaction contracts](references/interaction-edge-cases.md), then the relevant selection or date guide |
| UI/UX search, branding, tokens, components, logos, banners, slides | [UI knowledge and brand production](references/ui-and-brand.md) |
| Web motion, SVG, GSAP, Lottie, ASCII, effects, performance, accessibility | [Motion and native interfaces](references/motion-and-native.md) |
| Mobile web, Expo, Swift, SwiftUI, GPU shaders | The platform distinctions in [motion and native interfaces](references/motion-and-native.md) |
| Image-based implementation, image generation, brand boards, selected styles | The original modes in the [capability map](references/capabilities.md) |
| Finding sources, tools, data and licenses; verifying preservation | [Source library guide](references/source-library.md) |

```bash
node <skill>/scripts/knowledge.mjs --search "reduced motion"
node <skill>/scripts/knowledge.mjs --id design/ui-ux-pro-max
node <skill>/scripts/knowledge.mjs --id legacy/lemonade-image-to-code
```

The initial 53 source guides and the later limsflex import are preserved in their original languages, for 54 source guides in total. Read relevant portions of selected sources, not the entire archive.
Source greetings, readiness replies, separate installers and instructions to invoke other skills are not this skill's execution procedure. Interpret sources through this entrypoint and the shared principles.
Different style values and motion tables are conditional choices. Check and respect actual API constraints, accessibility needs and license terms.
Source lookup does not install software, sign in or open remote connections. Verify version-sensitive implementation facts against the actual environment and official documentation.

## 1. Content and task

Identify the subject, visitors, main action, stack, available assets and brand constraints. Label missing facts as assumptions.
Look for a distinctive place, process, work or story without inventing names, history, clients or results.
Record each section's **task / claim / evidence / required fields / item count / action / state** in one line.
Keep dates, locations, prices, categories and states in a comparable order across performance, product or article lists.

## 2. Inspect at sufficient scale

Prioritize the user's images. Read the overall hierarchy, then inspect regions at original-pixel scale for text, alignment, crops and controls.
Do not draw conclusions solely from a downscaled overview. Mark unclear text, fonts, exact CSS values and motion as unverified.
Do not mistake a reference board's outer frames, shadows or labels for elements of the actual site.
The repository-root image `와이어프레임 실습.png` is 12992×4984. Its roles and inspection coordinates are in [wireframe.md](references/wireframe.md).
If the package lacks the original image, use the analysis record without claiming to have inspected the original again.

## 3. Choose references

For a named-site style request, start with [named-styles.md](references/named-styles.md). Toss and Sejong Center have distinct observed profiles; translate their relevant visual relationships into the actual task. Keep archive observations, proposed design values and unverified behavior separate. These profiles do not authorize copying source assets or imposing a new style on code-only work.

`<skill>` refers to this skill directory. Filter recorded cases by the role needed.

```bash
node <skill>/scripts/references.mjs --list
node <skill>/scripts/references.mjs --role quick-access
node <skill>/scripts/references.mjs --id gdweb-26873
```

Compare relevant and contrasting cases for density, image format and purpose. Record why each choice was accepted or rejected.
When more evidence is needed, visit GDWEB's selected-work detail pages and the original sites. Record the URL, date, inspected area, observations and inferences.
Distinguish static captures from live visits. Awards, view counts and photographs alone do not establish conversion, usability or mobile behavior.
Check reuse rights separately before putting reference photographs in the deliverable. Do not pass them off as customer assets.

Use the existing library of 20 directions as candidates only when a new direction is needed.

```bash
node <skill>/scripts/draw.mjs --sector culture --brief "Actual subject and task" --sections list,showcase,contact,footer --options 3
node <skill>/scripts/draw.mjs --list roles
```

Skip random selection when the references and brand already establish a direction. Preserve an existing brand with `--keep palette,type`.
Design unsupported roles, such as calendars and news, directly. Do not change the user's information architecture to fit a blueprint.

## 4. Compose and implement

Nav, hero, quick-access, short-grid, wide-grid, flat-list, panel and footer are optional roles.
Do not put all eight on every page in a fixed order. Repeat alignment for comparable items; change composition when the task changes.
Define grid lines, reading width, primary/secondary proportions, type hierarchy, spacing and color roles. Keep the existing stack.
Read [implementation-review.md](references/implementation-review.md) when implementing. Design intrinsic image dimensions and CSS crops,
actual Korean fonts and body sizes, consistent content and states, and verifiable actions together.
Before writing or reviewing HTML/CSS/JavaScript, apply [code-and-markup.md](references/code-and-markup.md): four-space authored code, lowercase kebab-case for new custom classes, readable CSS declarations, semantic HTML, a verified project baseline, stable fragment targets and accessible native behavior.
This contract governs code and correctness. It does not choose colors, typefaces, spacing, dimensions, composition, visual density or effects. Preserve existing design and public/framework contracts; do not inject the starter reset or reformat unrelated files. Resolve formatter conflicts explicitly as described in the contract.
Check Korean with the actual font, width and word units. Do not damage long performance names or intentional three-line copy to satisfy English word counts or a two-line rule.
Preserve recognizable poster proportions. Check faces, objects and text when cropping photographs.
Do not mandate a photo count or video. If actual UI, illustration or typography better serves the task, record that choice.

Implement menu closed/open/focus states, filter selection/empty states, calendar dates/events and booking available/sold-out/upcoming states.
Define the [interaction contract](references/interaction-edge-cases.md) before implementing selection-dependent sizing, native/custom popup UI, positioning, focus and date arithmetic.
Distinguish stable axes from allowed growth, and active items from committed and submitted values. Separate a calendar's visible month, navigation date and selected date.
Give buttons real destinations or honest demo behavior. Do not describe a local demo as a completed save, booking or payment.
Check carousel previous/next controls, current position, keyboard support and autoplay pause. Do not hide essential content behind slide navigation.
Use motion to aid communication and interaction feedback; preserve content and actions with reduced motion.
If needed, use `node <skill>/scripts/assets.mjs --help` to find assets in open collections. Generate images only when a suitable tool is available.

## 5. Verify and refine

Inspect the desktop flow, zoom into important areas, check 390px mobile and intermediate widths, then test keyboard behavior and states.
Recompose columns and reading order for mobile while preserving titles, posters, required metadata and actions.
Check overlap, clipping and horizontal overflow with enlarged text. Passing automation does not establish visual quality or successful task completion.
Inspect open menus, scrolled booking dialogs, errors and success states as well as resting pages. Cross responsive breakpoints while the UI is open.
Define expected items, states, amounts and destinations before checking. Do not derive the only expected result from the rendered UI being tested.
Exercise relevant controls with short/long values, none/many, select/cancel and loading/error states. Check zoom, scrolling and keyboard input while open.
Do not hide defects by removing focus, fixing every control's height or replacing all native controls. Detailed criteria and reproduction inputs are in the [interaction evaluation specifications](evals/interaction-evals.json).
Before delivery, check applicable [code acceptance cases](evals/code-markup-evals.json): formatting, native semantics, baseline loading/cascade, fragment navigation and actual browser behavior. Use suitable project and HTML/CSS conformance validators; `lint.mjs` and `inspect.mjs` alone do not establish HTML, CSS or WCAG conformance. Separate code conventions from standards requirements and report checks that were unavailable.

```bash
node <skill>/scripts/lint.mjs <project> --profile reference
node <skill>/scripts/inspect.mjs <url-or-html> --profile reference --widths 1440,768,390
```

`reference` is the default. Review style warnings in context and against evidence; fix actual breakage and contrast defects.
Do not use `--allow` to hide real breakage. Specify `--profile house` only when the earlier strict style experiment is relevant.
Node and Chrome/Edge/Chromium are required for browser inspection. If unavailable, distinguish feasible checks from unverified behavior.
Store artifacts in the project's `.lemonade/`. Fix the largest problems first and inspect again. After two failed attempts at the same fix, report what you learned.
Retain failure reports and captures, then recheck affected screens and behavior after changes. Distinguish automation, visual observation and manual interaction.
For local samples, document the working directory, launch command, URL and shutdown method in an easy-to-find README.

## 6. Retain evidence

Briefly report references, composition decisions, functional checks and remaining limitations.
Find ONSIL's recorded implementation, fixes and verification with `node <skill>/scripts/references.mjs --id local-onsil`.
Do not present recorded passes as fresh runs or turn one sample's palette, fonts or card count into universal defaults.
Improve the skill through an observed failure, comparison with counterexamples, a narrow reusable rule and independent reevaluation.
Use [learning-loop.md](references/learning-loop.md) for updates. Do not promise continuous monitoring or automatic updates that were not implemented.

| Resource | When to use it |
| --- | --- |
| [capabilities.md](references/capabilities.md) · [source-library.md](references/source-library.md) | Choose capabilities; find and verify 54 source guides across the original snapshot and later import |
| [ui-and-brand.md](references/ui-and-brand.md) · [motion-and-native.md](references/motion-and-native.md) | UI, branding, visual deliverables, motion, native interfaces, shaders |
| [principles.md](references/principles.md) · [wireframe.md](references/wireframe.md) | Shared priorities, detailed image inspection, section roles |
| [named-styles.md](references/named-styles.md) | Requested Toss/Sejong Center inspiration, original adaptation, archive evidence and limits |
| `library/reference-cases.json` · `scripts/references.mjs` | Search observed board/GDWEB cases and recorded local implementations |
| [copy.md](references/copy.md) · [type.md](references/type.md) | Claims, evidence, line breaks, fonts and body text |
| [layout.md](references/layout.md) · [colour.md](references/colour.md) | Grids, mobile composition and color |
| [imagery.md](references/imagery.md) · [motion.md](references/motion.md) | Assets, crops, attribution and motion |
| [implementation-review.md](references/implementation-review.md) | Images, typography, state implementation, browser verification and handoff |
| [code-and-markup.md](references/code-and-markup.md) | Required web code conventions, semantic markup, baseline CSS and standards verification; no visual presets |
| [interaction-edge-cases.md](references/interaction-edge-cases.md) | Size, state and data contracts; selection/date guides and counterexamples |
| [critique.md](references/critique.md) · [tells.md](references/tells.md) | Render inspection and review of style intent |
| [research.md](references/research.md) | Methods and limitations of inherited research |

Distinguish the historical claim of 247 studied sites from the 181 bundled records. Do not cite inherited measurements or preferences as newly measured results or rules that override function.
