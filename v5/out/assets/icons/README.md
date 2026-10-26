# Material Symbols Rounded

Google Material Symbols, Rounded family, weight 400, grade 0, optical size 48.
The complete set includes 3,929 icons in both unfilled and filled variants
(7,858 SVG files under `rounded/`). Other families and weights are not included.

These Google designs are distributed through the community-maintained
[`@material-symbols/svg-400` 0.48.0](https://www.npmjs.com/package/@material-symbols/svg-400/v/0.48.0)
package, which optimizes SVGs from Material Symbols. Google upstream:
<https://github.com/google/material-design-icons>. Distribution source:
<https://github.com/marella/material-symbols/tree/main/svg/400>.
Apache License 2.0 is preserved in `LICENSE`.

Run `python3 scripts/vendor-material-icons.py` from the project root to reproduce
the download. The script verifies the pinned SHA-512 archive integrity before
extracting assets, writes the inventory to `catalog.json`, and builds a sprite
containing only the 25 symbols used by the site. Runtime has no package, CDN,
icon-font, or network dependency beyond this static server.

Both site versions share `material-symbols.js` and `material-symbols.css`.
`icon(name, size)` preserves existing aliases, dimensions, inherited colors,
decorative accessibility semantics, and selected favorite states. The version
selector and back-to-top controls use the same sprite directly, including when
JavaScript is unavailable. Illustrations, maps, posters and brand artwork are
not UI icons and retain their existing assets.
