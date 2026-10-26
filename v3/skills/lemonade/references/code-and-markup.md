# Code, Markup and Web Standards

Apply this contract before writing or reviewing web HTML, CSS and JavaScript. It integrates the implementation rules from limsflex into lemonade. It governs authored code, semantics and verification; it does not choose the visual design. Use [implementation review](implementation-review.md) for rendered results and [interaction contracts](interaction-edge-cases.md) for control behavior.

## 1. Scope and precedence

- Keep the requested colors, typography, density, spacing, shapes, dimensions, illustrations, effects, motion and composition. Rich visual expression remains valid. Do not import limstandards brand presets, mobile widths, component dimensions or screen templates.
- Explicit user instructions take precedence. Apply the current project's contracts and these code rules together. Preserve the existing stack, public interfaces, external library tokens and requested output format.
- Apply these rules to new and modified authored code within the task. Do not reformat unrelated files, vendor code, generated output, lockfiles or build artifacts. Distribution minification is separate from readable authored source.
- Use **four spaces per nesting level** in new or modified authored HTML, CSS and JavaScript. If an existing formatter or lint configuration conflicts, identify the conflict and establish a scoped configuration or documented resolution before delivery. Do not silently waive the rule, disable the formatter globally or rewrite the repository. Explain any unresolved constraint; explicit user requirements govern exceptions.
- A standalone HTML page normally includes a complete document and page CSS in a `<style>` element in its `<head>`. Preserve component/file boundaries in an existing app. Honor explicit HTML-only, separate-CSS or other delivery requirements; do not manufacture a document shell around a component.
- Implement required interactions with standard JavaScript or the project's established approach. A static screen does not need invented interactions, a new framework or a stack migration.

Four-space indentation, class naming, declaration layout, percentage alpha notation and group-ID conventions are lemonade code conventions, not requirements of the HTML or CSS specifications. Standards conformance also requires valid syntax, content models, supported behavior and accessibility checks. No checklist or passing linter establishes perfect compliance.

## 2. Readable authored source

Use one blank line between meaningful groups. Keep short tags on one line when readable. For long tags, place each attribute on its own line, indent attributes four spaces beyond the opening tag and align the closing `>` with that opening tag. Preserve meaningful whitespace, inline text boundaries, `pre` content and template output while formatting.

```html
<form class="search-form" action="/search" method="get">
    <label for="search_query">Search terms</label>
    <input
        type="search"
        id="search_query"
        name="q"
        autocomplete="off"
    >

    <button type="submit" class="search-btn">Search</button>
</form>
```

The underscore in this example's existing input ID is intentional: class naming rules do not authorize renaming IDs or breaking label relationships.

- New custom classes use lowercase **kebab-case** words with digits where useful: `hero-section`, `product-card`, `close-btn`, `is-active`, `has-error`, `sr-only`. Single words such as `title` are valid. Do not introduce a new BEM, camelCase or underscore class system.
- Reuse existing classes for the same role. Preserve framework utilities, vendor class names, existing shared helpers and public CSS/DOM APIs. Do not mechanically rename tokens in markup without their dependent CSS, JavaScript, tests and consumers. The convention does not rename CSS variables, arbitrary existing IDs or external classes.
- Top-level CSS selectors begin in **column zero, including inside `<style>`**. Declarations are indented four spaces. Selectors inside `@media` are indented four spaces and their declarations eight spaces; apply the same nesting principle to other blocks.
- Put each CSS declaration on its own line, one space after the colon and a semicolon after every declaration. The opening brace stays on the selector line; the closing brace matches its indentation. Separate blocks with one blank line. Avoid repeated explanatory comments or gratuitous blank lines.
- Write CSS `opacity` and color alpha values as percentages, such as `60%` and `rgb(0 0 0 / 20%)`. This is a **CSS notation rule**. JavaScript APIs such as `canvasContext.globalAlpha`, animation-library opacity values or other numeric API fields retain their required numeric values; never substitute percentage strings for numbers. Preserve existing token contracts and verify target support for chosen CSS syntax.
- Organize CSS as foundation/tokens, document, major regions, components, states and responsive adjustments, unless the project already has a suitable established organization.
- JavaScript block nesting uses four spaces. Keep the source readable and follow the existing module, naming and error-handling conventions. Do not change runtime behavior merely to make formatting uniform.

The following demonstrates indentation, not required layout values or a motion preset:

```html
<style>
.content-list {
    display: flex;
    flex-wrap: wrap;
}

.content-item {
    min-inline-size: 0;
}

.content-item.is-muted {
    opacity: 60%;
}

@media (prefers-reduced-motion: reduce) {
    .decorative-marker {
        animation: none;
    }
}
</style>
```

## 3. Foundation CSS and cascade

An HTML/CSS implementation must have a suitable, actually loaded CSS foundation. The [bundled default.css](../assets/code/default.css) is an **optional, adaptable starter**, not an automatic runtime dependency or a mandatory visual reset.

