# Calendars and Dates: Separate Layout, Dates, and Selection

Apply this to month calendars, date inputs, date ranges, and booking slots. It does not instruct every site to add a custom calendar.
Also read [selection controls](selection-controls.md) when deciding whether to retain a native date picker and when verifying its expanded state.

## 1. Define the Date Model First

- Distinguish **date-only values** (birthdays, visit dates), **local date + time + region** (performance slots), and **instants** (server events).
  Do not handle a date-only value through arbitrary timezone-unspecified string parsing or a UTC round trip. Validate its format and actual calendar validity separately.
- The `visible year/month`, `date under keyboard navigation`, `committed date/range`, `today`, and `available schedule` are separate states. Changing months must not silently change the booking date.
- Define inclusive/exclusive range boundaries, whether same-day ranges are allowed, the first day of the week, display locale, reference timezone, min/max, and closure/sold-out policies.
  Use the relevant library and product requirements for non-Gregorian calendars. Do not apply the Gregorian tests below to every calendar system.

JavaScript `setMonth()` can overflow a shorter month while trying to preserve the existing day. Compute month navigation from a separate year/month,
and clamp a moved focus date to a valid day in the target month. Adjusting the actual selected value is a separate product contract; do not silently move it into March.
See [MDN setMonth](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth).

Parsing a `YYYY-MM-DD` string into a `Date` and then reading it as a local date can produce a different calendar date in some timezones.
Check the date-only representation and validation utilities already in use, and preserve the meaning of storage, display, and comparison.
See [MDN Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).

## 2. Days per Month and Layout

In the Gregorian calendar, a leap year is divisible by 4, except years divisible by 100, unless they are also divisible by 400.
Calculate the required rows from the first-day offset for the chosen week start and the actual number of days. A natural month grid may have 4, 5, or 6 rows.
Reserving space for six rows is an optional design policy. It does not justify forcing every month to use six rows or generating nonexistent 29th, 30th, or 31st dates.

Independent reference examples (row counts use a **natural grid without extra empty trailing weeks**):

| Year/month / week starts on | Valid days | Natural rows | Purpose |
| --- | --- | --- | --- |
| 2021-02 / Monday | 28 | 4 | Short four-row month |
| 2026-02 / Sunday | 28 | 4 | Different week start |
| 2026-04 / Monday | 30 | 5 | 30-day month |
| 2026-08 / Monday | 31 | 6 | Long six-row month |
| 2024-02 / Monday | 29 | 5 | Leap day exists |
| 1900-02 / Monday | 28 | 5 | Century exception |
| 2000-02 / Monday | 29 | 5 | 400-year exception |
| 2100-02 / Monday | 28 | 4 | Future common-year exception |

Use cases outside the product's supported years only for date-utility checks; do not force the UI to open prohibited years.
More detailed inputs and expectations are in the [evaluation material](../evals/interaction-evals.json). Actual schedule and holiday data are separate facts.

| Reproduction | Expected behavior and checks |
| --- | --- |
| **C1.** Navigate back and forth through 4→5→6-row months | Calendar headers, weekday labels, and cell widths remain consistent; no dates are missing or duplicated. State whether the layout grows with the row count or reserves space. Within reserved space, footers/actions must not jump. |
| **C2.** Different month-title lengths, language/week-start changes, 200% zoom | Weekday columns and date offsets change together. Long month names do not cover previous/next buttons. Dates, legends, close, and confirm controls remain unclipped in small viewports. |
| **C3.** Adjacent-month dates, overlapping today/selection/focus/range states | Distinguish each state; today is not automatically selected. A previous/next-month number must not select the same day number in the current month. Provide indicators beyond color and full-date accessible names. |

## 3. Month Navigation and Selection Boundaries

| Reproduction | Expected behavior and checks |
| --- | --- |
| **C4.** Navigate to the next month from 2026-01-31 | The visible month becomes 2026-02 while the committed value remains unchanged. For a pattern that moves date focus, use a valid target defined by the contract, such as 2026-02-28. Do not overflow into March. |
| **C5.** Next year from 2024-02-29, December↔January | Compute the target year/month correctly. Do not present a nonexistent February 29 as selectable. Move focus to a date within the allowed range or explain the restriction. |
| **C6.** 31-day month→30-day month→31-day month, recurring schedules | Separate plain month navigation, selection changes, and “last day of every month” recurrence rules. Preserve the intended original day/month end only when recurrence applies, avoiding permanent drift to the 28th. |
| **C7.** Clear, partial input, `2026-02-30`, paste | Distinguish empty from invalid values. Do not let Date normalization commit a nonexistent date as if it were valid. Preserve format guidance, error feedback, and a correction path. |
| **C8.** Exact min/max and immediately adjacent days, all slots unavailable, a new closure date | Respect inclusive/exclusive boundaries. Handle unavailable dates/times consistently through pointer, keyboard, direct entry, and submission. Revalidate stale slots and confirmation results after schedule changes. |
| **C9.** Range start only, same day, reverse order, an unavailable day inside the range | Do not commit an incomplete range. If the rule excludes the end date, as for check-in/check-out, validate accordingly. Do not check only the endpoints and miss an unavailable interior day. |
| **C10.** Browser timezone changes, crossing midnight, DST boundaries | Preserve date-only identity. Time-based bookings follow the venue's reference timezone and actual available times. Check nonexistent/duplicated local times and the assumption that `24 hours = one calendar day`. |
| **C11.** Rapid consecutive month navigation, slow availability response, error/retry | Response year/month and conditions match the latest visible month. Results from the previous month must not overwrite the new one, and availability must not be invented before confirmation. |

The product contract determines whether a reversed range swaps endpoints, starts a new range, or shows an error. Do not apply inconsistent policies across input methods.

## 4. Verify Date Navigation and Focus with Real Input

Check the current library's calendar pattern, tracking the selected date, focused date, and today separately. For a custom grid, manage one date as the Tab entry point and
provide arrow/week movement, Home/End, and month-navigation keys according to the adopted pattern. Do not make every date cell a separate Tab stop.
Check that focus remains on a valid date after rerendering a month and that an offscreen active date becomes visible.

For a modal date picker, verify internal focus cycling, Escape, and focus return after dismissal. Do not impose a modal trap on inline calendars or nonmodal popups.
Whether unavailable dates can receive focus depends on the chosen pattern; communicate unavailability and its reason. Users must be able to leave even when every date is unavailable.
Do not default to returning to today whenever the calendar opens or committing a date on every month change.

The [WAI-ARIA date picker example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) is a reference for keyboard and focus design.
It does not guarantee mobile or assistive-technology support in an actual product. Separately verify screen-reader announcements for month changes, full dates, selection, and unavailable states in the target environment.

## 5. Reporting Results

Distinguish date-arithmetic checks, rendered calendar-grid checks, actual keyboard/touch input, native OS pickers, and real server-side booking availability.
Programmatically changing an input and calculating a booking amount does not verify month navigation, keyboard operation, or leap-year calendar UI.
Keep expected fixture dates independent of the application's date-generation functions, and make reproduction deterministic by fixing dates or injecting a clock.
Do not generalize a pass for the current month into a pass for every date throughout the year.

Official documentation checked: 2026-10-14. Check actual date/accessibility library versions and supported environments during implementation.
