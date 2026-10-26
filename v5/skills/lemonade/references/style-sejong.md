# Sejong Center: editorial program discovery

Read [named-styles.md](named-styles.md) first. This profile answers Sejong Center / SejongPAC / 세종문화회관 style requests through the supplied performing-arts venue exports. Translate its editorial structure into the new subject; the reference venue's identity, performances and institutional services remain its own.

## Evidence and confidence

Reviewed 2026-10-15. Source locators: `specialitye-archives/SEJONGPAC/세종문화회관/` and `specialitye-archives/SEJONGPAC-All/세종문화회관/`. Both manifests identify `https://www.sejongpac.or.kr/portal/main/main.do`; neither records a capture date. The first package is a homepage export. The larger package adds program/calendar, institutional, space, news, account and search pages, together with captured external pages.

Read the two exports together: their shared paths include both identical and changed files. Do not count them as independent visual references. Captured YouTube and Google authentication pages are outside this style profile. No standalone performance-detail HTML was captured; related CSS cannot establish how a complete detail page looked or worked.

Source inspection and offline desktop/mobile replay support the structural observations below. Replay includes missing imagery and capture/runtime limitations, so it does not establish complete live functionality, booking correctness, calendar arithmetic or accessibility. The original archives and local captures may be absent from an installed skill copy.

## What produces the feeling

| Relationship | Observed character | Transfer to a new task |
| --- | --- | --- |
| Frame → content | White ground, black typography, fine rules, aligned edges and explicit section boundaries | Use an editorial grid that helps comparison and gives varied artwork a stable setting |
| Display → detail | Expressive institutional headings contrast with compact operational text, date numerals and metadata | Give section identity and dates presence while keeping full names, venues and status easy to read |
| Artwork → information | A large multi-poster opening is paired with consistent text bands; further lists keep comparable fields together | Let original posters/artwork lead discovery while keeping usable text outside the image |
| Color → function | Saturated yellow highlights utility links, calendar emphasis and actions; cyan appears on category/feature bands and tabs | Assign intentional roles to the customer's accents. Retain textual selected, date and booking states |
| Discovery → action | Featured programs, a calendar and adjacent event information, editorial features and practical links serve different decisions | Choose the roles actually needed by the new program. Keep direct list/detail/booking routes available |
| Density → rhythm | Dense poster and information bands alternate with more open headings and service areas | Use local spacing and strong alignment to make many items comparable, without shrinking metadata or turning every section into a floating card |

This archive is a bold, ruled cultural portal with colorful artwork and operational detail. Preserve that relationship when appropriate; a generic muted arts landing page loses its distinctive information structure.

## Measured declarations, not mandatory tokens

Paths below are relative to the larger export's `assets/`. They locate observations, not reusable implementation files.

| Source locator | Declaration observed | Interpretation boundary |
| --- | --- | --- |
| `f8505db8d7b60c9c50a6fa96.css`, lines 1–30 and 53–79 | Outer width up to 1800px, 1px gray frame/rules, black 40px utility band, 90px main header, 20px/600 navigation | Retain explicit alignment and hierarchy where useful; a small event page does not need this navigation volume |
| Same file, lines 144–154 | Desktop nav hidden at ≤1440; ≤768 header becomes 60px with centered logo and hidden utility bar | Observe responsive changes in the target content; do not treat the same breakpoints as universal requirements |
| `7198f9d4edf01917ae3ed9df.css`, lines 1–15; font URLs in the manifest | CSS aliases `classic` and `modern` map to SCENBasicClassic-Medium and SCENBasicModern-Medium; body selects `modern` | Declarations and computed aliases do not prove every glyph's resolved font. Choose independently suitable, licensed heading/body faces with real Korean coverage |
| `850977ef070e5a4a14c89aec.css`, lines 101–108, 195–202 | Centered 56px classic page headings, 2px black divider, 60px lower padding and 80px following gap; mobile 35px heading, 30px padding and 40px gap | Strong heading/divider separation is transferable; derive actual measures from the new font and text |
| Same file, lines 216–241 | Rectangular cyan `#5fceea` tabs with 1px black borders; active tab black with white text; minimum 160px desktop width | A deliberately graphic tab system. Preserve semantics, wrapping and touch access in the new design |
| `c6d8b6db17c621ebe8945214.css`, main banner rules; `369add54bc889051339d8533.js` | Four poster columns with 150% image-box padding (2:3); title 24px/600, metadata 15px/500. Script changes visible count to 3/2/1 at 1024/768/500 | Protect actual poster art and readable text. The observed four-column opening is not required for every item count or medium |
| Same main CSS, calendar rules around lines 215–380 | 48px heading, 40px month label, seven-column ruled calendar, yellow `#ffe800` today state; mobile 26px month and in-flow event information | Calendar layout is observed; full date arithmetic and accessibility require independent implementation checks |
| Same main CSS, `#event`, `#intro`, `#board` | Four event features with 50px gaps and cyan title bands; two feature columns remain at 390px; three adjoining image service panels; 36px news headings and ruled rows | Feature cards and the poster hero have different mobile counts. Select roles and columns from actual content rather than replaying this exact page sequence |
| `f8505db8d7b60c9c50a6fa96.css`, footer rules around lines 443–457 | Black utility strip followed by white contact/legal area | The footer is not uniformly black. Build the customer's own practical footer with appropriate hierarchy |

## Adaptation recipe

Establish an original identity, a small set of grid lines and a clear rule hierarchy. Give artwork a substantial area, then provide real text fields in a consistent order: full title, date/time, venue, availability and next action as applicable. Repeat alignment to support comparison. Preserve poster text and distinctive crops; when the artwork does not fit the observed 2:3 housing, choose containment or a suitable alternative instead of cropping away essential information.

For a chamber music festival, the new program might use a strong festival/date heading and a ruled sequence of original concert posters, followed by a compact schedule and visit information. Give a featured concert prominence only when the program warrants it. The new subject determines its ordering, proportions and accents; do not reproduce the venue's full homepage with substituted text.

For one event, retain an expressive title, original poster, clear rule-based grouping and visible booking information. A month calendar, four-poster rail, membership panel and institutional news feed would invent unnecessary tasks. Existing customer colors take priority over reference yellow/cyan; translate their emphasis roles into the approved palette.

On mobile, recompose poster and metadata groups, reduce columns and allow long Korean titles to wrap. Keep dates, booking state and actions together. A readable agenda can accompany or replace a month view according to the task. Use the [calendar and date contract](calendar-and-date.md) for four/five/six rows, leap years, selected versus visible dates and keyboard navigation. Do not carry desktop popovers, a wide grid or fixed heights onto a narrow screen without testing.

If a carousel is actually required, provide previous/next, position and pause controls, accessible names and a direct route to all programs. The captured script's 500ms transitions and 7000ms autoplay interval are source observations, not mandatory timing or proof of keyboard/reduced-motion behavior. Source promo overlays, missing video and broken poster requests are not requirements for the new page.

## Review the result

- Do grid lines, expressive headings, artwork and comparable metadata form a clear editorial system?
- Can visitors find the full program and reach an appropriate next action without waiting for a carousel?
- Are full titles, dates, venues and availability readable at each target width and with enlarged text?
- Do accents reinforce hierarchy and state while the customer's identity remains distinct?
- Does each included calendar, list, service panel or news area serve real supplied content?
- Are the artwork, copy and composition original to this project, and are archive observations separated from new interaction checks?

Apply the required [code contract](code-and-markup.md) and [interaction contracts](interaction-edge-cases.md). Archive code, third-party player UI and exporter runtime are evidence to inspect, not the new project's implementation foundation.
