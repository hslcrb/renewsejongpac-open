# Control States and Edge Cases

Read this when user input changes the screen: forms, selection lists, dates, tabs, and popups.
A polished initial screen is insufficient if selection changes dimensions unexpectedly, or the expanded UI, focus, and submitted value disagree.
Choose only the **controls that actually exist or are affected by this change**. Do not apply every case to every page.

## Relevant Detail Guides

| Target | Read |
| --- | --- |
| Selects, dropdowns, searchable selection, multiselects, menus, popovers | [Selection controls](selection-controls.md) |
| Month calendars, date inputs, date ranges, booking slots | [Calendars and dates](calendar-and-date.md) |
| Shared states and adjacent controls below | The contracts and reproduction table in this guide |
| Agent reevaluation and independent calendar expectations | [Interaction evaluation material](../evals/interaction-evals.json) |

## 1. Define the State Contract Before Styling

Write one line for each applicable item per control. Follow an existing, verified library contract where one is available.

```text
Target / user task / actual meaning: single selection, text entry, action, etc.
Data: item ID, display label, draft value, committed value, submitted value, reset rules
Dimensions: stable axes, allowed wrapping/growth, minimum size, scrolling after maximum size
Expansion: rendering owner, anchor, alignment/gap, collision boundary, overflow behavior
States: default → hover/focus → open/editing → selected/loading → error/success → reset
Dismissal: value and focus after commit, cancel, outside click, Tab, Escape, or parent closure
Edge cases: shortest/longest value, 0/1/many items, removal/unavailability/late response, relevant devices
Acceptance evidence: independent expectations / before-and-after dimensions / real input / expanded view / unverified scope
```

`hug`/`fit-content`/`auto` are sizing strategies, not objectives. A single-line field changing height with each value may be a defect.
Growth for multiline chips, enlarged text, or error explanations may be intentional. First distinguish **axes that must remain stable from axes allowed to grow**.
Do not solve this by locking every control to one pixel height or truncating every string to one line.

## 2. Check Visible Dimensions and Internal State Together

- Distinguish the placeholder, value, search query, active highlight, and actual submitted value. Do not assume they are the same object.
- Compare the trigger's border box, text baseline, arrow position, and adjacent fields after changing a value.
  For unexpected changes, narrow the cause through `font`/`line-height`, default margins, border width, padding, icon boxes, flex shrink, and box sizing.
- Do not add borders on hover, focus, or error that change the total dimensions. Consider changing the color of an existing border of equal width, or an indicator that does not affect layout.
- Define space for clear buttons, validation icons, and spinners. Prevent text overlap or displaced arrows without forcing empty slots into every field.
- `disabled`, read-only, loading, no items, no permission, and validation errors are distinct states. Define their visual, focus, and submission behavior separately.
  Verify that a custom control marked only with `aria-disabled` cannot still execute through clicks or keyboard input.
- After a parent condition changes, an item is removed, the form resets, navigation goes back, or the UI reopens, check that the displayed value and actual data agree.
  Do not unnecessarily clear valid selections or silently replace missing values with the first item.

## 3. Reproduction Table for Adjacent Components

| Situation / reproduction input | Expected behavior and verification |
| --- | --- |
| **Text and numeric inputs** — Korean IME composition, paste, whitespace, `0`, `01`, decimals, clearing | Separate the string being edited from the committed number. Do not truncate composition text or submit prematurely on Enter. Domain rules determine allowed units, decimals, negatives, and whitespace; do not silently turn an empty value into zero. |
| **Form errors** — long messages, multiple errors, a late validation response after correction | Preserve the association between values and errors. Leave readable space for explanations and update only the relevant error after correction. Do not steal focus on every keypress; make the required correction discoverable after failed submission. |
| **Checkboxes, radios, switches** — label click, Space, movement within a group, disabled state | Displayed state, accessible state, and saved/submitted value agree. The label operates its associated input. Do not simulate selection by changing only a pseudo-element without an actual input. |
| **Buttons and saving** — rapid double clicks, repeated Enter, delay, failure, retry | Pending text and spinners do not unexpectedly change button width. Prevent consequential duplicate operations in both the UI and the relevant data layer. Allow correction and retry after failure; do not show completion before the result arrives. |
| **Search and filters** — rapid A→B queries, reversed responses, no results, reset | Apply only results matching the latest conditions. Distinguish zero results, loading, and errors while preserving the query. Do not indiscriminately send focus or scroll to the top after searching. |
| **Tables and pagination** — deletion on the last page, sorting/filter changes | Move to a valid page instead of leaving the user on an empty page. Select rows by ID, not index. Explain whether select-all covers the current page or all results, and follow the selection policy for removed or hidden items. |
| **Tabs and accordions** — panels of different lengths, asynchronous loading, removal of an open item | Define the panel height policy. Hidden panels leave the focus order, and the active tab remains reachable. When an open item is removed, move focus to the next logical location. Do not clip content to accommodate animation. |
| **Tooltips and popovers** — moving outside hover, keyboard entry, touch | Do not provide essential explanations only on hover. Do not hide operable buttons inside a descriptive tooltip. Use the appropriate popover/dialog pattern for interactive content, and update dismissal and focus policies accordingly. |
| **Modals and sheets** — nested selection popup, content scrolling, repeated opening/closing | Define the active layer and dismissal order. Escape intended to close only the top layer must not also close its parent. Release scroll locks, inert state, and backdrops after closing; choose a valid return target when the trigger no longer exists. |
| **Notifications and toasts** — repeated errors, consecutive successes, disappearing before they can be read | Do not announce duplicate status messages indefinitely. Do not make a temporary toast the only place to recover. Automatic notifications must not take focus from the current task. |
| **Asynchronous images and uploads** — failure, cancellation, retry, removal from the list | Plan space for aspect ratio and progress. A late completion response must not restore a removed item. Allowed formats, size limits, results, and errors must reflect actual processing. |
| **Scrolling, sticky elements, virtualized lists** — long lists, offscreen selection, fixed footer | Reveal the active item in the correct scroll container. Virtualization must not remove the accessible active item. Sticky headers and footers must not obscure focus or the final action. |

These cases do not by themselves require a new toolkit, backend, or complete screen redesign. Fix observed defects within the requested scope and current implementation.

## 4. Reveal Edge Cases with Focused Checks

1. **Independent expectations:** Establish the actual values, IDs, amounts, and calendar dates first. Do not use the app's current DOM or its own date-generation function as the answer key.
2. **State transitions:** Use real input for the applicable sequence—`open → navigate → select → reopen → cancel → reset`—rather than checking only an initial screenshot.
3. **Boundary combinations:** Choose combinations likely to fail: long value × narrow screen, open popup × scrolling, month end × next month, loading × changed conditions.
4. **Zoom and environment:** Check relevant intermediate widths and both sides of breakpoints, 200% zoom, before/after font loading or substitution, supported themes/high contrast, and RTL or mobile keyboards where applicable.
   Do not require exhaustive testing of every combination by default. Record high-risk combinations and environments that remain unverified.
5. **Evidence:** Compare dimensions at the same CSS width, font-loading state, and zoom. Distinguish allowed growth from rounding differences; do not conceal defects behind unjustifiably large tolerances.
   Record separate verification methods for OS popups, IME, physical-device keyboards, and screen readers. Changing `.value` and capturing the DOM are insufficient grounds for a pass.

The evaluation JSON contains prompts, expectations, and input material. Its existence or successful parsing does not mean an application's UI tests passed.
Record the contracts applied to the actual project and the before-and-after evidence. Follow [implementation review](implementation-review.md) for shared reporting principles.
