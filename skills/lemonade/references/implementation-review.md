# Turning Design into Rendered Screens and Behavior

Read the relevant sections when implementing or improving HTML/CSS or frontend code. Do not add code and browser procedures to a task that only generates an image concept.
Apply the required [code and markup contract](code-and-markup.md) before authoring or reviewing web code. Verify its formatting, semantics and baseline integration without changing the selected visual direction.
This guide reflects issues and verification limits recorded for ONSIL in the bundled [reference catalog](../library/reference-cases.json).
Retrieve those saved observations with `node <skill>/scripts/references.mjs --id local-onsil` and use them with the points below.
The full repository also has `examples/onsil/VERIFICATION.md`; a standalone skill installation may not include it. Do not claim to have opened a missing document or reverified the example.

## 1. Define Expected Behavior Before Building

Create a short list of expected outcomes from each section's task, required fields, item count, actions, and states. Do not let the code-generated screen determine those expectations.
For filters, verify intended item IDs, categories, and counts; for booking, verify actual schedules, availability, prices, party size, and selection resets; for links, verify actual destinations.
A check that derives its expected results from the same DOM it compares against cannot independently detect classification errors or omissions.

ONSIL's 3/2/1 filter counts and KRW 24,000 for two people are data for that example. Use the relevant contract and test data for each other project.
Check separately whether a calendar date exists, falls within the allowed range, is a closure day, and has an available slot.
When the date or program changes, revalidate dependent selections, clear invalid or stale selections and confirmation results, and recalculate the amount.
The flow's contract determines whether still-compatible selections are retained. ONSIL deliberately resets the slot whenever the date or program changes.
Distinguish cleared required values, invalid values, empty results, sold-out/upcoming states, valid selections, and completed confirmations.

## 2. Compose Images at Their Actual Loaded Dimensions

`width`/`height` help preserve the original ratio and reserve layout space. Changing only CSS width does not guarantee the intended height.
Check the full page for media that becomes unnecessarily longer than adjacent text or creates empty areas.
Distinguish natural-ratio images from fixed crops and specify their dimensions accordingly.

