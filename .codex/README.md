# Codex 프로젝트 안내 / Codex project guide

이 폴더의 분석 자료와 대화 이력은 보존합니다. 현재 작업 지침은 다음 문서를 통해 읽습니다.

1. [루트 AGENTS](../AGENTS.md)와 [v5 AGENTS](../v5/AGENTS.md).
2. [LLM Reference](../LLM_REFERENCE.md): 현재 제품·DB·디자인·검증 기준.
3. [CONTRIBUTING](../CONTRIBUTING.md): 사람과 모델의 협업 절차.
4. [README](../README.md)와 [llms.txt](../llms.txt): 프로젝트와 문서 탐색.

## 브랜치 필수 / Task branches are mandatory

**Codex·Claude·다른 모델·사람 모두 고유 작업 브랜치에서 수정합니다. main은 통합 전용입니다.** 동시 작업은 별도 worktree/clone을 사용합니다. 같은 작업폴더에서 다른 사람의 브랜치를 전환하지 않습니다. 작업 브랜치에서 검증·커밋·일반 푸시하고, 검토한 브랜치를 main에 `--no-ff`로 통합합니다.

커밋 메시지는 `영어 접두사: 한국어 설명`입니다. 전체 자동 완료 절차는 AGENTS를 따릅니다. 과거 기록의 main 직접 작업 지침은 현재 규칙을 대체하지 않습니다.

`analysis-v4/`는 구버전 분석, `assets/`는 참고 자산, `chats/`·`conversations/`는 대화 이력입니다. 현재 코드와 스키마의 원본은 LLM Reference의 소스 위치에서 확인합니다. 이력 파일은 요청 없이 변경하지 않습니다.
