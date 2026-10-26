# Homepage fragment links

Append a fragment to `/v5/` to open a particular section or item. For example:

- `/v5/#quick-booking`
- `/v5/#home-feature-carmen`
- `/v5/#home-program-ballet`
- `/v5/#home-visit-accessibility`
- `/v5/#home-notice-access`
- `/v5/#footer-citybrand`

The existing section, heading, header, footer, and form IDs remain valid.

## Major regions

| Fragment | Destination |
| --- | --- |
| `#header` | Site header |
| `#main`, `#home` | Main homepage content |
| `#featured-season` | Featured program carousel |
| `#home-pathways` | Purpose-based shortcuts |
| `#quick-booking` | Calendar booking widget |
| `#discover-programs` | Program discovery |
| `#plan-your-visit` | Visit guide |
| `#sejong-news` | News and participation |
| `#our-identity` | Sejong identity and institution links |
| `#footer` | Site footer |

## Featured programs and pathways

| Fragment | Destination |
| --- | --- |
| `#home-feature-dance`, `#home-feature-carmen`, `#home-feature-light` | The named featured program |
| `#home-feature-controls` | Carousel controls |
| `#home-feature-previous`, `#home-feature-next`, `#home-feature-playback` | Individual carousel control |
| `#home-pathway-programs` | Program discovery shortcut |
| `#home-pathway-group` | Group visit shortcut |
| `#home-pathway-rental` | Venue rental shortcut |

A featured-program fragment activates and pauses the requested slide before focusing its heading. Only the active slide receives the program ID. The carousel's repeated visual slides have no IDs, and their links are outside the tab order. Normal playback and controls never rewrite the fragment or repeatedly jump back to it.

## Booking and program discovery

| Fragment | Destination |
| --- | --- |
| `#home-booking-full-calendar` | Full calendar link |
| `#home-booking-calendar`, `#quick-month` | Calendar and visible month heading |
| `#home-booking-previous-month`, `#home-booking-today`, `#home-booking-next-month` | Calendar navigation controls |
| `#home-booking-date-YYYY-MM-DD` | A real calendar date; opens its month and selects the date |
| `#home-booking-programs`, `#home-booking-day-heading` | Program choices for the selected day |
| `#home-booking-program-{program.id}` | A program within the booking choices |
| `#home-booking-options`, `#quick-time`, `#quick-participants` | Session and participant choices |
| `#home-booking-action` | Booking summary and next-step action |
| `#home-program-all` | All programs link |
| `#home-program-filters` | Program category controls |
| `#home-program-category-all` | All category |
| `#home-program-category-performance` | Performance category |
| `#home-program-category-exhibition` | Exhibition category |
| `#home-program-category-education` | Education category |
| `#home-program-category-season` | Curated season category |
| `#home-program-calendar` | Calendar view link |
| `#home-program-results` | Current program card results |
| `#home-program-{program.id}` | A specific program card |
| `#home-season-programs` | Curated season feature link |

Program fragments use the intrinsic IDs in `PROGRAMS`, including hyphenated IDs such as `everyone-classic` and `art-class`. If a requested program card is outside the current four results, the homepage reveals it in the existing four-card layout. A normal category selection resumes the usual filtering. A booking-program fragment keeps the current date when that program is already present; otherwise it opens a date in the program's own date range. Past or unavailable booking controls retain their existing disabled behavior.

The calendar's blank padding cells have no IDs. Dates use the full ISO date rather than the cell position. A program nested in the booking list is revealed inside that list before the document scrolls.

## Visit, news, and participation

| Fragment | Destination |
| --- | --- |
| `#home-visit-preview` | Visit preview photograph |
| `#home-visit-planner` | Visit planning link |
| `#home-visit-directions` | Directions and parking guide |
| `#home-visit-spaces` | Spaces and seats guide |
| `#home-visit-accessibility` | Accessibility guide |
| `#home-visit-etiquette` | Visit preparation guide |
| `#home-news-all` | All news link |
| `#home-news-filters` | News category controls |
| `#home-news-category-all`, `#home-news-category-notices`, `#home-news-category-ticket-open`, `#home-news-category-rental` | Named news category |
| `#home-news-results` | Current news results |
| `#home-notice-{notice.id}` | A specific notice |
| `#home-membership`, `#home-membership-details` | Membership feature and details link |
| `#home-participation` | Participation shortcuts |
| `#home-participation-events`, `#home-participation-newsletter`, `#home-participation-donation` | Named participation shortcut |

