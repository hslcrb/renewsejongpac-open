# Colour

> lemonade 3.0: These are inherited study notes and optional house-style presets, not newly measured universal rules. Follow [principles.md](principles.md), the explicit brief and real content first. Default reference-profile style findings are advisory; functional cards/icons/rules/status labels and existing brand colors remain valid.


The direction sheet deals a palette with named roles. This file is how to apply it so the page looks
decided rather than tinted.

## Contents

1. What the study measured
2. The roles
3. Proportion
4. Surfaces without lines or shadows
5. Colour fields
6. Dark pages
7. Colour and photographs
8. Contrast
9. Palette style findings, and what "warm" means here

## 1. What the study measured

These are inherited gallery observations, not current measurements or rules that override a brand.
Use them as optional style evidence; see [research.md](research.md) for provenance and limitations.

- 41% of the studied pages are dark, 59% light. A quarter sit on pure white; 12% on pure black.
- Schemes, as the panel classed them: monochrome plus one accent 23%, light neutral 22%, dark neutral
  14%, several flat colours 13%, strictly two-tone 12%, colour carried by photographs 9%, one saturated
  field 6%.
- Buttons are neutral (black, white, grey) on 52% of sites. A coloured button is a choice, not a
  requirement.
- Gradient fills appear on 22% of the top-scored sites and 52% of the weak ones; gradient text on 2%
  against 13%.
- One site in 246 has a terracotta primary button and none has a violet one. Those are colours of
  generated pages, not of the gallery. Warm off-white grounds do occur (32 sites), nearly always with
  a dark or green ink rather than an orange accent.
- Top-scored sites change the page's field colour between sections more often (a median of two section
  grounds against one).

## 2. The roles

```css
:root {
  --bg: …;          /* the ground: most of the surface */
  --surface: …;     /* one tone step from the ground: filled panels, form fields, tiles */
  --ink: …;         /* main text and the strongest marks */
  --muted: …;       /* secondary text; still passes contrast on --bg */
  --accent: …;      /* the one accent */
  --accent-ink: …;  /* text on the accent */
  /* --field-1 … --field-n and their inks, when the palette has section fields */
}
```

Use the tokens for every colour in the build. A raw hex in a component is a second palette starting.
Do not add greys between the roles: if you need a quieter text, it is `--muted`; if you need a quieter
surface, it is `--surface`.

## 3. Proportion

For a restrained editorial direction, these shares are a starting palette composition to check in
the screenshot. They are not quotas for an existing brand or a functional content portal:

- **Ground:** 70–90% of the page.
- **Ink:** text and perhaps one inverted section (ink as ground, ground as ink).
- **Accent:** often under 5% in this preset, marking the action and a limited set of recurring elements.
  A broader brand field or useful state indicator can justify a different share.

Palettes with fields (flat-loud, pastel) work differently: each section is one field at full strength
and the proportion rule applies inside each section (field, its ink, nothing else).

Ink-led headings keep this preset restrained. Brand-colour headings, functional icons, borders and
underlines are valid when they support identity, hierarchy or navigation and maintain contrast.

## 4. Surfaces without lines or shadows

In a direction that omits decorative rules and shadows, tone can separate surfaces. Functional rules
and borders remain valid for schedules, lists, form fields and focus states:

```css
.panel { background: var(--surface); }          /* 2–6 lightness points from --bg */
.field { background: var(--surface); border: 0; } /* inputs: filled, with a clear focus state */
.field:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- One step is enough. If a panel does not read, increase padding or separate with space before
  reaching for a second tone.
- Avoid unnecessary nested panels; retain grouping when it clarifies a real task.
- Images do not need a frame. If a light photograph melts into a light ground, change the crop or set
  it on `--surface`, do not outline it.
- A thick bar can be a graphic element; a thin rule can separate information units. Choose by purpose
  rather than a fixed stroke-width ban.

## 5. Colour fields

A section that changes the whole ground colour is the strongest colour move available, and it replaces
dividers, cards and background decoration at once.

- Fields meet edge to edge with a hard line. Nothing fades.
- Every field has its own assigned ink from the palette. Never put `--muted` on a coloured field; use
  the field's ink at full strength, or at 70% opacity for secondary text if it still passes contrast.
- Neighbouring fields should differ in lightness, not only in hue, or the page vibrates.
- Order them like chapters: open strong, rest, surprise, close dark or very light.
- The page's meta theme colour and the navigation follow the first field.

## 6. Dark pages

- Put `color-scheme: dark` on the root so form controls and scrollbars follow.
- The ground is a deep tone with a slight tint from the palette, and the ink is a soft light, not
  `#fff` on `#000`, unless the palette deals exactly that for a stark two-tone direction.
- Secondary text is where dark pages fail: check `--muted` against the ground (4.5:1).
- Depth on dark comes from a lighter surface step, never from glows or coloured light.
- Use lighter font weights than you would on a light page.

## 7. Colour and photographs

- When photographs carry the colour, the interface stays neutral and takes its ink from the darkest
  tone in the imagery.
- Do not wash a photograph with the brand colour. Either leave it alone, or commit to a real treatment
  for every image on the page (all greyscale, or all untouched).
- Text over a photograph needs a calm region. If there is none, move the text off the image. A neutral
  scrim (black or the ink colour, 30–55% opacity, flat or fading over the text area only) is one
  useful treatment to test for legibility. The `reference` profile's gradient findings are style
  advisories, not a list of permitted treatments; image-backed contrast needs visual inspection.
- A flat field sampled from a photograph (its sky, its shadow) makes a section sit with that image.

## 8. Contrast

- Ordinary text needs at least 4.5:1; large text needs at least 3:1. "Large" follows the inspector's
  size/weight classification, not a display-class name. Check the actual colour pairing even when a
  supplied palette claims 7:1 for ink on ground.
- `inspect.mjs` computes text contrast on backgrounds it can resolve. A result below the required
  threshold is `FAIL` in both `reference` and `house`; `--allow` cannot suppress this correctness
  failure. It cannot reliably judge photograph-backed text: inspect that contrast separately.
- Do not lower opacity on text to make it "soft" unless you have checked the resulting ratio.
- Focus states and hover states increase contrast, never reduce it.

## 9. Palette style findings, and what "warm" means here

The inherited house preset flags these families as style signatures. They are advisory in the default
`reference` profile; select `--profile house` explicitly to use the legacy style gate:

- **Cream with terracotta.** A yellow-cream ground (roughly hue 22–62, light and noticeably
  saturated) with a rust, clay or burnt-orange accent is the house look of AI assistants and of the
  pages they generate according to the inherited panel interpretation. This is a style judgment,
  not evidence that the colours are inherently unusable.
- **Violet and indigo.** The inherited preset treats these as generated-page signatures; existing
  brands and intentionally selected references can use them appropriately.

If the brief wants warmth, get it from a low-chroma stone, bone or putty ground (saturation under
about 15%), from a deep green, brown or oxblood ink, from photographs, or from a full warm field
(mustard, tomato red, pink) used flat. These are options for that direction, not a requirement to
replace a customer's existing palette.

If the brand owns a flagged colour, preserve it and record why it fits. Use `--keep palette` if drawing
a direction; no allowance is needed merely to accept a `reference` style advisory. If explicitly using
`house`, a style-only allowance such as `--allow palette-purple` can document that decision. Never use
an allowance to hide below-required contrast or other correctness failures.
