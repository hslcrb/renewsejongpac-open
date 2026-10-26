# LLM Reference — 세종문화회관 리뉴얼

기준일: 2026-10-26 (브랜치 전면 통합 및 단일화 완료). Codex·Claude·그 밖의 모델이 같은 프로젝트 사실과 협업 절차를 읽기 위한 안내입니다. 과거 대화 기록보다 현재 사용자 지시와 적용되는 AGENTS를 먼저 따릅니다.

This reference gives models a shared map of the codebase. Current user instructions and applicable AGENTS rules take precedence over historical conversations.

## 먼저 읽을 문서 / Reading order

1. [AGENTS.md](AGENTS.md): 전체 작업·브랜치·커밋 기준.
2. [v5/AGENTS.md](v5/AGENTS.md): v5 범위의 디자인·TypeScript·빌드 계약.
3. [CONTRIBUTING.md](CONTRIBUTING.md): 사람·모델의 공통 협업 절차.
4. [README.md](README.md): 기능 범위·구조도·전체 데이터 관계.
5. [브랜치 전면 통합 기록](docs/branch-consolidation-20261026.md): 2026-10-26 저장소 단일화 및 브랜치 정리 내역.
6. [공개 무이력 스냅샷 가이드](docs/open-mirror.md): renewsejongpac-open 운영 정책 및 동기화.
7. [컴포넌트 연결표](v5/docs/component-connections.md): 현재 생성된 등록·실사용 연결.

## 브랜치 필수 / Mandatory task branches

**모든 사람과 모델은 작업별 고유 브랜치를 사용합니다. main에서 직접 수정하지 않습니다.** 동시 작업은 각자 별도 worktree 또는 clone을 사용합니다. 작업 브랜치에 검증·커밋·일반 푸시한 뒤 통합 담당자가 검토된 작업을 main에 `--no-ff`로 병합합니다. reset·강제 푸시·공유 이력 재작성을 사용하지 않습니다.

All participants use task branches and separate checkouts for concurrent work. The integrator merges reviewed branches into main with `--no-ff`. The former direct-main workflow is superseded.

커밋 제목: `**<현재브랜치명>** 영어 접두사: 한국어 설명` (커밋마다 맨 앞에 `**` 별 문자 사이에 작업 브랜치명을 그대로 적음). 에이전트는 `git status` → `git add -A` → 작업 브랜치 커밋 → `git push -u origin HEAD`를 수행합니다. main 통합 후에는 `git push origin main`을 수행합니다. 원본 협업 권한은 비공개 보관 미러 권한을 포함하지 않습니다.

## 현재 제품과 데이터 / Product facts

| 항목 | 사실과 원본 |
| --- | --- |
| 활성 제품 | `v5/`; Next.js 14.2.35 App Router, React 18, TypeScript, Node.js 24.x. 기본 경로 `/v5/`. |
| 보존 대상 | 루트 버전 선택·legacy와 v2/v3/v4. 요청 범위와 관련될 때만 수정. |
| 콘텐츠 | Supabase 공개 카탈로그 → `src/generated/catalog-snapshot.json` → 정적 빌드. 브라우저에서도 갱신. |
| 회원 기록 | Supabase Auth 계정과 DB/RLS. 브라우저 저장을 DB 저장 성공으로 취급하지 않음. |
| 예약 | RPC가 가격·좌석·소유자를 검증. 확인된 회차에서만 활성화. PG 결제·발권 연동은 별도. |
| 신청 | `sejong_service_forms`, `sejong_service_requests`, `sejong_service_goods`, `sejong_service_cart`와 RPC. |
| 스키마 | public 테이블 22개. 실제 FK와 전체 SQL은 README의 ERD 및 마이그레이션 참조. |
| 배포 | `npm.cmd run build` → 전체 `out/` → `scripts/sync-out.ts`의 v5 루트 미러. 둘 다 커밋. |

`src/data/` 전체를 목업으로 해석하지 않습니다. 토큰·등록부·경로는 코드 계약이며 콘텐츠 수입 자료는 편집·SQL 이력입니다. 새 콘텐츠를 생성 스냅샷에 수동 입력하지 않습니다.

## 구현 위치 / Source map

- 화면 경로: `v5/app/`; 제품 컴포넌트: `v5/components/`.
- 토큰: `v5/src/data/design-tokens.ts`; 생성 CSS: `v5/styles/tokens.css`.
- 컴포넌트 축: `v5/src/system/component-contracts.ts`; 등록부: `v5/src/data/component-registry.ts`.
- 카탈로그: `v5/src/catalog/`; 회원·예약·신청: `v5/src/lib/`.
- DB 변경: `v5/supabase/migrations/`; 단위·브라우저 검사: `v5/tests/`.
- README SVG: `docs/readme/`; 생성기: `v5/scripts/render-readme-assets.ts`.
- 실습일지: `docs/dailyletters(since20261023fri)/`; 날짜·순번으로 파일을 작성하고 UTF-8 바이트를 확인.

## 디자인 계약 / Design contract

모든 실제 UI 텍스트는 `SystemText` 또는 `data-text`에 연결합니다. 최소 16px, 중앙 컬러 변수, 오프화이트·오프블랙, 옅은 안쪽 경계와 공식 곡률·베리언트를 유지합니다. **디자인 시스템을 먼저 수정한 뒤 마크업에 연결**합니다. 제품과 가이드가 같은 구현을 사용해야 합니다. 등록 수는 고정 숫자를 추측하지 말고 연결표와 검사에서 확인합니다.

`BookingInvitation`은 Deprecated 이력만 유지합니다. 노랑·초록 퀵메뉴는 `VioletQuickMenu`와 `QuickMenuFluid`를 사용합니다. `VioletQuickMenu`라는 이름은 호환을 위해 유지하며 털 렌더러는 현재 사용하지 않습니다.

## 검증과 완료 / Verification and completion

- 좁은 관련 검사를 먼저 실행합니다. 제품 변경의 마지막에는 전체 단위 검사·타입 검사·빌드를 실행합니다.
- 문서 변경은 링크·Mermaid 렌더링·SVG 키보드/포인터/모션 감소와 지침 간 일관성을 확인합니다.
- 같은 수정이 두 차례 실패하면 그 수정을 멈추고 배운 점을 보고합니다. 실제 결과와 계획을 구분합니다.
- 실습일지는 사용자가 정한 긍정 언어와 바이트 한도를 지킵니다. `20261023fri_1.md`는 작성 시 줄바꿈 포함 UTF-8 2,497 Byte, `20261026mon_1.md`는 브랜치 통합 후 2,493 Byte로 확인했습니다.
- 푸시 성공과 운영 배포 완료를 구분합니다. 실행하지 않은 검사나 설치하지 않은 스킬을 사용했다고 보고하지 않습니다.

## 자료와 예정 사항 / Assets and planned work

- 공식 CI 출처: [세종문화회관 아이덴티티 로고](https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200508).
- 사용자는 공식 로고 자산을 확보했으며 2026-10-23 안으로 반입할 예정이라고 알렸습니다. 신규 반입 완료 여부는 파일·출처를 확인한 뒤 갱신합니다.
- `limsflex`는 사용자가 조만간 공개를 검토하는 종합 고성능 스킬 구상입니다. 마크업 품질과 웹 산출물 코드의 가독성·구조적 아름다움을 높이는 방향이며, 현재 설치·실행 완료한 것으로 간주하지 않습니다.
- `.codex/analysis-v4/`, `chats/`, `conversations/`는 참고 이력입니다. 사용자 기록을 수정하거나 현재 지침으로 자동 승격하지 않습니다.
