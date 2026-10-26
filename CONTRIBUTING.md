# 함께 개발하기 / Contributing

> **공통 코딩헌법규정:** [CODING_CONSTITUTION.md](CODING_CONSTITUTION.md) · 기존 제품·v5 고유 규칙은 보존하고 신규 커밋·다중 에이전트 협업에 함께 적용합니다.


사람 개발자와 에이전트가 같은 저장소에서 일하기 위한 안내입니다. **모든 작업은 별도 브랜치에서 진행하며, `main`은 통합 전용입니다.** 현재 제품은 `v5/`입니다. 버전 선택 화면과 구버전은 작업에 필요할 때만 수정합니다.

Humans and agents must use task branches. Work on `v5/`, integrate into `main` with merge commits, and preserve earlier versions.

## 작업 시작 / Before editing

```powershell
git status --short
git remote -v
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c docs/20261023-readme-and-collaboration
```

다른 사람의 작업이나 미커밋 파일이 있으면 먼저 소유자와 범위를 확인합니다. pull이 실패하면 변경을 보존해 원인을 해결합니다. reset·강제 푸시로 이력을 덮어쓰지 않습니다.

Identify existing work before editing. Resolve update conflicts while preserving changes; do not reset or force-push to overwrite history.

2026-10-23부터 **사람과 모든 모델에 작업 브랜치가 필수**입니다. `feat/`, `fix/`, `docs/` 등 목적과 담당 작업이 드러나는 고유 이름을 사용합니다. 위 브랜치 이름은 예시이므로 각 작업에 맞게 바꿉니다. `main`에는 검토 후 **merge commit**으로 통합합니다. CLI에서는 `git merge --no-ff <branch>`, GitHub에서는 **Create a merge commit**을 사용합니다.

Task branches are mandatory for humans and all models. Use unique names and preserve branch history with `--no-ff` merges.

여러 사람이 동시에 일할 때는 **각자 브랜치와 별도 worktree 또는 clone**을 사용합니다. 같은 작업폴더에서 브랜치를 번갈아 전환하지 않습니다. 통합 담당자는 main 작업폴더에서 차례대로 병합하며, 충돌은 변경 의도를 대조해 해결합니다. reset·강제 푸시·공유 이력 재작성으로 대신하지 않습니다.

Concurrent contributors use separate worktrees or clones. One integrator merges reviewed branches sequentially; resolve conflicts while preserving each contributor's intent.

## 실행과 파일 선택 / Setup and source files