```css
/* Preserve the image's original aspect ratio. */
.natural-image {
    display: block;
    width: 100%;
    height: auto;
}

/* Crop within an intentional ratio, chosen for the content. */
.cropped-media {
    aspect-ratio: 4 / 5;
    overflow: hidden;
}

.cropped-media > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

The example's 4:5 ratio is not a universal rule. Preserve recognition and internal lettering in posters, shape in products, and focal faces, actions, or spaces in photographs.
Check `object-position` and height at each breakpoint. Do not regenerate a static source image to avoid reviewing its crop.
ONSIL's journal image was visually too tall even though loading and overflow checks passed. Successful loading and composition quality are different evidence.

Lazy-loaded images inside tabs or accordions may not finish `decode()` while hidden. Separate checks for visible images on the initial screen from
checks that actually open each panel and inspect its images, descriptions, and associated actions. Set explicit timeouts and do not falsely report hidden assets as checked.
Do not arbitrarily change the product's lazy loading or hidden state just to make a check pass.

## 3. Verify Fonts and Reading Roles in the Rendered Result

Distinguish installed/loaded font faces, actual Korean/Latin glyphs, word boundaries, punctuation, wrapping, and line spacing.
A passing `document.fonts.check()` alone does not prove that every Korean character on screen uses the intended font.
Inspect representative headings, body text, status labels, and long names in the actual render, and check the browser's rendered-font information where available.

Distinguish body text, metadata, status, buttons, and headings by their roles. Do not enlarge small labels into body text or shrink body text to metadata size.
Body text at 16–18px and Korean line-height around 1.5–1.7 are starting points. Verify them for the actual language, brand, and reading length.
Check intermediate widths such as 768px as well as 390px for overridden body-text rules. Do not truncate meaningful headings merely to meet a line count.

## 4. Design States Beyond the Resting Screen

Checking only closed menus and modals after page load misses defects in their expanded states.
When controls are present, choose relevant contracts from [states and edge cases](interaction-edge-cases.md).
For value-dependent dropdown heights, native expanded UI, anchors, and focus, follow [selection controls](selection-controls.md);
for month row counts, leap years, month ends, timezones, and range selection, follow [calendars and dates](calendar-and-date.md).
Compare the same control's border box, baseline, arrow, and neighboring layout before and after selection, distinguishing intended hug growth from unexpected shifts.

| State | Check |
| --- | --- |
| Expanded menu | Destinations, dismissal, keyboard navigation, current location, contrast against the background |
| Resize while UI is open | Matching CSS/JS boundaries, obscured toggles/triggers, focus location |
| Long modal content or confirmation result | Reachable title/close control after scrolling, confirmation wording, keyboard focus, focus return after closing |
| Filter change or no results | Selection state, actual results, explanation, list baseline, page density |
| Cleared value or invalid selection | Explanation and correction path, dependent-selection revalidation, removal of invalid values/stale confirmations, updated amount |
| Valid selection and confirmation | Agreement between displayed data and actual processing, honest completion scope |
| Reduced motion or enlarged body text | Preserved content/actions, overlap, clipping, overflow |

Do not force a sticky title into every scrollable UI. Identify whether close or primary actions become unreachable, then choose a solution appropriate to that UI.
Verify actual Tab/Shift+Tab/Enter/Space/Escape behavior for native controls in the project where relevant.
Do not report pointer automation or programmatic value changes as actual keyboard interaction.

## 5. Pair Code Verification with Visual Judgment

Check source and rendered markup against the [code contract](code-and-markup.md), including actual HTML/CSS conformance tools when available. Fix invalid nesting, duplicate IDs, missing accessible names and broken references. Record validator/tool versions and limitations; a regex source scan or visual inspector is not a standards certificate.

These three stages answer different questions.

1. **Measurement:** Verifiable conditions such as broken assets, actual dimensions, overflow, clipping, contrast, and font loading.
2. **Visual judgment:** Hierarchy, density, proportions, crops, Korean line composition, and overall rhythm compared with the source/reference.
3. **Task execution:** Actually navigate → select → view details/book → edit/cancel/confirm.

Inspect the full desktop flow, enlarged important areas, mobile and intermediate widths, and open/error/success states as applicable.
Record width, UI state, input method, capture/report, and time for each observation. A checker's resting-page measurement does not verify an open modal.
Use [critique.md](critique.md) for critique. For reference-profile warnings, record why each was retained, fixed, or deferred, along with relevant evidence.
Do not treat the absence of video, repeated cards, thin structural rules, brand colors, or intentional multiline headings as defects by themselves.
Conversely, a WARN label is not automatic permission to ignore a problem. Fix genuinely undersized text or unclear tasks.

## 6. Preserve the Evidence and Scope of a Fix

Save failed reports and relevant captures separately before the next run. You need not archive everything from the start, but preserve key evidence needed to revisit the reason for a fix.
After a change, recheck the relevant widths, states, and actions. For example: image-height changes require checking that section and adjacent rhythm; body-text changes require intermediate widths and wrapping;
modal CSS changes require the open dialog, scrolling, focus, and dismissal; breakpoint changes require open UI on both sides of the boundary.
Do not automatically repeat unrelated successful checks. Run one integrated check at the end and record its results.
If the same fix fails twice, stop and report the observed facts and remaining blocker.

If only the final PASS remains, do not imply that evidence reproducing the earlier failure was preserved. Distinguish documented observations during work from saved automated results.
Do not use test counts, 0 FAIL, or self-assigned scores as proxies for quality. Identify unverified widths, states, input methods, and services.

## 7. Complete Assets and Handoff

Store project-consumed images inside the project and record the output, prompt, and generation/collection source. Do not present generated images as evidence of real venues or clients.
Keep actual font sources and licenses. When local execution is requested, check whether the runtime depends on an external CDN.
For parallel work, define independent ownership areas and interfaces, such as images, documents, or modules. Do not edit the same files or assets concurrently.

Make the working directory, run command, address, shutdown procedure, and required tools easy to find in the README.
If an example's README is buried, add a link or run instructions to the repository README too.
If HTTP module/data loading is required, do not claim the app works through `file://`. If the server was stopped, do not present its address as a currently running preview.
Explain the difference between actual storage/booking/payment and a local demo at the point where the user makes that decision.
