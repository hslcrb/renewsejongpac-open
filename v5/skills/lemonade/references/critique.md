# Critique — judging the page with evidence

Use [principles.md](principles.md) and the actual brief first. Review whether visitors can read,
compare and act on the real content. The default `reference` profile makes style findings advisory;
each warning needs a documented decision. Existing brand choices and functional repetition remain valid.

When translating a design into HTML, CSS or interaction, also read
[implementation-review.md](implementation-review.md).
For authored web code, also review the required [code and markup contract](code-and-markup.md). Judge its formatting and standards checks separately from visual taste; a code-only review does not authorize a redesign.
For named-site inspiration, use [named-styles.md](named-styles.md) and the chosen profile. Review the requested visual relationships and the new work's independent composition, content and assets; color similarity alone does not establish a successful interpretation.

## 1. State what the evidence can establish

Keep these four judgments separate:

| Judgment | Evidence | Report |
| --- | --- | --- |
| Measured correctness | Inspector/lint output, viewport and state, actual thresholds | Finding ID, value, affected element and report path |
| Visual judgment | Viewed whole-page captures and enlarged regions | Concrete observation, location, task impact and proposed change |
| Functional flow | Executed actions, keyboard use and resulting states | Steps, expected/observed outcome and tested conditions |
| Source and limits | Source URL/file, date, authorship and saved artifacts | Provenance, freshness, observation/inference and untested scope |

An inspector `PASS` establishes only the conditions it measured. A main-page report may pass while
an open menu or dialog is broken; exercise and capture those states separately. Style `WARN` count
does not establish quality. A screenshot establishes appearance in that state, not successful use.

Name evidence you actually inspected. When only a description or first-screen capture is supplied,
give a provisional judgment and list what is missing. Leave unobserved font details, interactions,
whole-page quality and mobile states unconfirmed. Record the width, height, zoom, state and date
so another reviewer can repeat the observation.

Treat a repair described in a verification note as a documented observation. Claim that a machine
caught the failure only when the corresponding failed report exists and was read. A later passing
report supports the later checked condition; it does not reconstruct the earlier failure.
Use [research.md](research.md) for the limits of inherited gallery research.

## 2. Gather enough of the page

1. Read the brief: visitor, primary task, required fields, locale, brand constraints and real assets.
2. View the whole desktop page, then enlarge important titles, metadata, controls and image crops.
3. View the whole 390px mobile flow and 768px intermediate layout, with important regions enlarged.
4. Check widths on both sides of relevant breakpoints, plus any width where wrapping changes sharply.
5. Capture open menus/dialogs, selected filters, empty/error/loading/results and completion states
   that belong to the task. Use real long titles and representative content rather than short filler.
6. Increase text/zoom and execute the full primary task with pointer and keyboard.

First-screen captures help assess initial orientation. Whole-page and state captures are needed to
assess downstream information, sticky controls, long content and completion. If tools or assets are
missing, report the possible checks and the remaining limits. Never invent screenshot observations.

## 3. Review in the visitor's order

### Orientation and content

- Can visitors identify the page and find the action that serves their purpose? A detail/list link
  is appropriate for navigation; buttons suit actions. Evaluate destination, name and accessibility.
- Are complete titles, classifications, dates, prices, availability and other required metadata
  preserved? Check the actual locale, date/number formatting and language of control labels.
- Can equivalent items be compared in a stable field order? Repeated rows, cards, grids, rules and
  status labels can support comparison. Change the structure when the task or information changes.
- Is each assertion supported by real content or clearly labeled examples? Distinguish verified
  business facts, supplied copy, generated imagery and inference.

### Readability and composition

- Inspect real text in the loaded font at each relevant width. Check Hangul word breaks, punctuation,
  complete names, line height, awkward isolated words and text enlargement.
- Judge hierarchy and density by reading effort: useful grouping, shared alignment, predictable
  metadata order, section spacing and a clear next action. Name the element and location of a problem.
- Evaluate actual contrast for body text, secondary metadata, controls and changed states. Normal text
  needs at least 4.5:1 and large text 3:1; photograph-backed text needs separate visual assessment.
- Check image loading, useful alternative text, natural dimensions and responsive aspect ratios.
  Verify HTML `width`/`height` and CSS sizing together; watch for reserved space, stretching, excessive
  height and crops that remove the subject or image-contained text. Review each meaningful crop.
- Choose imagery and motion for their job. Real work images, illustration or typography may be enough;
  footage and animation need a purpose. Preserve content and actions with reduced motion.

### Responsive behavior and states

- Compare desktop, 768px, 390px and breakpoint-adjacent sizes. Check columns, reading order, long
  metadata, image scale, menu transitions, sticky elements and overflow at intermediate widths.
- Exercise filters, reset, no results and detail/list navigation. Confirm results and selected state
  match the action; inspect stale data and feedback after a selection changes.
- For a dialog, inspect long content scrolling, reachable heading and close control, focus entry,
  keyboard containment, Escape/close behavior and focus return. Check the page after closing it.
- Check visible focus, accessible names, target size, disabled/error explanation and keyboard order.
  Keep essential orientation and the primary action discoverable; provide accessible alternatives to
  hover/motion and keyboard/pointer access to carousel content.
- For controls, use [interaction edge cases](interaction-edge-cases.md): compare placeholder/selected/loading/error geometry,
  actual open native/custom pickers, anchor and focus behavior, and month/date transitions. Distinguish intentional
  multiline growth from accidental drift. A resting screenshot or injected value does not verify these states.
- Complete the real task: comparison to detail, search to result, selection to reservation, or the
  specified equivalent. Verify any total, validation and final state. Label demos truthfully.

## 4. Record the judgment

Use a short record with evidence attached to each finding:

```text
REVIEW n — date / artifact or URL / locale
Task and acceptance criteria: ...
Evidence viewed: whole pages / enlarged regions / widths / states / report paths
Measured correctness: ...
Visual judgment: observation → task impact → evidence
Functional flow: steps → observed outcome → evidence
Warnings: finding ID → keep/change/defer → reason and evidence
Sources and freshness: supplied/observed/inferred → date and limits
Highest-impact findings: location → impact → concrete fix
Verdict: verified scope / remaining work / unconfirmed scope
```

Review every relevant warning in context. Keeping a functional divider or complete multi-line title
needs a reason; changing it needs evidence of a problem. Resolve genuine failures and mark uncertain
decisions for the check that will settle them. Avoid automatic deletion or automatic acceptance.

Numeric scoring is optional when the user requests a comparison. Define the criteria and weighting,
use comparable evidence for every candidate and disclose uncertainty. Scores express that comparison;
they are not objective certification or completion gates. Historical house preferences apply only
when explicitly selected, within the brief and required content/accessibility.

## 5. Fix and finish

Prioritize by visitor impact: broken interaction, inaccessible controls, unreadable or missing content
first; then misleading hierarchy, difficult comparison and responsive composition; then cosmetic detail
and optional motion. A new hero idea cannot rescue an unusable task. Fix the highest-impact confirmed
problem and its cause, then check that required content and working behavior are preserved.

Rerun the touched scope and capture the changed region/state. Broaden checks when the change affects
shared behavior or exposes another failure. Run the required full suite once at the end. If the same
fix fails twice, stop that attempt and report the evidence, what was learned and what remains unresolved.

Call the requested scope complete only when its required content and full task have been checked,
material findings are resolved, warning decisions are recorded and remaining limits are disclosed.
When evidence is incomplete, state that completion is unconfirmed and specify the missing check.
