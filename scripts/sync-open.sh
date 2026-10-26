#!/usr/bin/env bash
# ==============================================================================
# scripts/sync-open.sh
#
# renewsejongpac-open (공개 스냅샷 저장소) 무이력 단일 "Initial" 커밋 동기화 스크립트
# ==============================================================================
set -euo pipefail

REMOTE_NAME="${1:-open}"
TARGET_BRANCH="${2:-main}"

# 1. open 원격 저장소 확인
if ! git remote | grep -q "^${REMOTE_NAME}$"; then
  echo "[INFO] '${REMOTE_NAME}' 원격을 추가합니다: https://github.com/hslcrb/renewsejongpac-open.git"
  git remote add "${REMOTE_NAME}" https://github.com/hslcrb/renewsejongpac-open.git
fi

# 2. 현재 작업 트리 해시 추출
TREE=$(git rev-parse "HEAD^{tree}")
echo "-> 현재 소스 트리: ${TREE}"

# 3. 부모 없는(Orphan) 무이력 단일 'Initial' 커밋 생성
COMMIT=$(git commit-tree "${TREE}" -m "Initial")
echo "-> 무이력 Initial 커밋: ${COMMIT}"

# 4. open 저장소의 main 브랜치로 강제 푸시
echo "-> '${REMOTE_NAME}' 저장소(${TARGET_BRANCH} 브랜치)로 무이력 스냅샷 푸시 시작..."
git push "${REMOTE_NAME}" "${COMMIT}:refs/heads/${TARGET_BRANCH}" --force

echo "[SUCCESS] renewsejongpac-open에 모든 이력 없이 온전히 'Initial' 커밋 1건으로 동기화 완료!"
