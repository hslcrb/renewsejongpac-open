# v5 첫 진입 인트로 · scenartmv.svg

## 적용 범위

- **주소**: `/v5/` 최초 문서 진입 시 한 번 재생. v5 내부 라우트 이동 중에는 재생하지 않으며 다른 경로로 직접 진입할 때도 표시하지 않는다.
- **기관 소개와의 구분**: `components/IntroductionExperience.tsx`는 `/v5/about/introduction/`에 쓰이는 별도 기관 소개 페이지다. 이 파일을 교체하거나 수정하지 않는다.
- **원본**: 사용자가 업로드한 `scenartmv.svg`. 원본을 최적화·압축·삭제하지 않고 `public/assets/intro/scenartmv.svg`에 등록한다. 원본 SHA-256: `83d6625294ea8568139e04f590c6b09b3428c870ebaad669128a549223cdd99f`.
- **배포 자산 URL**: `/v5/assets/intro/scenartmv.svg`. Next.js 정적 빌드에서 `out/assets/intro/`로 복사되고 `scripts/sync-out.ts`가 `v5/assets/intro/`까지 미러링한다.

## 구현 소스

| 경로 | 역할 |
| --- | --- |
| `app/layout.tsx` | 루트에 인트로를 마운트하면서 기존 CatalogProvider와 SiteShell을 동시에 유지; 공개 DB의 HTTPS 원본에만 preconnect 힌트 추가 |
| `components/HomeEntryIntro.tsx` | 최초 진입 판단, 이미지 렌더링, 타입 연출, 건너뛰기·키보드·탭 이탈·포커스 복원 |
| `components/HomeEntryIntro.module.css` | 원본 SVG 동작을 유지한 줌/페이드, 반응형 레이아웃, 모션 감소, 10초 CSS 탈출 경로 |
| `src/lib/home-entry-intro.ts` | 타임라인과 경로 판별의 단일 원본 |
| `tests/home-entry-intro.test.ts` | 시간·경로·원본 SHA-256·접근성 폴백 계약 |

## 타임라인

포트폴리오 저장소 `hslcrb/rheehoseTechportpolio_nextjs`의 `HomeIntro` 흐름(`artwork: 2,600ms`, 타이핑 후 퇴장, 최대 10초 watchdog)을 참고했다.

1. 원본 SVG를 로드하고 약 **2.6초** 동안 중앙 확대·소멸.
2. 약 **2.9초**부터 “예술의 순간, 세종에서 만나다”를 130ms/글자로 출력.
3. 완성 문장을 1.3초 유지, 850ms 페이드로 종료. 총 길이는 약 **7초대**.
4. 버튼·Esc로 즉시 건너뛰고, 모바일/저사양 기기에서 사용자 모션 감소 설정을 존중한다.
5. 이미지 자체의 SMIL 애니메이션과 SVG 접근성용 `title`/`desc`는 원본 그대로 보존한다. 이미지 태그에서는 중복 낭독을 피하기 위해 `alt=""`를 설정한다.

## 네트워크 · 초기화 원칙

인트로는 **페이지 로딩 화면이 아니라 시각적 오버레이**다. 뒤의 `CatalogProvider`와 `SiteShell`을 언마운트하지 않으므로, 콘텐츠 갱신·초기 자산 요청·Supabase 인증 복원 등이 평소처럼 동시에 시작된다.

`layout.tsx`는 올바른 `NEXT_PUBLIC_SUPABASE_URL`이 HTTPS일 때만 해당 origin의 `preconnect`·`dns-prefetch` 힌트를 보낸다. 이는 DNS·TCP·TLS의 조기 시작을 유도하는 **브라우저 힌트**이며, 실제 연결 완료·DB 응답·로그인 상태를 보장하지 않는다. 키·토큰·환경 파일을 새로 만들거나 내보내지 않는다. 인트로 종료 시점에 실패한 API 요청을 성공으로 표현하지 않는다.

## 검증 · 릴리스

```powershell
cd v5
npm.cmd ci
node --test tests/home-entry-intro.test.ts
npm.cmd run check:system
npx.cmd tsc --noEmit --pretty false
npm.cmd run build
node scripts/audit-static-export.ts
```