Visit-guide fragments activate the matching preview. Notice fragments use `NOTICES` IDs: `season-open`, `rental-2027`, `parking`, `recruit`, `academy-notice`, and `access`. A notice outside the current four results is revealed without changing its destination URL. The normal news filters retain their existing behavior.

## Identity and footer

| Fragment | Destination |
| --- | --- |
| `#home-identity-about` | Sejong introduction link |
| `#home-identity-marks` | Identity composition link |
| `#home-identity-sky`, `#home-identity-earth`, `#home-identity-human` | Named identity motif |
| `#home-institution` | Institution shortcuts |
| `#home-institution-companies`, `#home-institution-esg`, `#home-institution-disclosure`, `#home-institution-partners` | Named institution shortcut |
| `#footer-newsletter` | Newsletter invitation |
| `#footer-identity` | Sejong footer identity |
| `#footer-information`, `#footer-policy` | Institution information and policy navigation |
| `#footer-policy-privacy`, `#footer-policy-terms`, `#footer-support`, `#footer-sitemap` | Named policy/support link |
| `#footer-service`, `#footer-phone` | Booking contact block and telephone link |
| `#footer-citybrand` | SEOUL MY SOUL city-brand link |
| `#family-site` | Family site selector |
| `#footer-versions` | Version comparison link |

Existing heading fragments also remain available: `#quick-booking-heading`, `#discover-heading`, `#visit-heading`, `#news-heading`, `#membership-heading`, and `#identity-heading`.

## Navigation and accessibility

`HomeAnchorNavigation` handles initial URLs, `hashchange`, browser back/forward (`popstate`), and restored pages. It asks the homepage to reveal an explicitly requested item, waits for the rendered target, and focuses its heading or native control. Temporary `tabindex="-1"` values on non-interactive headings are removed on blur. Disabled booking controls remain disabled, with their containing group available for focus.

The scroll offset uses the actual sticky-header height and its sticky top position, plus a 16 px reading gap. A `ResizeObserver` keeps the CSS offset current when the header wraps or the viewport changes. The document scroll is immediate and vertical; it does not scroll hidden carousel clones into view. Unknown or malformed fragments are ignored. No history entries are added by ordinary scrolling, filtering, or carousel playback.

## Supplied Seoul logo

The original is `assets/logos/seoulmysoul-citybrand.svg`. Its unchanged public mirror is `v5/public/assets/logos/seoulmysoul-citybrand.svg`, served as `/v5/assets/logos/seoulmysoul-citybrand.svg` after the normal static export. Both source and mirror have SHA-256 `b61dbe568378b352018e96c35c10e9011b2bac45954abfaca5b964768fe25216`.

The footer places the linked logo under the telephone number and above the family-site selector, following the structure of the official [Sejong homepage](https://www.sejongpac.or.kr/). It links to the [Seoul city website](https://www.seoul.go.kr/main/index.jsp), uses the original `624.55 × 101.21` viewBox proportion and colors, and displays at up to 227 px wide with responsive scaling. Its alt text is `서울시 로고 SEOUL MY SOUL`.

## Focused browser verification

After building and serving the static export, run from `v5`:

```sh
SEJONG_TEST_URL=http://127.0.0.1:8765/v5/ \
CHROMIUM_PATH=/path/to/chromium \
SEJONG_ANCHOR_REPORT_DIR=/tmp/sejong-home-anchors \
node tests/home-anchors.cjs
```

The script checks direct and changed fragments for stateful content, unique IDs and carousel clones, history navigation, focus and sticky-header clearance, malformed fragments, and the served logo at desktop, 390 px, and 320 px widths. It writes a JSON report and footer screenshots. `CHROMIUM_PATH` can be omitted when Playwright's bundled browser is installed. `BASE_URL` is accepted as a fallback for `SEJONG_TEST_URL`.
