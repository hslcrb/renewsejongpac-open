# renewsejongpac-open 무이력(Orphan) 공개 스냅샷 저장소 운영 가이드

- **저장소 주소**: [https://github.com/hslcrb/renewsejongpac-open](https://github.com/hslcrb/renewsejongpac-open)
- **생성 일시**: 2026-10-26 (KST)
- **운영 정책**: **무이력(Orphan) 단일 `Initial` 커밋 유지 원칙**

---

## 1. 개요 및 목적

세종문화회관 리뉴얼 프로젝트의 전체 소스 트리를 외부에 공개(Open)하되, 개발 과정에서 발생한 수많은 작업 브랜치, 커밋 이력, 중간 시도 내역 등을 일절 노출하지 않고 **단 하나의 온전한 `Initial` 커밋**으로만 소스 트리를 배포·제공하기 위해 신설된 공식 공개 스냅샷 저장소입니다.

---

## 2. 왜 일반 `pushurl`로 동기화하지 않는가?

로컬의 `remote.origin.pushurl`에 `renewsejongpac-open`을 등록하면 일반 `git push`를 할 때마다 수백 개의 원본 커밋 히스토리가 그대로 푸시되어 "모든 커밋 이력 없이 온전히 Initial 이렇게만 커밋 되어야 한다"는 요구사항이 깨지게 됩니다.

따라서 다음과 같은 구조로 격리 운영합니다:
1. `origin`: 메인 소스 저장소 (`hslcrb/renewsejongpac`)
2. `archive`: 비공개 백업 미러 (`hslcrb/renewsejongpac-archivemirrorserver.git`)
3. `open`: 무이력 단일 `Initial` 공개 스냅샷 (`hslcrb/renewsejongpac-open.git`)

---

## 3. 무이력 단일 커밋 생성 원리 (`git commit-tree`)

Git의 로우 레벨 플러밍(Plumbing) 명령어인 `git commit-tree`를 사용하여 작업 트리를 오염시키지 않고 즉석에서 부모 없는 커밋을 만듭니다:

```powershell
# 1. 현재 HEAD의 트리 해시를 추출
$tree = git rev-parse "HEAD^{tree}"

# 2. 부모 커밋(-p) 플래그를 생략하여 루트(Orphan) 커밋 생성
$commit = git commit-tree $tree -m "Initial"

# 3. open 저장소의 main 브랜치로 강제 푸시 (이전 이력 완전 대체)
git push open "${commit}:refs/heads/main" --force
```

- **결과**: `renewsejongpac-open`의 커밋 총 개수는 항상 **1개**(`git rev-list --count main` -> `1`)로 유지되며, 커밋 메시지는 오직 **`Initial`**만 표시됩니다.

---

## 4. 동기화 실행 방법

최신 변경사항을 `renewsejongpac-open`에 반영하고 싶을 때 언제든 아래 스크립트를 실행합니다:

### Windows PowerShell
```powershell
.\scripts\sync-open.ps1
```

### Linux / macOS / Git Bash
```bash
bash scripts/sync-open.sh
```

---

## 5. 검증 상태 (2026-10-26)

- GitHub 저장소 생성 완료: `gh repo view hslcrb/renewsejongpac-open` 확인
- 커밋 수 검증:
  ```text
  $ git rev-list --count 1cf7d5c0
  1
  $ git log --oneline 1cf7d5c0
  1cf7d5c0 Initial
  ```
- 소스 코드 무결성: 현재 최신 `main` 브랜치의 모든 소스 파일이 누락 없이 100% 동기화됨.
