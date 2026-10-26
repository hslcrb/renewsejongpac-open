# v4 Experience Implementation Plan

> Agent workflow: superpowers:subagent-driven-development. All Git mutation is owned by the parent; implementation agents own disjoint files.

**Goal:** IA·여정·PPTX의 콘텐츠를 온전히 연결한 독립 v4와 전면적인 시각·모션 개선.
**Architecture:** v3 전체 사본을 기준으로 정적 ES-module/hash-router 구조를 유지한다. 홈·소개·방문/대관 도구를 개별 기능 단위로 확장하고 공통 shell·검색·스타일·모션에 통합한다.
**Tech Stack:** HTML, CSS, JavaScript, Node tests, existing browser verification.
**Spec:** `docs/superpowers/specs/2026-10-16-v4-experience-design.md`.

## Global constraints

v3 제품 무수정. 전체 사본 증거. v4 저장소 격리. 다섯 GNB 그룹과 138개 기존 경로 보존. 본문18px/메타16px/조작48px. 한·영 기능 주석, 네이티브 포커스, 모션 감소. 실제 외부 접수·결제인 것처럼 표현하지 않는다.

## Review focus

- 날짜를 바꾼 후 기존 회차/인원 값이 잘못 남지 않는가.
- 단일 공간·전체 공간·0개 비교 상태 및 좁은 화면에서도 다음 행동이 보이는가.
- 반복 경로 이동·취소·브라우저 뒤로 가기에서 중복 이벤트나 이전 선택 누수가 없는가.
- 초기 로드와 모션 감소 상태에 콘텐츠가 투명/숨김으로 남지 않는가.
- 보존된 아카이브 파일과 실제 실행 코드·검사의 경로가 혼동되지 않는가.

## Tasks

- [x] 1. `codex/v4-foundation`: v3 전체 복사, 바이트 비교, 최초 커밋. 설계 근거와 원본 위치 문서화. 상위 `codex/v4-renewal`에 no-ff 통합.
- [x] 2. `codex/v4-experience`: v4 entry/storage/route isolation, root selector, global UI and visual tokens. Tests: version entry, 138-route subset, storage independence.
- [x] 3. Home: `v4/src/features/home.js`, `home-booking.js`, `styles/home-v4.css`, new focused tests. Six areas, quick booking choices and valid destinations, season discovery and reachable news types. Exports renderHome/bindHome remain.
- [x] 4. About: new `features/story.js`, `styles/story.css`, tests. Exports `renderStory(path)` (null for unowned paths) and `bindStory(root,path)` cleanup callback. Parent places before renderPages. Own /about and /about/introduction only.
- [x] 5. Journeys: new `features/journeys.js`, `styles/journeys.css`, tests. Exports `JOURNEY_PAGES`, `renderJourneys(path,query)`, `bindJourneys(root,path,query)` cleanup. Own /visit/plan and /rental/compare, links to existing flows. Parent registers routes.
- [x] 6. Search and shell: grouped actual content search, meaningful menu/section navigation, context links from program/rental/visit hubs; v4 style layer for all existing page families. Preserve transaction behavior and existing motion lifecycle.
- [x] 7. Port current v3 tests to v4 only; ensure v4 evidence paths and 1440/390/320px all-route checks. Execute focused functional checks, visual review, reduced motion and keyboard/rapid inputs. Fix scoped regressions with evidence; stop/reassess same fix after two failed attempts.
- [x] 8. Commit experience, no-ff integrate. `codex/v4-verification` for final docs. Independent requirement/code review, full Node suite once, final Git diff and v3 unchanged proof.

Delivery: no-ff merge the verified tree to main and push the authorized branches. Compare local/remote SHA before reporting delivery complete.

## Ledger

- Source evidence read: Figma three supplied nodes (XML and renders), actual v3 architecture, PPTX kordoc extraction and embedded IA. Source wireframe contains placeholder text; preserve role, replace with maintained Sejong content.
- Existing /about implementation is overviewPage in pages.js; the later aboutPage branch is shadowed. New renderer prevents that ambiguity.
- Browser/Chrome connectors currently unavailable; retain the issue as a verification dependency and do not claim visual completion from source-only checks.
- User explicitly authorizes implementation, branches, testing and merges. Execute concrete plan autonomously; report material uncertainty as evidence appears.

- Implemented home six areas, quick booking transfer, independent v4 storage including goods, grouped search, About narrative, visit plans and rental comparison. Existing 138 routes retained; two new routes total 140.
- Local headless Playwright is available through the external test tool directory and a managed localhost server. Chrome extension limitations affect external live-reference inspection only; local visual/interaction verification is operational.
- Review corrections: education/bus routes fall back to general transport guidance instead of a false venue; parking synonyms map to the registered route; exhibition capacity has no seat suffix.

- Final Node suite 66/66 passed with journey browser tests enabled. Latest 420/420 route/viewport checks and 16/16 browser groups passed. Sitewide motion 140 routes/14 checks passed. Independent code review approved.
- Feature commit `f8272d6`; integration commit `6272dd8`. Both baseline and final v3 tree IDs are `923efc723bbf5eca81df41d5aa305b181c0976ff`. Documentation links and final diff checks passed. No further product edits followed the final tests.
