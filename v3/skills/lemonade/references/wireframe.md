# Reading full-resolution references and section patterns

Source: repository-root `와이어프레임 실습.png` (wireframe practice board), **12992×4984**, inspected **2026-10-14**.
The full board and row crops at original pixel resolution were inspected, including comparisons of expanded and collapsed Nav/hero states.
Another 43 individual inspection windows, from quick checks through footers, were enlarged. Some cases repeat; this does not mean 43 independent sites.
Proportions are visual approximations. Static screenshots do not establish exact DOM structure, fonts, CSS measurements, or behavior.

## How to read a large image

Identify the overall regions → crop rows including titles, metadata, and controls → enlarge individual cases at original pixel resolution → recheck the overall hierarchy.
Leave unreadable text and site names unverified. The board's rounded frames and shadows may belong to the presentation rather than the websites.
Use an image viewer's zoom/crop controls or a local browser. If a browser is unavailable, use pixel crops and state the method.
There is no need to overwrite the original or upload it externally.

| Original row, translated where needed | Role | Observed composition | Selection criteria |
| --- | --- | --- | --- |
| Nav | Navigation | Transparent, light, or black global navigation; dropdowns; full-width mega menus; separated brand and utilities | Information architecture, opening/closing, keyboard, and mobile |
| First hero section | Identity and action | Full-width photographs, photo/booking panels, typography plus video, poster groups, split news layouts | Actual assets, identification, claims, and primary action |
| Second: quick checks (elements) | Short decision paths | Calendar plus schedule, booking, two posters, service selection, customer cases, pricing/booking | What users need to check or choose now |
| Third: show list (grid list) | Item discovery | Poster rails, news grids/masonry, project/resource covers | Comparison fields, recognition, titles, and filters |
| Fourth: wide show list (grid list) | Broad information compositions | 2×2 landscapes, 3×2 news, four products/programs, 2:1:1 evidence | Priority and comparison |
| Fifth: flat, wide show list (list) | Shallow information blocks | Resources with 1+2 images, partner evidence, customer cases, contact/video | Reading length and content depth |
| Sixth: combined panel | Mixed information | News/newsletter pairs, six-photo compositions, social/video/subscriptions | Primary and secondary areas and navigation purpose |
| Foot | Operations and closure | Address/policies/support, contact rows, brand images, inquiry forms, multi-column links | Final action and operational information |

Rows are not fixed templates or card ratios. The wide row also contains vertical program cards; the flat row includes product grids and footers.
Choose only the roles needed. Do not count repeated placements of the same case as independent evidence.

## Detailed observations

- **Nav/hero:** Small dropdowns coexist with full-width category menus. Navigation over photography changes its background and contrast when expanded.
  Hotel booking panels, content poster groups, primary/secondary medical cards, and travel comparison rails also form first screens.
- **9 quick cases:** A special-offer rail showing three items and part of the next; a year/month calendar plus schedule; two WHAT'S ON posters; nine categories plus six services;
  five customer cases; a lead article plus four recent items; text/image resources at roughly 2:1; a product with price, inclusions, and booking; a calendar plus schedule and seat table.
- **6 short cases:** A poster rail, news masonry, four news covers, two feature demos, five project covers, and four resource covers.
- **9 wide cases:** Special offers/five benefits, a teal invitation, 2×2 travel, sidebar plus 3×2 news, four security services, patents at roughly 2:1:1,
  four products, an editorial photograph plus 2×2 products and clothing, and four vertical programs.
- **9 flat cases:** Security, patents, products, and travel repeat. Additional cases include resources with 1+2 images, partners/contact, a logo row/action,
  a primary customer case plus three supporting cases, and a wide video plus vertical poster/sponsors.
- **3 panel cases:** 2×2 news plus a large newsletter, a six-photo mosaic at roughly 1:2:1, and tags/playlists/reels/video/subscriptions.
- **7 footer cases:** Black operational information, a contact row, a red invitation, brand photography/offices, a purple inquiry form, four utility columns, and institutional policies/address/registration details.

## Coordinates of individual inspection windows

Coordinates are `(left, top, right, bottom)` relative to the original image's top-left corner. They are not precise bounding boxes of website sections.

| Row | y | x ranges in order |
| --- | --- | --- |
| quick | 1540–1970 | 260–975 / 978–1620 / 1620–2725 / 2725–3555 / 3555–4880 / 4880–5630 / 5630–6580 / 6580–7540 / 7540–8165 |
| short | 2170–2580 | 250–945 / 945–1632 / 1632–2379 / 2379–3140 / 3140–4130 / 4130–4960 |
| wide | 2790–3250 | 250–950 / 950–1330 / 1330–1895 / 1905–2422 / 2435–3140 / 3148–4150 / 4150–5140 / 5150–6030 / 6030–6780 |
| flat | 3310–3780 | 250–948 / 948–1950 / 1950–2940 / 2940–3780 / 3780–4332 / 4332–5010 / 5010–5620 / 5620–6230 / 6230–6855 |
| panel | 3910–4270 | 255–901 / 901–1718 / 1718–2200 |
| footer | 4410–4750 | 255–1252 / 1252–2174 / 2174–3062 / 3062–3600 / 3600–4129 / 4129–4990 / 4990–6040 |

## Transfer observations into real use

For Korean, inspect final consonants, line height, punctuation, and spacing units in the actual typeface. Do not directly apply English character or word budgets.
Align fields across comparable items; vary primary and secondary sizes when editorial priority calls for it.
Provide accessible text names and dates rather than relying only on titles embedded in poster images.
Do not imitate tiny text, low contrast, or clipping in a capture. At 390px, a new composition must preserve required content.
Carousels and tabs were observed, but their operation requires separate verification.
NOL visit-information icons, Jeonju schedule dividers, MG service shortcuts, and GS multi-column operational footers provide counterexamples demonstrating functional repeated structures.
See the [GDWEB catalog](../library/reference-cases.json).
