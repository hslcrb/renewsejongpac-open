# Sejong Center Implementation Plan

> **For agentic workers:** Use native implementation with independent page-module delegation. User explicitly requests uninterrupted completion.

**Goal:** Deliver the PDF's full Sejong Center information architecture as a working vanilla website.
**Architecture:** Shared route/content registry, native ES modules, static hash routing, reusable shell, specialized page renderers, browser-local demo state.
**Tech Stack:** HTML, CSS, JavaScript; Node native test runner and available Playwright for verification only.
**Spec:** docs/superpowers/specs/2026-10-13-sejong-design.md

## Global Constraints

- No framework, runtime dependencies, backend, external submissions, real payments.
- All 5 navigation groups and PDF subpages; content must support meaningful next actions.
- Korean UI, responsive, accessible, reduced motion, correct back/deep links.
- Keep all user files; use existing isolated cloud checkout.

## Review Focus

- Bad route IDs and query input must safely render or display not found.
- Date filtering and month transitions must respect actual program dates.
- Seat selection / booking confirmation must validate and prevent duplicate submission.
- Storage unavailable or malformed must not crash the app or lose in-session actions.
- Mobile menus/dialogs must remain keyboard usable and not overflow.

## Tasks

- [x] 1. Define data and pure state helpers; write failing tests for filters, routes and booking validation, then implement and verify.
- [x] 2. Build shell, responsive design system and six-section home. Verify visible primary CTA and keyboard/mobile navigation.
- [x] 3. Implement programs/list/calendar/detail and all information pages with route-specific content and detail links. Verify entire sitemap and asset availability.
- [x] 4. Implement demo booking, applications, account, newsletter, favorites and search. Verify successful and invalid/empty paths and persistence.
- [x] 5. Run browser checks at desktop/mobile widths, independently review full implementation, fix failures and document commands/limits.

## Shared interfaces

`js/data.js`: NAV, PAGES, PROGRAMS, VENUES, NOTICES. PAGES entries {path,title,group,eyebrow,description,type}; PROGRAMS {id,title,category,genre,start,end,venue,image,price,description}; VENUES {id,name,capacity,image,description}.
`js/core.js`: esc(value), href(path), getRoute(), filterPrograms(items,filters), readStore(key,fallback), writeStore(key,value), todayISO(), formatDate(value), money(number).
Page modules export renderX(path,query) -> string|null and bindX(root,path,query) -> void. Router renders common shell and invokes binders. Root handles common delegated links/navigation. No module mutates another module's files.

## 실행 결과

- 작성된 전체 정보구조: 132개 고유 페이지와 프로그램별 예매 및 12개 신청 흐름.
- 8개 Node 테스트 통과. 전체 132개 경로를 1440px/390px Chromium에서 검증.
- 별도 검토에서 발견한 skip-link, 메가메뉴 Escape, 캐러셀 포커스, 빠른 예매 대상별 동작, 대관 정보 전달 문제를 회귀 테스트로 재현 후 수정.
- 문서 범위를 보완하여 할인, 이벤트 참여, 분실물 상세, 전시 입장 인원 흐름 구현.
- 사용자 지시에 따라 중간 승인 없이 완료. 현재 isolated cloud checkout 사용.
