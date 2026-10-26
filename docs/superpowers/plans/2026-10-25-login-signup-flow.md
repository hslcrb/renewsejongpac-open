# Login to Signup Implementation Plan

**Goal:** GNB의 로그인·회원가입을 로그인으로 연결하고, 미등록 이메일은 회원가입 단계로 이어준다.

**Architecture:** Supabase OTP의 기존 계정 전용 요청을 유지한다. 미등록 계정 응답만 별도 오류로 분류하고, 로그인 화면에서 이메일을 전달해 기존 회원가입 화면으로 이동한다. Google OAuth와 PKCE 콜백은 유지한다.

**Tech Stack:** Next.js 14, React 18, TypeScript, Supabase Auth, Node.js 24, Playwright.

**Spec:** 2026-10-25 사용자 요청: GNB에 로그인·회원가입 두 항목 유지, 모두 로그인으로 이동, 없는 계정 입력 시 자동 회원가입 단계 전환.

## Constraints and review focus

- 기존 계정 요청은 `shouldCreateUser: false`를 유지한다.
- `otp_disabled`와 `Signups not allowed for otp`가 함께 온 경우만 가입으로 안내한다. 서비스 장애·요청 제한·인증 비활성화는 전송 오류로 남긴다.
- 회원가입은 이름·필수 동의를 검증한 뒤 계정 생성 허용 요청을 보낸다. 링크 요청만으로 로그인 상태를 만들지 않는다.
- 기존 디자인 시스템과 반응형 레이아웃을 사용한다.
- 전체 단위 검사·타입 검사·정적 빌드 후 전체 out 및 루트 미러를 커밋한다.

## Tasks

- [x] `v5/tests/email-signin.test.ts`에서 실제 SDK의 모의 응답으로 미등록 계정·일반 오류·기존 로그인·가입 요청을 검사하고 기존 구현에서 실패를 확인한다.
- [x] `v5/src/lib/supabase.ts`에 `EmailSignupRequiredError`를 추가한다.
- [x] `v5/components/Header.tsx`의 두 항목을 로그인으로 연결한다.
- [x] `v5/app/account/login/page.tsx`에서 미등록 이메일을 가입 화면으로 전달하고, `v5/app/account/signup/page.tsx`에서 이메일을 채운 뒤 이름 입력으로 초점을 옮긴다.
- [x] `v5/tests/account-auth-browser.ts`에 GNB 이동, 자동 전환, 필수 검증, 320·390·768·1024·1440px, Google OAuth 회귀 시나리오를 구현한다. 이전 실행 기록에서 주요 시나리오는 통과했으나 **전체 검사 종료의 증거는 아직 없다**.
- [x] 이전 작업 기록에서 단위 검사 157개 통과·1개 건너뜀, 타입 검사 및 정적 빌드·산출물 감사를 확인한다.
- [x] 기능 브랜치가 `ecfda843`에서 `main`에 merge commit으로 통합되었고, 배포 커밋 `0a30a5a`가 Vercel 프로덕션에서 `READY`임을 확인한다.
- [x] 테스트 서버 응답 지연 문제를 줄이기 위해 `v5/scripts/run-auth-browser.ts`와 `npm run test:auth:browser`를 추가한다.
- [ ] **남은 실환경 검증:** 전체 Playwright 모의 인증 테스트를 끝까지 실행하여 `auth-report.json` 전 항목의 통과를 확인한다. 실제 Google 동의와 이메일 수신은 별도의 수동 검증이 필요하다.

## 회귀 테스트 실행

Node.js 24 환경에서 `v5`를 작업 디렉터리로 실행합니다. 비밀키나 `.env.local`을 Git에 추가하지 않습니다.

```bash
cd v5
npm ci
npm run check:system
node --test tests/email-signin.test.ts tests/account-auth.test.ts
npx tsc --noEmit
npm run build
npm run test:auth:browser
```

- `test:auth:browser`는 `v5/out/`을 `/v5/` 경로에 매핑해 임의의 로컬 포트에서 제공하고, 검사 종료 시 서버를 닫습니다. 기존의 별도 Python 서버·Junction과 포트 충돌을 피하기 위한 장치입니다.
- `v5/.env.local`에는 **공개 Supabase URL과 publishable(또는 anon) 키**만 구성합니다. 브라우저 테스트는 인증 제공자 요청을 가로채 모의 응답으로 검증합니다.
- 검사 결과는 `v5/.lemonade/account-space/auth-report.json`에서 확인합니다. 모든 `passed`가 `true`여야 하고, 실패 시 명령이 실패 상태로 끝나야 합니다.
- Google 승인 화면에 실제로 로그인하는 E2E 테스트나 실제 이메일 수신 시험을 수행한 것으로 간주하지 않습니다.
- 커밋된 `v5/out/` 및 `v5/_next/` 산출물을 다시 빌드할 때는 프로젝트 지침의 전체 산출물 포함 규칙을 준수합니다.
