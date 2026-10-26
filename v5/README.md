# 세종문화회관 v5 / Sejong Center v5

현재 개발 대상은 이 폴더입니다. **Next.js 14.2.35 · React 18 · TypeScript · Node.js 24.x**를 사용하며, 인증·콘텐츠·회원 기록은 Supabase에 연결합니다.

This is the active application. It uses Next.js 14.2.35, React 18, TypeScript and Node.js 24.x, with Supabase for authentication and data.

**사람과 모든 모델은 작업 브랜치를 반드시 사용합니다.** 동시 작업은 별도 worktree/clone으로 분리하고, 검토한 브랜치만 main에 `--no-ff`로 통합합니다. / Task branches are mandatory; integrate reviewed work with `--no-ff`.

- [프로젝트 설명·구조도·전체 ERD / Overview, architecture and ERDs](../README.md)
- [사람 개발자의 실행·커밋·검증 절차 / Human contributor workflow](../CONTRIBUTING.md)
- [에이전트의 v5 작업 규칙 / Agent instructions](AGENTS.md)
- [디자인 시스템 / Design system](https://renewsejongpac.rhee.life/v5/design-rules/)
- [실제 컴포넌트 연결표 / Component connections](docs/component-connections.md)
- [v5 첫 진입 SVG 인트로·네트워크 선연결·검증 안내 / Entry intro](docs/home-entry-intro.md)

## 실행 / Run

저장소 루트에서 아래 명령을 실행하고 `.env.local`은 [공통 안내](../README.md#내-컴퓨터에서-실행--run-locally)에 따라 작성합니다. macOS·Linux에서는 `npm.cmd` 대신 `npm`을 사용합니다.

Run from the repository root. Configure `.env.local` using the main guide; use `npm` on macOS or Linux.

```powershell
cd v5
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```

홈은 <http://127.0.0.1:3000/v5/>입니다. 주소에 `/v5/`가 필요합니다. / Open the app with the `/v5/` prefix.

## 빌드 / Build

개발 서버를 종료한 뒤 이 폴더에서 실행합니다. / Stop the development server first.

```powershell
npm.cmd run build
```

빌드는 공개 DB 스냅샷을 읽고 계약을 검사한 뒤 `out/`을 생성합니다. `scripts/sync-out.ts`가 결과를 이 폴더 루트에도 미러링합니다. 자동 생성된 파일을 직접 고치지 말고 **소스·전체 out·미러를 함께 커밋**합니다.

The build reads the published database, checks contracts, exports to `out/` and mirrors that output here. Edit source files and commit sources together with the complete export and mirror.

현재 문서에서 구버전의 hash 경로·브라우저 저장 설명을 v5 지침으로 사용하지 않습니다. 이전 버전은 [v4 README](../v4/README.md)에 보존합니다.

Legacy hash routes and browser-storage instructions do not describe v5; historical documentation remains with v4.
