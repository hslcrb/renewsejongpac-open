# Words

> lemonade 3.0: These are inherited study notes and optional house-style presets, not newly measured universal rules. Follow [principles.md](principles.md), the explicit brief and real content first. Default reference-profile style findings are advisory; functional cards/icons/rules/status labels and existing brand colors remain valid.


Write the page as plain text before markup so its purpose and real content are clear. A long
performance name or an intentional multi-line statement may need several lines; preserve its meaning
and test its actual font, width and language rather than cutting it to fit a preset.

## Contents

1. Write the argument first
2. Headline fit and language-specific measure
3. Headline shapes that work
4. Supporting line, body, buttons
5. Proof without inventing it
6. Things that read as generated
7. Micro-typography

## 1. Write the argument first

Answer in one line each, in a scratch note:

- Who is reading, and what do they already know?
- What is this, said the way its maker would say it to a friend?
- What single thing should the reader believe after one screen?
- What would make them believe it (a picture of the thing, a number, a name, a demonstration)?
- What do they do next?

Then list the page as claims, one per section, each with its proof:

```
1. It is a three-legged oak stool, made to order.             → the stool, large
2. Each seat is cut from one board, so the grain is yours.    → three close-ups
3. It takes six weeks, and you can follow it.                 → the stages, photographed
4. It costs 240 and is delivered by the maker.                → price, button
```

A section needs a purpose: a claim with evidence, an exploration task, or an operational action.
A calendar or utility panel need not make a marketing claim. Order sections around the visitor's
tasks and the real content instead of filling a stock sequence.

## 2. Headline fit and language-specific measure

A headline is a title. The inherited gallery notes report a median of 5 words and about 70% of hero
headlines on one or two desktop lines; see [research.md](research.md) for source limitations. This is
optional composition evidence, not a line limit for every page or language. `inspect.mjs` flags long
headlines as a style advisory in the default `reference` profile; only an explicitly selected `house`
profile applies the legacy style gate. Actual clipped or overlapping text remains a correctness issue.

For short Latin display copy, this rough estimate can help compare measures. It is not a Hangul
character budget; check Korean glyphs, word spacing and complete names in the actual font and width:

```
characters per line ≈ line width in px ÷ (font size in px × k)

k ≈ 0.40  condensed faces
k ≈ 0.50  most grotesks and serifs at display size, tight tracking
k ≈ 0.58  wide / extended faces, all-caps settings
```

| Where | Line width | Size | Per line | Two-line budget |
| --- | --- | --- | --- | --- |
| Phone 390, 20px gutters | 350px | 44px | ~16 | **~32 characters** |
| Phone 390, 20px gutters | 350px | 34px | ~21 | ~42 characters |
| Tablet 768 | 690px | 64px | ~22 | ~44 characters |
| Desktop, 12-col measure | 1100px | 104px | ~21 | ~42 characters |
| Desktop, half width | 620px | 72px | ~17 | ~34 characters |

The table's approximately 32–42 Latin characters illustrate one font-size choice, not a universal
budget. For authored marketing copy, moving secondary explanation into a supporting line can help.
For actual performance names, quotations or intentionally longer Korean copy, allow the needed lines
and adjust measure and scale without removing identifying words.

Controlling the break:

- Give the headline a suitable measure and consider `text-wrap: balance`. A `ch` value measures the
  font's zero glyph, not Korean characters; verify the result with the actual text.
- Where the break matters (it usually does), author it: `Stools for<br> small kitchens`. Check the
  phone screenshot; if an authored line wraps there, remove the forced break or adjust the measure.
- Check hierarchy when changing size; consider wrapping and available width before shrinking text.
- Avoid awkward isolated words where possible, but preserve complete titles and required wording.

Keep authored section headings concise. Complete names and real information take priority over word counts.

**Use semantics that match the content.** An intro paragraph belongs in `<p>`, a quotation in
`<blockquote>`, and a heading in its proper heading level. The inherited inspector heuristic treats
statements at up to 36px desktop, 32px tablet and 24px phone differently from display headings, with
three or four lines as a style reference. Those thresholds do not define semantic roles or acceptable
Korean length. Do not change markup to evade a style finding; assess readability and preserve the text.

## 3. Headline shapes that work

All seen repeatedly on the gallery sites. Pick the plainest one that is true.

- **The name.** The brand or the person, set very large, with a one-line description elsewhere.
  Strongest when the name is short and the subject is visual (studios, restaurants, hotels, people).
