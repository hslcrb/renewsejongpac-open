# 코딩헌법규정 채택·검증 기록 (2026-10-26)

## 적용 전에 확인한 기존 문서
- [AGENTS.md](../AGENTS.md): 현재 브랜치 이름을 이중 별표 사이에 표시; 고유 브랜치·즉시 push·v5 빌드 산출물 보존.
- [v5/AGENTS.md](../v5/AGENTS.md): v5 TypeScript·디자인 계약·Supabase·정적 빌드.
- [CONTRIBUTING.md](../CONTRIBUTING.md): 검토·테스트 및 non-ff merge commit 통합.
- [LLM_REFERENCE.md](../LLM_REFERENCE.md): 도구·DB·코드 경로의 현재 참조.
- [브랜치 통합 기록](branch-consolidation-20261026.md): 다중 pushurl, 동시 분기, 당시 43개 원격 브랜치 분류·통합.
- [firstclass 중복 미러 철회](firstclass-mirror.md): 중복 훅·스크립트 재도입 금지, 공개 미러와 비공개 보관 미러 분리.
- [에이전트 도구 기록](agent-tools-2026-10-16.md): 과거 로컬 설치 사실은 새로운 실행 환경에서의 설치 증거가 아님.

## 도입 방식
[코딩헌법규정](../CODING_CONSTITUTION.md) 제1판을 기준으로 사용하되, 해당 저장소의 더 구체적인 지침과 충돌시키지 않는다. 기존 역사적 커밋을 소급 재작성하지 않는다. 과거 비표준 commit type, Merge pull request 자동 제목 등을 새 규칙의 허용 사례로 간주하지 않는다.

`scripts/check-coding-constitution.mjs`는 형식·허용 접두사·한국어 설명을 검사한다. `.github/workflows/coding-constitution.yml`은 **경고(advisory) 모드로만 실행**되며, GitHub Ruleset·branch protection 적용을 의미하지 않는다. 모든 PR 통합 담당자는 merge commit 제목을 `**main** merge: ...`로 명시한다.

## 후속 검증
1. docs 링크와 새 허용 목록 및 기존 규정 일치 확인.
2. 검사기의 올바른 제목 PASS·비허용 타입 FAIL·브랜치 불일치 FAIL 확인.
3. PR head SHA와 main 원격 SHA를 분리 검증.
4. CI 결과와 실제 merge commit 여부, 미러 원격 상태를 각각 기록.
5. CI가 의도적으로 비활성화된 타 저장소에는 해당 YAML을 자동 복사하지 않는다.

## 이슈 예방
이 저장소의 [2026-10-26 통합 기록](branch-consolidation-20261026.md)은 당시 사건에 대한 근거 문서이며, 오늘 실시간 브랜치 상태를 보증하지 않는다. 동시에 작동하는 AI 에이전트가 main을 진전시킬 수 있어 병합 직전 원격 SHA 재확인이 필수다. 기존 사용자의 로컬 git 설정이나 GitHub 관리자 수준 ruleset을 변경한 것으로 주장하지 않는다.
