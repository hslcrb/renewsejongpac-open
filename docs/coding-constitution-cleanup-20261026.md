# 코딩헌법규정 배포 사후 정리 대장 (2026-10-26)

## 확인 결과

- 최초 목표: 개인 소유 비공개 저장소 399개. 실제 병합 확인: 10개. **미완료: 389개.** 이 중 archived는 최소 1개로 분류됨.
- [원본 헌법](../CODING_CONSTITUTION.md), [적용 원장](coding-constitution-private-inventory-20261026.json), [기존 브랜치 통합 사건 기록](branch-consolidation-20261026.md)은 각각 목적이 다르며, 어느 것도 원격 상태를 영구 보증하지 않는다.
- 이 작업 중 renewsejongpac의 헌법 관련 작업 브랜치가 원격에 남아 있지 않은 것은 브랜치 조회로 확인했다.
- 아래 **9개**의 타 저장소에 헌법 관련 브랜치 **14개**가 남아 있다. 해당 브랜치가 PR에서 병합되었다는 사실과, 현재 시점 정확한 head SHA가 main/master의 조상인지 여부는 구별한다.
- 현재 ChatGPT GitHub 연결은 `delete_ref`를 제공하지 않아 삭제하지 않았다. `update_ref`·강제 푸시로 대신하지 않는다.

## 남은 브랜치

| 저장소 | 기본 브랜치 | 남아 있는 헌법 작업 브랜치 |
| --- | --- | --- |
| `hslcrb/1` | `main` | `chatgpt/20261026-coding-constitution-adoption`, `chatgpt/20261026-constitution-reference-fix` |
| `hslcrb/AgentMerry` | `main` | `chatgpt/20261026-coding-constitution-adoption`, `chatgpt/20261026-constitution-reference-fix` |
| `hslcrb/AILeague2026app` | `master` | `codex-gpt6astraultra/20261026-coding-constitution-adoption`, `codex-gpt6astraultra/20261026-constitution-reference-fix` |
| `hslcrb/airplaneshoot` | `main` | `chatgpt/20261026-coding-constitution-adoption`, `chatgpt/20261026-constitution-reference-fix` |
| `hslcrb/ALL-API-KEYS` | `main` | `chatgpt/20261026-coding-constitution-adoption`, `chatgpt/20261026-constitution-reference-fix` |
| `hslcrb/Onement-animater` | `main` | `chatgpt/20261026-coding-constitution-adoption` |
| `hslcrb/Anipixel` | `master` | `chatgpt/20261026-coding-constitution-adoption` |
| `hslcrb/breezes` | `master` | `chatgpt/20261026-coding-constitution-adoption` |
| `hslcrb/rheehoseTechportpolio_nextjs` | `main` | `docs/20261026-coding-constitution-adoption` |

## 삭제 전 안전 조건 (사용자 환경의 GH CLI 또는 API)

1. 실제 원격 기본 브랜치와 작업 브랜치 head SHA를 조회한다. 해당 브랜치의 관련 PR가 `merged=true`인지 확인한다.
2. `GET /repos/{owner}/{repo}/compare/{branch}...{default}`로 **branch의 모든 커밋이 기본 브랜치에 포함되는지** 검증한다(`behind_by=0`일 때 branch 쪽에 미반영된 커밋이 없음을 뜻함). 이 표현은 API에서 `base=branch`, `head=default` 순서로 사용한다.
3. 포함 확인 + 미진행 작업 없음 + 다른 에이전트 소유가 아님을 검토한 뒤 정확히 해당 ref만 삭제한다. `--force` 및 공유 브랜치 reset은 사용하지 않는다.
4. GitHub API 호출 시 URL의 슬래시·브랜치 경로가 올바르게 인코딩됐는지 확인한다. 개인 토큰을 로깅하거나 저장소에 커밋하지 않는다.

### 단일 브랜치 삭제 예시 (충분한 권한과 병합 검증 후)

```bash
# 예시일 뿐: 반드시 해당 branch가 기본 브랜치에 완전히 포함되었는지 먼저 확인
# gh api 'repos/OWNER/REPO/compare/BRANCH...main'
# gh api --method DELETE 'repos/OWNER/REPO/git/refs/heads/BRANCH'
```

## 아직 완료되지 않은 부분

- 389개 비공개 저장소 자동 배포·강제 정책 일괄 적용: 미완료. 기존 프로젝트 브랜치/AGENTS/CI 정책 검사와 충분한 API 실행 권한이 필요하다.
- 독립 `hslcrb/coding-constitution` 저장소 생성: 연결된 GitHub 도구에 repository-create API가 없어 미실행. 독립 저장소용 스캐폴드는 별도 로컬 ZIP으로 작성됨.
- GitHub Branch Protection/Ruleset 관리자 설정: 미실행.
- 실제 각 저장소의 CI 통과/미러 동기화/배포 성공: 이번 문서 추가만으로 보장하지 않는다.

이 문서는 진행을 완료한 것으로 포장하지 않고, 실제로 남은 운영 작업을 재현 가능한 상태로 남기기 위한 기록이다.