- **What it is.** "A vinyl shelf in your pocket." "Furniture for small rooms." Category, stated with
  one specific word.
- **The claim.** "Your bank won't do this." One sentence a competitor could not sign.
- **The instruction.** "Understand your money." Verb first, short.
- **The place or the moment.** "Antarctica." "Lisbon, since 1984." For hospitality, events, travel.

Shapes to avoid, because they are the average of every landing page:

- The mad-lib: "The AI-powered platform for modern teams".
- The tricolon: "Fast. Simple. Secure." or "Plan. Build. Ship."
- The correction: "It's not just a tool, it's a workflow". Also "More than a …".
- "X, reimagined / redefined / made simple". "Welcome to …". "Meet …" for a product nobody has met.
- A question the reader did not ask.
- A headline that needs its colon: "Ledgerly: invoicing for freelancers". Drop the name, it is in the
  navigation.
- One word of the headline styled differently (italic, serif, coloured, underlined, in a pill).

Sentence case. No full stop unless the direction's voice uses them everywhere.

## 4. Supporting line, body, buttons

**Supporting line.** Explain concretely what the thing is and who it is for without merely repeating
the headline. About 22 English words was a short-copy starting point in this preset; Korean wording
and necessary information are judged in the actual font and available width.

**Body.** Short paragraphs of plain statements. Prefer the specific noun and the real number: "ships
in a week" over "fast delivery"; "38 seats" over "intimate". Read every sentence and ask whether a
different company could print it unchanged; if so, sharpen it or cut it.

**Buttons.** Name the action or the thing: "Book a table", "See the plans", "Download for Mac".
Keep the label concise and unambiguous in its language. The same action keeps one name everywhere on
the page. Give actions a clear priority, while preserving multiple necessary controls such as calendar
navigation and booking. Arrow glyphs are optional direction cues, not required button decoration.

**Navigation.** A wordmark, a small set of clear links and a primary action are one starting layout.
Use the actual information structure; menu labels may need more than one word to identify a destination.

## 5. Proof without inventing it

Never invent customers, quotes from named people, press logos, user counts, ratings or benchmarks.
Invented proof is both dishonest and a recognised tell.

When the brief supplies no proof, use what is true by construction:

- Show the thing itself, large. A real demonstration outranks any quote.
- State how it works, specifically.
- Use facts from the brief (price, place, year, materials, what is included).
- If a testimonial or logo section is explicitly requested and no real ones exist, build the section
  with plainly fictional sample content and say so in your final report so it is replaced before
  launch. Do not put real company names or real people in it.

**Fixtures can test density when facts are missing.** Use clearly labelled sample content only when
needed to test a layout or state, and label it in the page as well as the report. Do not present invented
names, dates, places, prices or availability as customer data. An honest pending-data state is valid;
replace fixtures with real content before claiming the page's actual information has been verified.

## 6. Things that read as generated

`lint.mjs` flags most of these.

- Verbs and adjectives of the genre: unlock, unleash, supercharge, elevate, empower, streamline,
  seamless, effortless, robust, cutting-edge, next-generation, world-class, all-in-one, blazing fast.
- Labels pretending to be editorial: "Field notes", "The details", "Our philosophy", "Quietly trusted
  by". A section heading can simply be "Pricing".
- Decorative furniture text: locale or time strips, "Est. 2024", coordinates, version stamps, "Scroll", "(Scroll
  to explore)", fake photo credits, status lines such as "Available for work" with a dot, strings of
  words separated by middle dots or slashes. Preserve real dates, locations, categories and status
  labels when they support comparison, navigation or an operational task.
- The em dash as a habit. One or two on a page read as writing; ten read as a model. Use a full stop.
- Explainer captions that narrate the design: "A clean, minimal layout for…".
- Step labels that duplicate numbers: "Step 1", "Phase 02".
- Three parallel items everywhere: three features, three stats, three steps. Use the number the
  content has.

## 7. Micro-typography

- Curly quotes and apostrophes (“ ” ’), a real ellipsis (…), an en dash for ranges (9–5).
- Non-breaking space between a number and its unit, and before the last short word of a headline
  when it would otherwise orphan (`&nbsp;`).
- `font-variant-numeric: tabular-nums` where numbers line up in columns (prices, tables).
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- No all-caps for anything longer than three words; if you set caps, add 0.02–0.06em tracking.
- No text under 13px. No centred paragraphs longer than three lines. No justified text.
