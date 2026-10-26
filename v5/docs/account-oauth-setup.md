# 마이페이지 Google 로그인 연결

2026-10-21 최초 읽기 전용 점검에서 운영 앱의 Supabase 주소는 `https://cowalyqaoqoclrfmxszp.supabase.co`로 확인되었으나 Google 제공자가 꺼져 있었습니다. 이후 소유자가 운영 프로젝트 `renewsejongpac-3`에서 제공자를 활성화했습니다. 06:03 UTC 재검증에서 `google: true`, Google authorize HTTP 302, 이동 호스트 `accounts.google.com`, 전달된 Supabase callback 주소 일치를 확인했습니다. 소유자는 앱 Redirect URL도 저장했다고 확인했습니다. 실제 Google 계정 동의와 앱 복귀는 별도의 최종 확인이 필요합니다.

연결된 Supabase 계정에서 보이는 비활성 `bcfycodteltoitqmztdl` 프로젝트는 운영 앱이 사용하는 프로젝트와 다릅니다. 현재 연결 권한으로는 운영 `cowalyqaoqoclrfmxszp` 프로젝트 설정에 접근할 수 없으므로 해당 프로젝트 소유자의 설정 작업이 필요합니다.

## 앱에 반영된 흐름

- 로그인 화면이 공개 `/auth/v1/settings`를 확인합니다. Google 제공자가 실제 활성화되어 있을 때만 Google 버튼을 사용할 수 있습니다. 연결 실패와 제공자 준비 상태를 따로 안내합니다.
- `@supabase/supabase-js`의 공개 클라이언트가 PKCE를 시작합니다. `flowType: "pkce"`, `detectSessionInUrl: false`로 설정하고 복귀 화면에서 `exchangeCodeForSession`을 명시적으로 한 번 실행합니다. 같은 브라우저의 verifier가 없거나 코드가 실패하면 기존 세션을 새 로그인 성공으로 오인하지 않습니다.
- 앱 복귀 주소는 로그인한 브라우저의 origin과 고정 `/v5/account/callback/` 경로입니다. 외부 `redirectTo`를 거절하고, `next` 같은 사용자 제공 목적지는 따르지 않습니다. 성공 후 `/account`로 이동하고 일회용 코드를 주소 기록에서 지웁니다.
- `useAccountIdentity()`는 실제 SDK 세션만 인증으로 인정합니다. 기존 로컬 이름·이메일·세션 값은 로그인을 만들거나 DB 접근을 허용하지 않습니다. Google 로그인 성공은 이후 사용자가 확인했습니다.
- 이름·연락처는 회원 DB에 반영합니다. 인증 제공자의 메타데이터는 최초 표시 정보로만 읽고, Google 이메일 변경은 제공자에서 처리합니다. 개인 공간·관심 공연·관람노트·예매 기록의 DB 전환과 설치 SQL은 [현재 회원 DB 계약](visual-contract-and-member-db.md)을 따릅니다. 표시용 user metadata를 권한 판정에 사용하지 않습니다.
- 이메일 로그인·회원가입·복구는 PKCE 이메일 링크로 계정 소유를 확인합니다. 실제 요청이 성공하기 전에는 링크 전송 성공이나 로그인 완료를 표시하지 않습니다.

## 운영 설정과 최종 확인

1. Google Auth Platform의 웹 OAuth 클라이언트에 origin `https://renewsejongpac.rhee.life`를 등록합니다.
2. Google의 **Authorized redirect URIs**에 정확히 `https://cowalyqaoqoclrfmxszp.supabase.co/auth/v1/callback`을 등록합니다. 이 주소는 Supabase가 Google 응답을 받는 주소이며 앱 화면 주소와 다릅니다.
3. 운영 Supabase 프로젝트 **Authentication → Sign In / Providers → Google**에서 발급된 Google Client ID와 Client Secret을 설정하고 Google 제공자를 활성화합니다. 동의 화면의 대상 사용자·테스트 사용자·게시 상태도 확인합니다.
4. Supabase **Authentication → URL Configuration**의 Redirect URLs에 `https://renewsejongpac.rhee.life/v5/account/callback/`을 정확히 추가합니다. 소유자가 저장을 확인했으며 관리자 API로 직접 조회한 것은 아닙니다. Site URL은 운영 사이트에 맞춥니다. 개발이 필요하면 `http://localhost:3000/v5/account/callback/`도 별도로 허용합니다. Preview는 사용하는 주소만 허용합니다.
5. 로그인 화면에서 Google 버튼이 활성화되는지 확인한 다음, 실제 본인 계정으로 동의·복귀·새로고침·로그아웃을 확인합니다. 브라우저 네트워크 응답에 키·토큰을 복사하여 이 문서나 이슈에 기록하지 않습니다.

Vercel에 `GOOGLE_CLIENT_ID`·`GOOGLE_CLIENT_SECRET`을 저장한 것만으로 Supabase의 Google 제공자가 활성화되지는 않습니다. 현재 정적 앱은 이 서버용 변수를 사용하지 않습니다. `GCP_AUTHORIZED_*` 값도 Google 콘솔을 자동으로 변경하지 않습니다. 저장된 URI 힌트는 앱 `/v5/`와 `/v5/account`이며, 위 Supabase callback이 실제 Google 콘솔에 등록됐는지는 소유자가 확인해야 합니다.

## Vercel 공개 설정

다음 변수들이 Production과 Preview에 존재합니다. Development 대상은 등록되지 않았습니다.

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 운영 공개 API 주소 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 현재 값은 최신 publishable 형식인 공개 브라우저 키 |
| `NEXT_PUBLIC_SITE_URL` | 운영 사이트 주소 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | 앱에서 사용하지 않는 발급 정보; 제공자 설정은 Supabase에 필요 |
| `GCP_PROJECT_ID` | 앱에서 사용하지 않는 프로젝트 정보 |
| `GCP_AUTHORIZED_JAVASCRIPT_ORIGINS`, `GCP_AUTHORIZED_REDIRECT_URIS` | 앱에서 사용하지 않는 설정 힌트 |

로컬 `v5/.env.local`·`v5/.env.production.local`에는 위 `NEXT_PUBLIC_*` 세 개만 두며 Git에서 제외합니다. `service_role`, `sb_secret_*`, Google Client Secret은 브라우저 환경에 넣지 않습니다. 공개 환경 변수는 정적 빌드 시 포함되므로 변경 뒤에는 재빌드·재배포가 필요합니다.

공식 근거: [Google OAuth 설정](https://supabase.com/docs/guides/auth/social-login/auth-google), [허용 Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [브라우저 PKCE 자동 교환](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
