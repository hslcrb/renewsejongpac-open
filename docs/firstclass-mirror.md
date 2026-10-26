# firstclass 중복 미러 철회 기록 (2026-10-26)

> **운영 상태: 중단 · 보관용 문서.** 이 문서는 새 동기화 시스템의 설치 가이드가 아닙니다.

## 결정과 배경

- 원본 프로젝트: [hslcrb/renewsejongpac](https://github.com/hslcrb/renewsejongpac). 원본 코드·Git 커밋 이력·기존 개발 절차는 유지합니다.
- 별도로 제안·구현했던 `firstclass/renewsejongpac/` 부분 사본은 완전한 코드 미러가 아니었고, 사용자가 이미 운영하고 있다고 알린 공개 미러와 기능이 중복됩니다.
- 따라서 **firstclass로 자동 복사하는 새 시스템을 철회**하고, firstclass에 놓였던 부분 사본은 제거했습니다. 이전 커밋을 통해 복원할 수 있도록 `archive/*.txt`에 근거를 남겼습니다.
- 사용자가 운영 중이라고 알린 **기존 공개 미러의 실제 주소, 실행 방식, 정상 운영 여부는 여기서 확인하지 못했으며 변경하지 않았습니다.** 현재 README에는 별개의 *원본+비공개 보관 미러*를 위한 소유자 로컬 `origin` 복수 push URL 정책도 문서화되어 있습니다. 두 미러가 같은 시스템이라고 추정하지 않습니다.

## 변경 사항

| 항목 | 처리 |
| --- | --- |
| `scripts/install-firstclass-hook.sh` | 삭제 — 중복 post-commit 훅 설치기 폐기 |
| `scripts/sync-firstclass.sh` | 삭제 — firstclass 하위 폴더로 별도 스냅샷 생성·푸시 중지 |
| `.githooks/post-commit` | 삭제 — 중복 firstclass 미러 전송만을 위한 훅 원본 폐기 |
| `docs/firstclass-mirror.md` | 이전 실행 가이드를 이 폐기·보관 문서로 교체 |
| `firstclass/renewsejongpac/` | [firstclass PR #5](https://github.com/hslcrb/firstclass/pull/5)에서 제거 |
| `firstclass/archive/renewsejongpac-duplicate-snapshot-20261026.txt` | 역사 기록과 Git SHA·복구 방법 보존 |

**유지한 것:** 원본 v5 앱, Deep Chat 기반 검색 관련 구현, `plugins/swiper/`, `plugins/aos/`, 기존 정적 에셋, 모든 기존 Git 이력 및 원본의 다른 스크립트. 기존 `.github/workflows/`의 무관한 워크플로는 수정하지 않았으며 firstclass 동기화를 위한 신규 CI도 만들지 않았습니다.

## 기존 시스템과 구별

이번에 철회한 것은 `firstclass`에 원본을 추가로 복제하기 위해 만든 **스크립트 + 로컬 훅 + 대상 스냅샷** 조합입니다. 기존 미러가 어떻게 운영되는지는 사용자에게서 별도 시스템이 이미 있다는 사실만 전달받았습니다. 접근 권한이 없는 로컬 Git의 `remote` URL이나 훅 설치 상태를 확인했다고 주장하지 않습니다.

Git 원격의 `push`는 브랜치와 커밋을 전송하므로 특정 저장소의 하위 디렉터리만 직접 대상으로 할 수 없습니다. 그 기능을 흉내 내기 위한 이중 스크립트가 더 이상 필요하지 않다는 것이 현재 운영 결정입니다.

## 로컬 PC에 이미 설치했을 경우 — 선택적 잔여 설정 해제

원격 저장소의 파일을 지워도 각 PC에 수동으로 설치된 `.git/hooks/post-commit`과 로컬 Git 설정은 자동으로 삭제되지 않습니다. 설치 여부는 **현재 확인하지 못했습니다.** 실제 설치했던 PC에서 아래 내용을 확인하세요.

```bash
git config --local --get firstclass.mirror.enabled
git config --local --get core.hooksPath
git rev-parse --git-path hooks
```

중복 미러를 사용하기 위해 직접 활성화했을 때에만 다음으로 설정을 해제할 수 있습니다.

```bash
git config --local --unset-all firstclass.mirror.enabled
```

`post-commit` 훅은 **내용을 직접 확인한 뒤** 이번 미러 전용 파일인 경우에만 제거합니다. 다른 동작과 결합된 훅이라면 파일 전체를 삭제하지 말고 `sync-firstclass.sh` 호출 부분만 제거하세요. 기존 개인 훅을 덮어쓰거나 임의로 삭제하지 마세요.

## Git 복원 지점과 검증

- 원본 철회 전 커밋: [`923c28fcfca580405be33ba739c5c586adfbae80`](https://github.com/hslcrb/renewsejongpac/commit/923c28fcfca580405be33ba739c5c586adfbae80)
- firstclass 부분 사본 철회 전 커밋: [`bb17b99df7745870819159410d186e956ae75954`](https://github.com/hslcrb/firstclass/commit/bb17b99df7745870819159410d186e956ae75954)
- firstclass 정리 병합 커밋: [`ca5db9a1975152e6eeacae6663a8c337e63355bf`](https://github.com/hslcrb/firstclass/commit/ca5db9a1975152e6eeacae6663a8c337e63355bf)
- [firstclass archive 기록](https://github.com/hslcrb/firstclass/blob/main/archive/renewsejongpac-duplicate-snapshot-20261026.txt)에서 삭제 전 파일과 복원 경로를 찾을 수 있습니다.

기존 파일 열람 예시 (복원·재설치는 요청되지 않았음):

```bash
git show 923c28fcfca580405be33ba739c5c586adfbae80:scripts/sync-firstclass.sh
git show 923c28fcfca580405be33ba739c5c586adfbae80:.githooks/post-commit
```

**검증 범위:** GitHub에서 작업 브랜치의 변경 경로, firstclass `main`의 폴더 제거, archive 파일의 존재를 대조했습니다. firstclass PR #5의 Vercel 상태는 빌드 횟수 제한으로 실패였으며, 실행 배포 검증이 완료됐다는 의미는 아닙니다. 실제 개발 PC 설정이나 사용자가 운영 중인 다른 공개 미러는 변경·검증하지 않았습니다.
