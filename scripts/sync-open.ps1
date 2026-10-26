# ==============================================================================
# scripts/sync-open.ps1
#
# renewsejongpac-open (공개 스냅샷 저장소) 무이력 단일 "Initial" 커밋 동기화 스크립트
#
# 원리:
#   현재 HEAD의 Git Tree 해시를 추출하여, 부모 커밋(-p)이 전혀 없는
#   새로운 Orphan 커밋 객체("Initial")를 생성한 뒤,
#   open 원격 저장소(hslcrb/renewsejongpac-open)의 main 브랜치로 강제 푸시합니다.
#   이를 통해 원본의 작업 이력(커밋 히스토리)은 1건도 전송되지 않고
#   오직 단 하나의 "Initial" 커밋으로 최신 전체 소스 스냅샷이 유지됩니다.
# ==============================================================================

[CmdletBinding()]
param(
    [string]$RemoteName = "open",
    [string]$TargetBranch = "main"
)

$ErrorActionPreference = "Stop"

# 1. open 원격 저장소 존재 여부 확인
$remotes = git remote
if ($remotes -notcontains $RemoteName) {
    Write-Host "[INFO] '$RemoteName' 원격을 추가합니다: https://github.com/hslcrb/renewsejongpac-open.git" -ForegroundColor Cyan
    git remote add $RemoteName https://github.com/hslcrb/renewsejongpac-open.git
}

# 2. 현재 작업 트리 해시 추출
$tree = (git rev-parse "HEAD^{tree}").Trim()
if (-not $tree) {
    Write-Error "Git 트리를 추출하지 못했습니다."
    exit 1
}

Write-Host "-> 현재 소스 트리: $tree" -ForegroundColor Gray

# 3. 부모 없는(Orphan) 무이력 단일 'Initial' 커밋 생성
$commit = (git commit-tree $tree -m "Initial").Trim()
if (-not $commit) {
    Write-Error "Initial 커밋 객체를 생성하지 못했습니다."
    exit 1
}

Write-Host "-> 무이력 Initial 커밋: $commit" -ForegroundColor Yellow

# 4. open 저장소의 main 브랜치로 강제 푸시
Write-Host "-> '$RemoteName' 저장소($TargetBranch 브랜치)로 무이력 스냅샷 푸시 시작..." -ForegroundColor Cyan
git push $RemoteName "${commit}:refs/heads/${TargetBranch}" --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] renewsejongpac-open에 모든 이력 없이 온전히 'Initial' 커밋 1건으로 동기화 완료되었습니다!" -ForegroundColor Green
} else {
    Write-Error "푸시 실패 (종료 코드: $LASTEXITCODE)"
}
