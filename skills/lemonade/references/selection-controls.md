# Selection Controls: Dropdowns, Search, and Popups

Apply the [shared state contract](interaction-edge-cases.md), then read only the sections relevant to the actual selection pattern.

## 1. Start with Meaning and Rendering Ownership, Not Appearance

| Task | Appropriate starting point and checks |
| --- | --- |
| Choose one form value from a short list | A native `select` or the existing design system's selection component. Compare default OS behavior with product requirements. |
| Type to search for candidates | An editable combobox. Separate the input string, active candidate, committed value, and search request state. |
| Choose multiple values | The existing multiselect/listbox contract. Define chip removal, count, clear-all, wrapping, and keyboard behavior. |
| Execute an action | A pattern suited to actions, such as a menu button. Do not automatically assign `role=menu` to a list of selectable values. |
| Navigate, reveal filters, or show details | Preserve the semantics appropriate to the content: actual links, disclosures, popovers, and so on. Similar appearance does not make every control a combobox. |

Native controls are a valid choice. Keep them when standard forms and the mobile OS selection experience fit the task. **Review the closed trigger and expanded list separately.**
Applying `appearance: none` to a conventional select does not guarantee matching design for OS-rendered options or pickers.
When the expanded list needs controlled typography, groups, search, icons, or placement, first consider an accessible primitive in the existing stack and verify its behavior.
If choosing the newer customizable select with `base-select`/`::picker(select)`, check target-browser support, SSR compatibility, and fallbacks.
Do not infer support from a fixed version table or one development browser. See [MDN select](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select) and [customizable select](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select).

## 2. Dimension Contracts Before and After Selection

| Reproduction | Expected result / causes to inspect |
| --- | --- |
| **S1.** Placeholder → one character → long Korean name → Latin letters and numbers | A single-line trigger preserves its declared height, padding, and baseline. Check whether only the selected value receives different heading/p margins, line-height, font-weight, or icon dimensions. |
| **S2.** Switch between focus, error, disabled, and loading | Border widths and icon slots do not introduce unexpected size changes. Communicate states through necessary explanations and semantics as well as color. |
| **S3.** Longest value, narrower width, 200% zoom | Define shrink/`min-inline-size`, truncation, and wrapping for the text region. Provide a way to read the full value without relying solely on a hover `title`. Allow growth required by enlargement. |
| **S4.** 0→1→many chips, a long chip, removal of a middle chip | Follow the multiselect's growth, maximum-height, and scrolling policy. Keep removal buttons and the search input visible. Do not impose one fixed single-line height on every selection control. |
| **S5.** Options with or without subtitles, icons, and checkmarks | Align columns for primary labels, subtitles, and checkmarks. Allow height differences for genuinely multiline rows while preventing subtle differences between structurally identical rows caused by default margins or icon boxes. |

Prefer the current project's sizing tokens. Before adding an arbitrary `height: 40px`, inspect computed styles and actual boxes for the trigger, value wrapper, and option rows individually.
If the outer width of a modal or page shifts when the UI opens, also check scrollbar and scroll-lock changes. Choose techniques such as a stable gutter according to the target environment.

## 3. Popup Position and Layers

Before manually nudging an expanded list a few pixels, define its **anchor / alignment / gap / width / collision boundary / maximum height / scroll owner**.
Its default placement stays consistently connected to the trigger. When space below is insufficient, a defined flip/shift policy keeps it accessible.
Opening upward because of a collision is not inherently a defect. Incorrect alignment, excessive gaps, obstruction, and lost input are defects.

