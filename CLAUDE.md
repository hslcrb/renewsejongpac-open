# Claude 작업 입구 / Claude project entry

먼저 [AGENTS.md](AGENTS.md), 변경 범위가 v5라면 [v5/AGENTS.md](v5/AGENTS.md), 이어 [LLM_REFERENCE.md](LLM_REFERENCE.md)를 읽습니다. 사람 개발자와 함께 사용하는 절차는 [CONTRIBUTING.md](CONTRIBUTING.md)에 있습니다.

Read the root and applicable nested AGENTS instructions, then the LLM reference and contribution guide.

## 브랜치 필수 / Task branches are mandatory

- **Claude·Codex·다른 모델·사람 모두 작업별 브랜치에서 수정합니다. main은 통합 전용입니다.**
- 동시 작업자는 별도 worktree/clone을 사용합니다. 공유 작업폴더에서 다른 작업자의 브랜치를 전환하지 않습니다.
- 커밋 형식은 `영어 접두사: 한국어 설명`입니다. 작업 브랜치에서 검증·커밋·일반 푸시합니다.
- 검토한 브랜치는 `git merge --no-ff <branch>` 또는 GitHub의 **Create a merge commit**으로 main에 통합하고 일반 푸시합니다.
- 과거 대화의 main 직접 수정 지침은 2026-10-23 브랜치 필수 규칙으로 대체합니다. reset·강제 푸시·공유 이력 재작성은 사용하지 않습니다.

## 구현과 보고 / Implementation and reporting

- 현재 제품은 v5입니다. 기존 화면과 다른 사람의 변경은 요청 범위 안에서 보존합니다.
- 디자인 토큰·등록 컴포넌트·가이드를 먼저 수정하고 실제 화면에 연결합니다. 새 공통 UI를 중복해서 만들지 않습니다.
- 콘텐츠와 회원 기록의 원본은 Supabase입니다. 스냅샷은 자동 생성하며 인증·DB 저장 성공 여부는 실제 응답으로 확인합니다.
- 관련 검사를 먼저 실행하고, 제품 변경의 최종 전체 검사·빌드 결과를 확인합니다. 문서 변경은 링크·SVG·Mermaid와 지침의 일관성을 확인합니다.
- 제품 소스는 TypeScript로 유지하고, 빌드한 전체 `out/`과 미러 산출물을 함께 커밋합니다.
- 실습일지는 지정된 UTF-8 바이트 한도와 긍정 서술 조건을 확인합니다. 실제 수행과 향후 계획을 구분합니다.
- 키·토큰·개인정보를 출력하거나 커밋하지 않습니다. 비공개 미러 권한은 원본 협업자에게 공유하지 않습니다.

핵심 지침의 단일 기준은 AGENTS와 CONTRIBUTING입니다. 이 파일에서 서로 다른 절차를 추가하지 않습니다.