1. Inspect the project's existing `default.css`, reset, global stylesheet or equivalent foundation first. Reuse an appropriate foundation through its existing entrypoint; do not duplicate it in page styles.
2. If no suitable foundation exists, copy and adapt the starter into a real project path, such as `css/default.css`, or write a project-specific equivalent. Check box sizing, baseline margins, media sizing, form-font inheritance, keyboard focus and hidden/visually-hidden behavior as applicable. Preserve native controls and accessibility.
3. **Do not inject a new global reset into an existing app automatically.** Review the effects on shared pages and existing styles first. Reuse or adapt within the authorized scope; use a scoped foundation where appropriate instead of changing unrelated screens. Even margin resets, line-height, media display, table rules and focus styling can change the render.
4. Respect the actual cascade, including the project's reset/base layers and import order. Loading the foundation first is not sufficient in a layered app: normal unlayered author declarations outrank normal declarations in named layers. Never inject the starter's unlayered rules blindly into a layered framework. Integrate suitable rules into the project's intended foundation layer or existing entrypoint, then verify component and utility overrides. Important declarations reverse layer precedence; do not blindly wrap every behavioral rule in a layer. Resolve paths from the real HTML or app entrypoint. Confirm that the file exists, loads successfully and affects the intended page. A documentation link is not implementation. Never use the installed skill directory as a deployed runtime URL.
5. For a one-file deliverable, place the necessary foundation before page rules in `<style>` and clearly separate the two. For HTML-only delivery within an existing styled system, rely on and identify the actual existing foundation; honor the requested format.

Fonts, palette, layout and component skins belong to the product design, not a forced foundation. Do not invent unprovided font, asset or favicon paths. Keep native checkbox/radio appearance, meaningful list markers and link decoration unless a scoped component intentionally provides a working alternative. Do not globally suppress horizontal overflow.

Use `!important` only for a justified behavioral guarantee, such as protecting the ordinary `hidden` state, rather than as routine specificity management. Preserve the separate behavior of `hidden="until-found"` where supported. Check CSS overrides that can accidentally reveal hidden content. Do not apply broad descendant selectors to unrelated nested content; use classes or child relationships that match ownership. Inspect pseudo-elements, SVG fills and opacity composition to prevent duplicate icons and accidental double fading.

## 4. Semantic HTML and native operation

- A standalone page has `<!DOCTYPE html>`, an appropriate document `lang`, UTF-8 declaration, a descriptive `title` and a viewport declaration that permits zoom. A framework component respects the app's existing document shell.
- Choose elements by meaning: a meaningful heading hierarchy, `main` for the primary content, and appropriate `header`, `nav` and `footer` landmarks. A visual wrapper can remain a `div`; not every frame is a `section`.
- Respect element content models. A `p` accepts phrasing content; CSS display values do not determine HTML nesting validity. Use `li` for `ul`/`ol` items and do not nest interactive controls inside links or buttons. IDs must be unique, nonempty and contain no ASCII whitespace.
- Use an `a` with a real destination for navigation, a `button` for an action and the appropriate `input`, `select` or `textarea` for entry. Avoid placeholder `href="#"` actions and click-only `div` substitutes.
- Set `type="button"` on non-submit buttons in forms. Use meaningful `name`, `type`, `autocomplete` and applicable validation attributes such as `required`. Preserve server/API submission contracts.
- Give inputs associated labels. A placeholder is not a label. Use `fieldset` and `legend` for related inputs when appropriate.
- A selectable check item needs a checkbox. A static list of conditions or statuses needs list semantics; a decorative check icon does not make it an input.
- Give informational images useful alternative text and decorative images empty `alt`. Hide decorative SVG from assistive technology. Name icon-only buttons, for example with `.sr-only` text.
- Use native `disabled` when a native control is unavailable. If using `aria-disabled`, implement the actual interaction restriction too. Keep ARIA state synchronized with behavior.
- Prefer an appropriate native capability. ARIA supplements missing information; it does not automatically implement a custom control's keyboard, focus, form or disabled behavior. Use the [selection guide](selection-controls.md) and [date guide](calendar-and-date.md) for applicable controls.

## 5. Related groups and shareable fragments

Group related content according to purpose: `section` for a headed topic, `article` for independently meaningful content, `nav` for navigation, `ul`/`ol` for related items, and `fieldset`/`legend` for related form inputs. Keep purely visual wrappers as needed.

Give new authored meaningful content groups unique, stable, purpose-based kebab-case IDs. Preserve existing published fragment IDs, framework-generated control IDs and label/ARIA associations. For repeated public destinations, derive uniqueness from stable content identity, not the current array position, a random value or a framework hook intended for internal accessibility relationships. Do not mass-insert IDs into nested widgets or add IDs to every decorative wrapper. An ID alone is not an accessible landmark name; do not add `role="region"` to every group.

```html
<a href="#features">Explore the features</a>

<section id="features" class="feature-section">
    <h2>Features</h2>
    <p>Related information about this topic belongs here.</p>
</section>
```

Link with `href="#features"` on the same page or `page.html#features` from another page. A real anchor navigation updates the URL fragment; adding an ID alone does not. Do not replace this with a scroll-only fake link that leaves the URL unchanged. Static fragment navigation does not require JavaScript.