| Reproduction | Acceptance criteria |
| --- | --- |
| **S6.** Four viewport corners, page/nested-container scrolling, resize | The trigger and list remain connected, and the last item is selectable within the actual available space. Check coordinate systems, transforms, and overflow clipping. Do not default to an enormous z-index. |
| **S7.** Open inside a dialog, render through a portal, change theme/RTL | The popup does not conflict with the active modal's focus/inert boundary. Fonts, color tokens, and `dir` remain correct through the portal. Moving content outside document flow is not the end of verification. |
| **S8.** Mobile keyboard, browser-bar changes, rotation, zoom | Update position and height for the visible viewport and safe area without screen jumps from unnecessary scrollIntoView calls. Clean up listeners and scroll locks when the keyboard closes or the popup disappears. |
| **S9.** No results, error, loading, very many options | Status explanations and retry are reachable, and list scrolling does not hide bottom actions. Keep the active item visible. Also check for an initial flash at 0,0 before positioning. |

An on-screen keyboard can change the visual viewport independently of the layout viewport. Check real-device behavior and the positioning engine already in use;
do not apply a second correction to a library that already handles `visualViewport` offsets. See [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).
The OS may own native picker placement. Do not claim to have controlled an OS popup by moving DOM coordinates.

## 4. Focus Indicators and Keyboard Model

When an unwanted stroke appears, first distinguish the **wrapper border / input outline / library ring / selection indicator**.
Consolidate duplicate indicators into a coherent brand treatment while keeping keyboard focus clear. Do not conceal the problem with global `outline: none`, unconditional `blur()` after opening,
or `tabindex=-1` used to hide focus. Check outline clipping, offset, distinction from error borders, and high-contrast themes.

`:focus-visible` follows browser heuristics; it is not simply a switch for “show on keyboard, remove on click.” Text inputs may show it after a click.
Verify the intended indicator with actual Tab/Shift+Tab and pointer input. See [MDN :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible).

| Reproduction | Acceptance criteria |
| --- | --- |
| **S10.** Open → arrow keys → Enter → reopen → Escape | Distinguish the active item from the committed value. Match selection-on-focus, Enter commitment, and Escape cancellation to the chosen pattern; do not turn one pattern's contract into a global rule. |
| **S11.** Tab out, outside click, inside click, nested Escape | Do not impose a modal focus trap on a nonmodal list. Check whether an inside press is misclassified as an outside click or blur closes the UI before selection. Do not close the parent modal at the same time. |
| **S12.** Close after the trigger is removed/disabled or the screen changes | Do not force focus back to a hidden or removed trigger. Choose the next logical element and check for unintended focus loss to the body. |

Verify roles, accessible names, expanded state, and selected state in the actual DOM and with assistive technology. With `aria-activedescendant`, keep the DOM focus owner and
active-item ID consistent, and ensure the referenced item still exists after rerendering or virtualization. Preserve labels, submittable values, and required/disabled/reset behavior.
Consult the relevant keyboard pattern in [WAI-ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). Example code does not replace accessibility verification in the product.

## 5. Less Visible Data and Search Boundaries

| Reproduction | Acceptance criteria |
| --- | --- |
| **S13.** Two items with the same name, ID `0`, empty value, reordered items | Do not store selections by display string or array index. Distinguish items through their IDs and descriptions; a falsy check must not discard a valid zero. |
| **S14.** Selected item removed/unavailable, parent field changes, reset | Update validity, explanations, submitted value, and dependent amounts together. Follow the task contract when deciding whether to preserve a still-valid value or clear it after a change. Do not submit an arbitrary first option. |
| **S15.** Enter during Korean IME composition, reversed A→B search responses, retry after failure | Do not select or submit prematurely during composition. Apply results only for the latest query, and distinguish the input string from the committed value. List navigation must not intercept text-editing keys. |
| **S16.** Form submit/reset, click, touch, keyboard input | The visible selection and FormData or the app's submission payload contain the same independently expected ID. Value-injection checks alone do not demonstrate correct keyboard, OS-list, or IME behavior. |

If an open native list is absent from a DOM screenshot, inspect the actual target OS/browser screen or record that state as unverified.
Do not claim to have reviewed option styling from a screenshot of the closed trigger alone. Record supported environments and the minimum verification combinations using the [shared verification procedure](interaction-edge-cases.md).

Official documentation checked: 2026-10-14. Recheck browser and library support during implementation.
