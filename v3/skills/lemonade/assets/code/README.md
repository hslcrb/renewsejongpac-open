# Code assets

Use these resources with the required [code and markup contract](../../references/code-and-markup.md). They implement code conventions and baseline behavior, not a visual direction.

- [default.css](default.css): an adaptable starter derived from the supplied limsflex baseline. Prefer an existing suitable project baseline. Copy or adapt only when needed, into the deliverable project; never load a skill-directory path at runtime.
- [.editorconfig](.editorconfig): a four-space starting configuration for authored web source. Use it in a new project or merge the relevant settings deliberately. Do not overwrite a project's existing formatter or global configuration.

The stylesheet is not visually inert. It changes margins, line height, media display/sizing, control inheritance and table layout. Inspect those effects against the approved design. Keep baseline and component styling separate, and respect the project's cascade layers: earlier unlayered rules can still outrank later normal rules in named layers. Do not blindly wrap all rules in a layer either; important-rule precedence and the existing layer order need review.

Keep native controls operable, inspect focus contrast on actual backgrounds, and retain the `hidden="until-found"` exception. The reduced-motion rule adjusts document scrolling only; component animation still needs its own behavior.

EditorConfig covers basic indentation. It does not verify HTML nesting, selector scope, CSS declaration layout, embedded `<style>` formatting, class names or accessibility. Use the project's compatible formatters/linters and the contract's explicit checks. Report an unresolved tooling conflict rather than claiming compliance.

The starter retains the supplied baseline behavior; its original bytes and provenance are preserved separately under `imports/limsflex/`. No separate license file accompanied that supplied material; see [NOTICE.md](../../NOTICE.md).
