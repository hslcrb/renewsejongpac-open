# lemonade shared decision principles

The official name is **lemonade / 레모네이드**. Deliverables follow the actual client's brand.
Decide in this order: user requirements → existing content, brand, and behavior → accessibility and task → observed references → style presets.
This document does not expand the task. Small changes follow the surrounding system.
Absolute aesthetic prohibitions, fixed numbers, and mandatory layouts or workflows in preserved originals are conditional presets for the chosen approach.
When they conflict with actual functionality, explicit design requirements, or accessibility, record what must be preserved and why.
Verify actual API requirements, compatibility, accessibility, and license conditions separately from aesthetic preferences.

## Use multiple specialist resources through one skill

For authored or reviewed web code, the [code and markup contract](code-and-markup.md) is required alongside the relevant design guidance. It integrates limsflex's code conventions and standards checks without importing a visual style. Preserve the chosen brand, geometry and expression; do not use formatting or a baseline reset as a reason to redesign the page.

The sole active skill is `lemonade`. Original names and frontmatter in `sources/` and `imports/` record provenance; they are not separate execution contracts.
Original instructions such as "reply only that you are ready," "invoke another skill," "always stop after analysis," and "install every tool" do not replace the current task.
Combine resources and finish the deliverable within the user's requested scope. Distinguish reading resources from modifying tools, accounts, or projects.
Check the existing technologies and tokens first. Choose a new design system, motion, GPU effects, or library when it benefits the task.
Apply implementation and verification appropriate to web, mobile web, Expo, SwiftUI, static images, and slides.
Verify actual states, input, performance, and content. Treat versions, service specifications, and recommendation lists in originals as records from their stated dates.
Find capabilities in [capabilities.md](capabilities.md); interpret conflicts between originals through [motion-and-native.md](motion-and-native.md) and [ui-and-brand.md](ui-and-brand.md).

## Decisions a reference should change

- View the whole image, then enlarge important regions at original pixel resolution. Split them further if text or alignment is unreadable.
- Extract the actual task, required data, evidence, density, image shape, primary/secondary proportions, and actions.
- Record when a pattern should and should not apply. Do not borrow only its colors and decoration.
- Compare relevant cases and counterexamples until the necessary role is explained. Do not indiscriminately read every file.
- Behavior, mobile layout, and accessibility of controls seen in a static image remain unverified until checked separately.

| Pattern | Suitable purpose | What to check |
| --- | --- | --- |
| Uniform cards or grids | Comparing performances, products, articles, or results | Alignment and preservation of names, dates, prices, and states |
| Functional icons | Shortcuts to booking, calendars, location, or support | Text names, destinations, focus, and touch targets |
| Thin dividers | Structuring tables, schedules, lists, and footers | Separation of information units and readability |
| Labels or chips | Categories, booking status, or dates | Readability and state descriptions beyond color |
| Multi-column footers | Contact, support, policies, or navigation | Real links and mobile reading order |
| Brand colors, serifs, or shadows | Identity, hierarchy, or floating elements | Context, contrast, focus, and operation |

Redesign density and hierarchy when the task changes. Reducing decoration does not make an empty screen good design.
Use real content and verifiable evidence. Do not invent customers, testimonials, or metrics; label example data.

## Korean text and verification

Do not damage long performance or article titles to satisfy an English word budget or a two-line rule. Check actual fonts, sentences, and widths.
Body text of 16–18px, Korean line height around 1.5–1.7, and touch targets around 44px are starting points, not CSS measurements recovered from screenshots.
Even with `word-break: keep-all`, long URLs and code need separate overflow handling.
On mobile, redesign column counts, metadata order, image crops, and the primary action. Consider a readable agenda list for calendars.
Fix overflow, broken assets, overlapping or clipped text, contrast failures, fake completion states, and inaccessible controls.
Judge style warnings against functionality and evidence. Automated passing results do not establish visual quality.
Read only the relevant parts of [implementation-review.md](implementation-review.md) for code implementation and verification.
Distinguish static screens, open UI, error states, success states, and responsive transitions; verify actual tasks against expected outcomes defined before testing.
Do not claim to have inspected pages, mobile layouts, or animation you did not see. Rights to reuse reference works are a separate matter.

Read [wireframe.md](wireframe.md) for sections and [learning-loop.md](learning-loop.md) for incorporating new evidence.