[README의 실행 안내](README.md#내-컴퓨터에서-실행--run-locally)대로 Node.js 24.x와 npm을 준비합니다. 페이지는 `v5/app/`, 공유 UI는 `v5/components/`, DB 호출은 `v5/src/lib/`와 `v5/src/catalog/`를 먼저 확인합니다.

Use the setup in the README. Inspect routes, shared components and existing database integrations before adding another implementation.

- 디자인 변경은 토큰·컴포넌트·가이드를 먼저 수정하고 제품에 연결합니다. / Update the contract and shared implementation before product markup.
- 실제 UI 텍스트는 `SystemText` 또는 `data-text`에 연결합니다. 최소 16px, 옅은 안쪽 경계와 공식 베리언트를 유지합니다. / Use shared typography and variants.
- 새 제품 소스·스크립트는 `.ts`·`.tsx`로 만듭니다. 타입은 `import type`으로 구분합니다. / Keep new source in TypeScript with type-only imports.
- `out/`, `_next/`, 생성 스냅샷을 직접 편집하지 않습니다. / Do not hand-edit generated exports or snapshots.
- DB 스키마 변경은 기존 테이블·정책 확인 후 새 마이그레이션으로 남깁니다. / Inspect current tables and policies, then record schema changes as migrations.

## 인증과 환경 설정 / Authentication and environment

공개 설정은 `v5/.env.local`에 넣습니다. Google Client ID와 Client Secret은 **Supabase의 Google 제공자 설정**에 두며 브라우저 코드에 넣지 않습니다.

Put public configuration in `v5/.env.local`. Google OAuth credentials belong in the Supabase provider settings, not client code.

| 설정 / Setting | 예시 / Example |
| --- | --- |
| Google 승인 리디렉션 URI / Authorized redirect | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |
| Supabase 허용 복귀 URL / Allowed application callback | `https://<APP_HOST>/v5/account/callback/` |
| 로컬 복귀 URL / Local callback | `http://127.0.0.1:3000/v5/account/callback/` |

운영·개발·미리보기 URL은 각각 허용 목록에 등록합니다. 키·토큰·비밀번호·회원 개인정보를 커밋이나 캡처에 포함하지 않습니다.

Allow each deployment environment separately. Keep credentials and member information out of commits and screenshots.

## 커밋 메시지 / Commit messages

**사람과 에이전트 모두 `**<현재브랜치명>** 영어 접두사: 한국어 설명`을 사용합니다.** 커밋 메시지 맨 앞에 `**` 별 문자 사이에 현재 작업 브랜치명을 그대로 적습니다. 이 규칙은 문서와 에이전트 지침에 정립돼 있습니다. 저장소에 공유된 commit-msg 훅은 없으므로, 문서 규칙을 자동 차단 장치가 있다고 오해하지 않습니다.

Both humans and agents use `**<current-branch>** English type: Korean description`. Always prefix the commit subject with the exact branch name enclosed in double asterisks.

| 접두사 / Type | 사용할 때 / Use for |
| --- | --- |
| `feat:` | 사용자 기능 추가 / New functionality |
| `fix:` | 잘못된 동작 수정 / Bug fixes |
| `style:` | 디자인·표현 수정 / Visual changes |
| `refactor:` | 동작을 유지한 구조 개선 / Structural changes without intended behavior changes |
| `docs:` | 안내·주석·설명자료 / Documentation |
| `test:` | 검사 추가·수정 / Tests |
| `chore:`, `build:`, `ci:` | 유지보수·빌드·자동화 / Maintenance, build and automation |

```text
**fix/member-notes** fix: 회원별 관람노트 조회에 소유자 조건 적용

변경: 로그인한 회원의 노트만 조회하도록 공통 저장소를 수정했다.
이유: 마이페이지와 노트 목록의 접근 기준을 일치시킨다.
검증: 회원 저장소 단위 검사와 소유권 SQL 검사를 통과했다.
```

작은 변경은 제목 한 줄이면 충분합니다. 큰 변경은 이유와 실제 수행한 검사·남은 제약을 본문에 남깁니다. `수정`, `업데이트`처럼 대상이 없는 제목, 이모지, 실행하지 않은 검사의 통과 주장은 사용하지 않습니다.

A one-line subject is enough for a small change. Larger changes should explain purpose, verification and remaining limits. Avoid vague subjects, emoji and unverified success claims.

## 무엇을 검사하나요 / Verification

관련 검사를 먼저 실행합니다. 제품 소스 변경의 마지막에는 전체 단위 검사와 정적 빌드를 실행합니다. 개발 서버와 빌드는 같은 `.next/`를 사용하므로 동시에 실행하지 않습니다.

Start with relevant checks. Finish product changes with the full unit suite and static build; stop the development server before building.

```powershell
cd v5
npm.cmd run check:system
npx.cmd tsc --noEmit --pretty false
$tests = @(Get-ChildItem tests -Recurse -File | Where-Object { $_.Name -match '\.test\.(ts|mjs)$' } | ForEach-Object FullName)
node --test @tests
npm.cmd run build
node scripts/audit-static-export.ts
```

| 변경 / Change | 추가 확인 / Additional checks |
| --- | --- |
| 컴포넌트·레이아웃 / UI | 320·390·768·1024·1440px, 키보드, 모션 감소, 가이드와 제품의 동일 베리언트 / Responsive sizes and shared variants |
| 인증·DB / Auth and data | 모의 응답 검사와 실제 RLS·RPC 검사를 구분 / Distinguish mocked tests from live database checks |
| README·문서 / Docs | 상대 링크, Mermaid 실제 렌더링, SVG의 키보드·포인터·모션 감소 / Links, diagram rendering and SVG interaction |
| 정적 산출물 / Export | 404·hydration 오류, 동적 청크, 전체 미러 / Asset references, hydration and mirror completeness |

문서 SVG는 `node v5/scripts/render-readme-assets.ts`로 만들고 `--check`로 원본과의 일치를 확인합니다. [자산 출처](docs/readme/ASSETS.md)도 함께 관리합니다.

Generate documentation SVGs with the script and check them with `--check`. Keep provenance alongside the assets.

## 스테이징·푸시 / Stage and push

사람은 `git diff`를 읽고 자신의 작업 파일을 명시적으로 스테이징합니다. 제품을 빌드했다면 **전체 `v5/out/`과 루트 미러도 포함**합니다. 아래 파일명은 문서 작업의 예시이므로 실제 변경에 맞춰 선택합니다.

Humans review and explicitly stage their changes. Product builds must include the complete export and mirrored output; adapt these example paths to the actual work.

```powershell
git diff --check
git add README.md CONTRIBUTING.md docs/readme
git diff --cached --stat
git diff --cached --check
git commit -m "docs: 프로젝트 안내와 개발자 기여 절차 정리"
git push -u origin HEAD
```

빌드 산출물이 무시되는 경우 `git add -f v5/out`으로 전체를 포함합니다. 빌드한 제품의 소스·미러도 변경 목록에서 확인합니다.

Use `git add -f v5/out` if the export is ignored, and review the corresponding sources and mirror.

**에이전트는 별도 자동 완료 규칙을 따릅니다.** 작업 브랜치에서 `git status`로 기존 변경과 미추적 파일을 확인하고 `git add -A`로 누락 없이 스테이징한 뒤 커밋하고 즉시 `git push -u origin HEAD`를 실행합니다. [루트 AGENTS.md](AGENTS.md)와 [v5 AGENTS.md](v5/AGENTS.md)를 함께 읽습니다.

Agents follow the automatic completion instructions on their task branch, including staging all changes and pushing the branch immediately after committing.

검토와 검증을 마친 브랜치는 통합 담당자가 다음과 같이 main에 합칩니다. 별도 브랜치의 커밋과 병합 커밋을 모두 보존합니다.

The integrator merges a reviewed branch as follows, preserving both task and merge commits.

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff docs/20261023-readme-and-collaboration -m "docs: 프로젝트 문서와 다중 협업 기준 통합"
git push origin main
```

일반 clone은 원본 저장소에만 푸시합니다. 소유자 환경의 이중 push URL이나 비공개 미러 자격 증명을 다른 개발자에게 복사하지 않습니다. 원본의 편집 권한과 저장소 삭제·미러 접근 권한은 별개입니다.

Normal clones push only to the source repository. Do not share the owner's private-mirror push configuration or credentials.

마지막으로 원격 SHA와 Vercel의 배포 상태를 각각 확인합니다. 푸시 성공은 배포 완료와 같은 뜻이 아닙니다.

Verify the remote commit and deployment separately. A successful push does not prove a successful deployment.
