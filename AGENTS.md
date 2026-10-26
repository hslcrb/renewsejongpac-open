# Git Auto-Commit & Commit Message Guidelines

> **공통 코딩헌법규정:** [CODING_CONSTITUTION.md](CODING_CONSTITUTION.md) · 기존 제품·v5 고유 규칙은 보존하고 신규 커밋·다중 에이전트 협업에 함께 적용합니다.


## 브랜치 필수 / Mandatory branches — 2026-10-23

- **사람 개발자·Codex·Claude·그 밖의 모든 모델은 작업별 브랜치에서 수정합니다. `main`은 통합 전용입니다. 이전의 main 직접 작업 지침은 이 규칙으로 대체합니다.**
- 작업 시작 시 상태·원격·기존 변경을 확인하고 fetch한 뒤, 최신 `main`에서 목적이 드러나는 고유 브랜치를 만듭니다. 예: `docs/20261023-readme-and-collaboration`, `feat/<담당자>-<작업>`.
- 동시 작업자는 각자 브랜치와 별도 worktree/clone을 사용합니다. 같은 작업폴더에서 서로의 브랜치를 전환하거나 다른 작업자의 변경을 덮어쓰지 않습니다.
- 작업 브랜치에서 검사·커밋하고 일반 푸시합니다. 검토한 브랜치는 통합 담당자가 `git merge --no-ff <branch>`로 `main`에 합칩니다. GitHub에서는 **Create a merge commit**을 사용합니다. squash·공유 이력 재작성·reset·강제 푸시는 사용하지 않습니다.
- 공통 절차는 [CONTRIBUTING.md](CONTRIBUTING.md), 모델용 프로젝트 참조는 [LLM_REFERENCE.md](LLM_REFERENCE.md), 문서 탐색 입구는 [llms.txt](llms.txt)입니다.

- **사람·에이전트 공통 규칙의 연결**:
  - 프로젝트 소개는 [README.md](README.md), 사람 개발자의 실행·검증·리뷰·커밋 절차는 [CONTRIBUTING.md](CONTRIBUTING.md)를 기준으로 읽습니다.
  - 사람과 에이전트 모두 `영어 접두사: 한국어 설명`을 사용합니다. 사람의 명시적 스테이징 절차와 아래 에이전트의 자동 `git add -A`·커밋·푸시 절차를 혼동하지 않습니다.
  - 커밋 훅이 자동 강제한다고 주장하지 않습니다. 현재는 저장소 문서와 에이전트 지침으로 규칙을 적용합니다.

- **파일 생성 및 수정 완료 시 자동 커밋 및 푸시**:
  - 파일 생성이나 수정 작업이 완료되면, 항상 `git status`를 확인하고 모든 미추적(untracked) 파일과 변경사항을 전부 스테이징(`git add -A`)하여 즉시 커밋합니다.
  - 누락되는 미추적 파일이 없도록 작업 완료 시점에 철저히 확인합니다.
  - 작업 브랜치의 커밋 직후 `git push -u origin HEAD`로 해당 브랜치를 일반 푸시합니다. 검증·검토 후 `--no-ff`로 main에 통합한 직후 `git push origin main`을 실행합니다. main에서 직접 수정·커밋하지 않습니다.

- **커밋 메시지 형식**:
  - 반드시 **`**<현재브랜치명>** [영어 접두사]: [한국어 설명]`** 형식을 따릅니다.
  - **브랜치명 필수 표기**: 커밋마다 맨 앞에 `**` 별 문자 사이에 현재 작업 브랜치명을 그대로 적습니다.
  - 접두사: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`, `merge:` 등
  - 설명: 수행한 변경 내용을 명확한 한국어로 기술합니다.
  - 예시:
    - `**feat/booking-ui** feat: 세종문화회관 v4 티켓 예매 여정 인터랙션 고도화`
    - `**chore/motion-tools** chore: Motion 및 애니메이션 도구 체계 환경 구성`
    - `**docs/20261026-integration** docs: 작업 진행 내역 및 검증 문서 업데이트`
    - `**main** merge: 세종문화회관 v4 티켓 예매 여정 인터랙션 고도화 브랜치 main 통합`

- **v5 소스 TS 전환 원칙**:
  - 제품 소스는 전부 TypeScript(`.ts`/`.tsx`)로 유지합니다(`v5/src`, `v5/app`, `v5/components`, `v5/scripts`). 새 파일도 TS로 생성합니다.
  - 브라우저가 직접 실행하는 동결 산출물은 JS 유지: `v5/assets/entry.js`, `v5/public/assets/icons/material-symbols.js`, `v5/js/*`(legacy.html용), `v5/v2/*`, 루트 `v2/`, `v3/`, `v4/` 스냅샷.
  - 테스트(`node --test` 등)가 `.ts`를 직접 import하므로 Node 24 type stripping을 고려해 타입은 반드시 `import type`으로 구분합니다(값 import에 타입 이름 혼용 금지).
  - `next.config.ts`는 Next 14에서 미지원이므로 `next.config.mjs`를 유지합니다.
  - 18개 v4 바닐라 보존 파일(`src/app.ts`, `src/app-runner.ts`, `src/components/{cards,carousel,motion,ui}.ts`, `src/features/{design-rules,flows,goods,home,home-booking,journeys,pages,programs,search,story,utilities}.ts`, `src/lib/discovery.ts`)은 `// @ts-nocheck`와 한·영 보존 주석을 유지합니다.

- **정적 빌드 산출물 커밋 지속 기준**:
  - `npm.cmd run build`가 만드는 `v5/out/` 전체와 `scripts/sync-out.ts`가 미러링한 `v5/` 루트의 `index.html`, `_next/`, 정적 복사물은 배포 여부와 무관하게 항상 `git add -A`에 포함해 커밋합니다.
  - sync-out은 `v5/_next`를 통째로 삭제한 뒤 복사(미러)하므로, 이전 build의 오래된 청크가 남지 않도록 작업 후 `rg`로 주요 문구 잔존 여부를 확인합니다.