브라우저 수동 검증: `/v5/` 직접 진입, 버전 선택에서 진입, 모바일 320/390px, 1440px, 페이지 뒤 컨텐츠 초기 로딩, Skip/ESC, hash 직접 진입, prefers-reduced-motion, 새로고침, 내부 페이지 이동, 서버 또는 SVG 로드 실패를 차례로 확인한다.

**빌드 반영 필수**: 제품 소스만 병합해도 기존 `v5/index.html`과 `v5/_next`는 갱신되지 않는다. 검증 뒤 전체 `out/` 및 루트 미러를 작업 브랜치에서 생성·커밋한 다음 `--no-ff`로 병합한다. 빌드하지 않은 산출물을 완료라고 보고하지 않는다.

## 협업 및 분기

`AGENTS.md`, `v5/AGENTS.md`, `CONTRIBUTING.md`를 따른다. 작업 브랜치에서 영어 접두사와 한국어 설명을 사용하며 메시지 맨 앞에 `**브랜치명**`을 붙인다. 커밋 이후 PR 리뷰와 merge commit을 거치고, 병합이 확인된 작업 브랜치만 삭제한다.

## 작업 환경 검증 결과 · 2026-10-26

| 단계 | 상태 | 근거 및 후속 |
| --- | --- | --- |
| 원본 SVG 검증 | **완료** | 업로드 파일 SHA-256 `83d6625294ea8568139e04f590c6b09b3428c870ebaad669128a549223cdd99f`; XML 파싱 성공, SMIL 애니메이션 463개, 스크립트 및 외부 URL 참조 없음 |
| GitHub 파일 일치 | **완료** | `public/assets/intro`, `out/assets/intro`, 루트 `assets/intro` 모두 원본과 완전 일치 |
| TSX/CSS/등록부 | **소스 반영** | 인트로 컴포넌트와 홈 레이아웃 연결, 디자인 시스템 등록, 진입 시간표, 브라우저 검증 시나리오 추가 |
| 컴포넌트 계약 기존 오류 | **수정 커밋 반영, 재검증 필요** | Vercel 최초 빌드에서는 기존 AiChatWidget, DeepSearch, DeepSearchDisclosure, ChatAssistant의 등록/컨트롤 위반으로 `prebuild` 실패. 등록부 연결, 공용 SystemButton/SystemField 전환, 미사용 구현 공개 export 해제를 작업 브랜치에 반영 |
| 전체 단위·정적 빌드·브라우저 | **실행 미완료** | 현 GitHub Actions는 `startup_failure`; Vercel 추가 preview 배포 API는 `402 api-deployments-free-per-day` 제한. 성공으로 기재하지 않는다 |
| 생성 자산 `_next`, `index.html` | **동기화 전** | 에셋 SVG 미러만 등록되었다. 최신 소스 전체의 Next.js 정적 빌드·`out/`·루트 미러 갱신은 위 차단 해제 후 필요 |
| 병합 및 브랜치 삭제 | **검증 이후** | AGENTS의 `--no-ff` 검증 선행 요구를 따른다. 현재 PR과 소스만으로 운영 반영을 선언하지 않는다 |

중요: 브라우저가 데이터를 갱신하는 동안 인트로가 표시되므로 **초기 연결이 반드시 성공한 뒤 전환한다는 뜻은 아니다**. 모든 사용자에게 인트로를 강제로 기다리게 하지 않으며 모션 감소·건너뛰기·최대 10초 보호 경로가 있다.

후속 작업자는 제한이 풀린 환경에서 `npm ci` → `npm run test:entry-intro` → `npm run check:system` → `npx tsc --noEmit` → `npm run build` → `npm run test:entry-intro:browser`를 실행하고 `v5/src/data/component-usage.ts`를 생성 도구로 동기화한 뒤, 전체 `out/`와 루트 미러의 실제 diff를 검토해 작업 브랜치에 추가하고 PR 병합·브랜치 정리를 완료해야 한다. 생성 파일을 수동 조작해 성공으로 위장하지 않는다.
