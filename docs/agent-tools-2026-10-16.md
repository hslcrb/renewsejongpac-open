# 에이전트 도구 설정 · 2026.10.16

사용자 요청에 따라 `.codex/chats/`의 대화 기록과 프로젝트 스킬을 읽고 아래 도구를 설치했다.

- Node.js `24.19.0`: 요구 조건 20 이상 충족.
- 전역 npm `kordoc@4.22.0`, `rea-agents@6.5.0` 설치.
- Codex MCP `kordoc`, `rea` 활성화 설정. 기존 설정 백업: `C:/Users/hi/.codex/backups/agent-tools-20261016-114017`.
- stdio 초기화 검증: kordoc 17개 도구, REA 207개 도구 목록 확인. REA binary session 및 kordoc 한국어 DOCX 파싱 확인.
- 선택 의존성 포함 설치. onnxruntime-node와 frida 네이티브 모듈 로드 확인.
- `C:/Users/hi/.agents/skills/`에 `lemonade`, `noslopui-one`, `sejongpac-renewmakes`를 프로젝트 `skills/` 원본으로 연결하는 junction 등록.

프로젝트 원본 스킬을 갱신하면 등록 경로에서도 같은 내용을 읽는다. npm 도구는 전역 설치이고 웹앱에 새 런타임 의존성을 추가하지 않았다. 새로운 MCP 설정을 에이전트 도구 목록에 반영하려면 Codex를 다시 시작한다.

검증에는 로컬 문서와 테스트 바이너리를 사용했다. 외부 계정에 메시지를 보내거나 실제 문서를 전송하지 않았다.
