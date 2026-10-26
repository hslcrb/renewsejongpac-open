# Improve through evidence

Update the skill when actual failures or better explanations emerge. Collection size and the number of prohibitions are not measures of quality.
Stay within the requested scope. Do not create indefinite work, schedules, or external connections without a separate request.

1. **Make the failure concrete.** Examples: truncated performance titles, missing states, overlapping Korean text, or a calendar mistaken for a decorative card.
   Record decisions from an independent evaluation using the current skill. Checking only the wording that changed is not behavioral verification.
2. **Find evidence suited to the question.** For behavior, accessibility, and date boundaries, consult the relevant platform's official documentation and actual input or data evidence.
   For visual composition, narrow candidates using industry, expression, and concept on [GDWEB](https://www.gdweb.co.kr/main/),
   then visit award detail pages and original sites. Compare the relevant industry, the same task in another industry, and a contrasting case.
   Stop collecting once the decision can be explained. Boards, static captures, original-site text, and browser interactions are different forms of evidence.
3. **Write the conditions for applying the lesson.** Use observation → task served → inclusion/exclusion conditions → actual verification.
   Matching poster cards can help comparison. That does not justify turning every page into cards or banning all cards.
4. **Re-evaluate independently.** Provide the actual request, skill, and minimum source material without the expected answer. Cover venues, institutions, single-action landing pages, existing brands, and long Korean text.
   Evaluate preservation of content and actions, how sources informed decisions, mobile tasks, and explicit marking of unverified behavior.
   Start with narrow checks and run the integrated checks once at the end. If the same fix fails twice, report what was learned.
5. **Consolidate.** Record the date, changes, evaluation, and limits; remove redundant examples, unsourced data, and ineffective rules.
   Keep shared criteria in `principles.md`, procedures in references, and observed cases in `reference-cases.json`.

For reusable control-defect guidance, use [state contracts](interaction-edge-cases.md) and [counterexample evaluations](../evals/interaction-evals.json).
Distinguish user-reported problems, independent responses using the previous skill, reproduced application defects, and evaluation inputs that have not been executed.

Case record:

```text
id / source URL / original URL / checked date
evidence kind / image size or viewport / inspected regions
visitor task / required fields / composition / visible controls
direct observation / inference / unverified behavior
adopted decision / counterexample / limits / asset rights
```

Record access denial, empty client rendering, and tool errors as they occurred. Do not describe unsuccessful access as live verification.
Do not reuse prices or dates in static material as current facts. Do not assume permission to redistribute reference captures.
The inherited research count of 247, the 181 bundled entries, and the 12 GDWEB static reviews from this update are separate. Do not describe them as conversion analysis or revalidation of all 247 sites.
Do not add automatic Git updates or remote reconnection to the skill.

## Learn from completed work

Record static observations from external galleries under `cases`, and directly implemented and reviewed work under `builds`.
Each build record should include paths to design, source, and verification documents; source/preview assets; inspection profiles and widths; checked states and input methods;
issues found, fixes, and limits; and inclusion/exclusion conditions. State when the example is absent from the package.
The current CLI's `source.available` means that the implementation directory and verification-document path exist. It does not check other assets or reports, or prove successful execution.
Make cases discoverable by role without turning an example's colors, fonts, subject, or image count into the new default template.

Distinguish documented corrections in the ONSIL case from automated detection. Image height and tablet body-text size were corrected during implementation review,
but the initial failure reports and captures were not preserved. A final PASS report alone cannot
prove the original defect or identify which check detected it. Do not create missing failure captures afterward and present them as contemporaneous evidence.

For future work, preserve the pre-fix report and matching view separately, for example in `.lemonade/inspect/before/` and `.lemonade/inspect/after/`.
What was checked, in which state, at which width, and with which input matters more than the number of checks. Programmatically setting date/select values
checks state logic; it does not establish complete real-keyboard operation. Record direct visual review and additional independent review separately.
Define expected items and values independently of the rendered structure. Deriving the answer from the same DOM can let an incorrect list pass.