Verify unique IDs, matching targets, direct fragment entry, reload and browser back/forward navigation. Check that fixed or sticky headers do not obscure the target; use target `scroll-margin-top` matched to the actual header when appropriate. Renaming a group is not permission to break public URLs or accessibility relationships.

## 6. Responsive implementation without prescribing design

- Use normal document flow for text, Flexbox for one-dimensional alignment and sizing, and Grid where rows and columns must be controlled together. Do not add flex wrappers without a layout need.
- Use `gap` and alignment properties for relationships, not empty elements, repeated whitespace or fixed `top`/`left` coordinates. Preserve actual content and required reading order.
- Address intrinsic sizing: a flex item with long content may need `min-width: 0` or logical `min-inline-size: 0`, suitable wrapping, and a vertical scrolling region may need `min-height: 0`. Do not distort image ratios or squeeze button labels.
- Use wrapping, max widths and content-driven media queries appropriate to the design. Inspect long words, URLs and translated text. No imported fixed mobile width or component size is required.
- Keep the DOM reading and keyboard order meaningful. Do not use `order` or reversed flex directions as the only means to correct a meaningful content sequence.
- Absolute positioning, overlap and elaborate decoration are valid when appropriate. They must not turn the primary body, form or card collection into a fixed-coordinate composition that loses content or breaks reading/focus order.
- Fix overflow causes instead of masking them with global `html, body { overflow-x: hidden; }`. Give inherently wide content, such as a data table, an appropriately scoped, reachable scrolling region when necessary.
- Preserve visual intent while fixing implementation defects. Compare affected render states before and after foundation, semantics or formatter changes; whitespace, native defaults and selector specificity can alter layout without an explicit design edit.

## 7. Accessibility and actual behavior

Check keyboard access and visible focus, including Tab/Shift+Tab and the Enter, Space, arrow or Escape behavior appropriate to the implemented control. Never remove outlines without a working visible alternative. A `currentColor` outline still needs inspection for visibility and contrast in the actual surrounding design. Verify opening, closing, focus entry/return and nested-layer behavior for dialogs and popups. Do not add fake interactions that imply an unimplemented workflow is complete.

Do not communicate state or error solely through color. Provide relevant text, associated descriptions and accurate `aria-invalid`/`aria-describedby` where applicable. Use a live region appropriate to the purpose for dynamic announcements.

Check the relevant WCAG 2.2 AA contrast criteria: normal text at least 4.5:1; large text at least 3:1, where large is 18pt or 14pt bold (24 CSS px or approximately 18.67 CSS px bold). Required visual information for identifying UI components and states generally needs 3:1 against adjacent colors. Apply the actual criterion and exceptions, including inactive controls; do not treat every decorative boundary as required. Inspect image-backed text and applicable hover/focus states.

Verify text resizing to 200% and reflow at a width equivalent to 320 CSS px, including 400% browser zoom from a suitable starting viewport. These are distinct checks. Preserve content and operability without unnecessary two-dimensional scrolling, with applicable exceptions for inherently two-dimensional content. Inspect real long content and enlarged text, not just a narrow screenshot.

Motion remains a design choice. Under `prefers-reduced-motion: reduce`, reduce or stop decorative travel and continuous animation while preserving understandable state changes. A foundation rule that disables smooth scrolling does not complete every component's motion accommodation.

## 8. Verification and delivery

Check scoped indentation, custom class names, CSS declaration layout, real stylesheet paths/load order, DOM semantics, unique IDs and selector ownership. Use the project's applicable HTML/CSS validation, lint and build checks. Check target-browser support for chosen syntax and provide a suitable fallback when needed. Static validation and browser HTML error recovery are not equivalent to valid authored markup.

Exercise affected wide/narrow views, long content, text enlargement, keyboard input, reduced motion and required states in the browser. Compare the intended visual design before/after code-only changes. When checking frameworks, inspect both source and rendered DOM; a compiling component alone does not prove valid nesting or accessible output.

Choose the relevant [evaluation specifications](../evals/code-markup-evals.json) before verifying the result. Their presence is not a passing evaluation. Record performed checks, artifacts and limits separately; name unavailable browser, assistive-technology or conformance checks rather than claiming they ran. Deliver the completed code or target files first, followed by the useful verification details and remaining limitations.

Primary references for distinguishing conventions from requirements:

- [WHATWG HTML content models](https://html.spec.whatwg.org/multipage/dom.html#content-models)
- [WHATWG HTML ID requirements](https://html.spec.whatwg.org/multipage/dom.html#the-id-attribute)
- [WHATWG HTML hidden states](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute)
- [CSS Flexbox automatic minimum size](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)
- [CSS Flexbox reordering and accessibility](https://www.w3.org/TR/css-flexbox-1/#order-accessibility)
- [CSS Cascade Level 5: Cascade layers](https://www.w3.org/TR/css-cascade-5/#layering)
- [CSS Color Level 4: Opacity](https://www.w3.org/TR/css-color-4/#transparency)
- [WAI-ARIA landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
