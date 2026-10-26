# Toss: spacious product storytelling

Read [named-styles.md](named-styles.md) first. This profile answers Toss / 토스 style requests through the supplied `toss.im` marketing homepage. It is not a specification of Toss's entire app, checkout, transaction flows or current live site.

## Evidence and confidence

Reviewed 2026-10-15. Source locator: `specialitye-archives/Toss/토스/`; manifest source `https://toss.im/`. Capture date is unspecified. The folder contains one homepage, its resources and a ZIP duplicate. All 552 loose files match the ZIP's file contents. All text files were scanned and classified; raster contact sheets and sampled video frames were inspected.

Offline desktop replay at 1440px exposed the large media hero, product demonstrations, spacious sections, translucent cards, editorial business panels and gradient footer. The replay reported a hydration error and some incomplete or blurred animation states. The 390px replay failed with a client exception. Therefore mobile values below are **CSS observations**, not successful mobile rendering or interaction verification. Neither this review nor the archive establishes current live behavior. The original archive and local replay captures may be absent from an installed skill copy.

## What produces the feeling

| Relationship | Observed character | Transfer to a new task |
| --- | --- | --- |
| Statement → demonstration | Large, short statements have substantial breathing room; a device, object or contextual scene explains the benefit | Give a useful claim one strong visual explanation. Use the customer's real product or service process; a phone mockup belongs only where the product warrants it |
| Hierarchy → pacing | Bold display text, quieter supporting text, and large scene-to-scene intervals; some scenes fill or pin to a viewport | Make the reading order immediately clear. Allow explanation to unfold at a comfortable pace while keeping the primary action reachable |
| Media → context | Lifestyle footage, product/object imagery, layered device screens and image sequences coexist | Show how the new subject is used. Create independent assets and a new focal composition; choose still imagery when video adds little |
| Ground → emphasis | White and quiet neutral surfaces dominate many sections; restrained blue, pastel/soft gradients and occasional dark scenes vary emphasis | Set color roles from the customer's brand. Use quiet grounds and purposeful contrast rather than covering the page in the reference accent |
| Grouping → material | Selected panels use large corners, translucent white, subtle borders, blur and low-contrast shadows; other scenes stay open | Use surfaces where they group a real demonstration or action. Maintain legibility and a solid fallback; apply material selectively |
| Interaction → stability | A header navigation technique reserves the heavier hover label's width; product scenes use reveals and state transitions | Stabilize control geometry across hover/selection, retain visible focus, and keep animation optional and interruptible |

The characteristic combination is calm explanation with expressive, media-led presentation. Blue buttons and rounded cards alone are an incomplete interpretation of this archive.

## Measured declarations, not mandatory tokens

Paths below are relative to the archive's `assets/`. Hashed class names identify evidence; do not carry them into new source code.

| Source locator | Declaration observed | Interpretation boundary |
| --- | --- | --- |
| `78a312d685e1071314234a09.css`, `._5jkbx00` | Display size 80px, line-height 1.2, weight 700, tracking -0.02em; responsive sizes 64/56/48/44px, with 44px at ≤768 and line-height 1.28. Body tokens include 18px/1.6 and 16px/1.6 | Component overrides exist: the replayed hero was 80px at 1440px. A token declaration is not every element's computed size |
| `e614eee3a78b80626bf6fc87.css`, `.havc0z2`, `.havc0z3` | Side gutters 160 → 128 at 1600 → 108 at 1440 → 48 at 1024 → 20px at 768; max-width 1920px | This creates a wide stage with protected text areas. Derive the new container and reading measure from its content |
| `050477ddd6d7d6a70c926723.css`, `._1wyxn11`, `._1wyxn12`, `._1wyxn1e:after` | Desktop header 64px; white background at about 75% alpha with 20px backdrop blur; hidden heavier label reserves width | Useful as a geometry/stability lesson. Actual contrast, focus and popup behavior need new implementation checks |
| `2884cfacae0d8e35f9218345.css`, `._1dl9ag81`; `aa16cfa46c056ca228e7e531.css` | Mobile header 56px; navigation switches at 1024px | Source-declared responsiveness only; the local mobile page did not render successfully |
| `a7be4d64f1f95936a8196e69.css`, `._1s59b400`, `._1s59b402` | Section padding reaches 240px vertically; large internal gaps; ≤768 uses 160px vertical and 20px side padding | Strong spaciousness, not a requirement for every form, table or mobile section |
| `67c1d2430ec345723b8892e9.css`, `._1w6z8z79`; `9a0d76e85b46a8db6945689c.css`, `._1r4q1bi6` | Selected white panel backgrounds at 40% alpha with blur 20px and radius 32px; separate mosaic tiles use radius 40px | Surface treatments belong to specific components. Do not make every field a giant glass card |
| `0e61869e7aef1262d7696dff.css` | Declares Toss Product Sans OTF, weights 400–800, `font-display: swap` | Font declaration is evidence, not a redistribution grant or proof of the resolved font. Choose a suitable project-owned or licensed Korean sans |
| `db076509d3fb26c0f7c6e255.css`; `e4e5569fc60b11a2fb05c164.css` | Reveal blur/translation/opacity and sticky viewport scenes, including a black scene | Archived animation code and sampled frames do not establish complete timing, accessibility or robust playback |

## Adaptation recipe

Start with a plain-language value statement, a recognizable customer-owned visual or functional demonstration, and the next useful action. Design the sequence around what visitors need to understand or decide. Alternate explanation and evidence only where that progression helps; the source's order of finance, shopping and business scenes belongs to its own product.

Use a clear display/body contrast and comfortable Korean line breaks. Choose a wide visual stage where assets deserve it, a readable text measure, and smaller related-content gaps inside larger section intervals. Example **new-project proposals** might start around 48–72px desktop display, 34–44px mobile display and 16–18px body; adjust to the actual font, copy, existing system and accessibility checks. These are not measured Toss defaults or instructions to replace approved tokens.

For a repair-service site, a short repair explanation beside an original annotated object can replace the device scene. Let category selection, estimate requirements and a clear request action drive the hierarchy. Keep costs and exclusions readable; do not invent app screens, customer results or an app-download CTA to resemble the reference.

For a dense application, transfer hierarchy, calm grouping, stable controls and restrained feedback. Preserve table comparability, row actions, filters and information density. A long marketing narrative or enormous scene spacing would interfere with that task.

On mobile, propose and test a new composition: text and demonstration in reading order, shorter vertical intervals, unclipped controls, comfortable body text and media that fits the viewport. Show essential content without waiting for a scroll animation. Provide a useful still/poster or ordinary flow when video, image sequences, sticky behavior or JavaScript fails. Reduced motion should retain the meaning and action in each scene.

## Review the result

- Can a reader understand the benefit and act without completing a cinematic scroll sequence?
- Do type scale, whitespace and a focused demonstration create the intended atmosphere, within the customer's brand?
- Are the composition, content, assets and reveal sequence independently designed for the new subject?
- Do hover weight changes, long labels, open menus and selected values preserve the intended control geometry and focus?
- At desktop, intermediate and mobile widths, do essential text/actions remain readable with media failure and reduced motion?
- Are archive declarations, local replay observations and fresh implementation checks reported separately?

Use the [interaction contracts](interaction-edge-cases.md), [motion guidance](motion.md) and required [code contract](code-and-markup.md) for implementation. The archive's blur, missing screens and mobile exception are defects or evidence gaps to avoid, not aesthetic instructions.
