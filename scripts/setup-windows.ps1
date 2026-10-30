# 새 Windows PC(개인 노트북)에 작업 환경 한 번에 세팅
#   실행: PowerShell에서
#   powershell -ExecutionPolicy Bypass -File setup-windows.ps1
#
# 1) Git · Node.js LTS · GitHub CLI 설치 (winget, 이미 있으면 건너뜀)
# 2) GitHub 로그인 (브라우저 창에서 승인)
# 3) 바탕화면\컴바인 에 저장소 받기 + 패키지 설치
# git·gh는 진행 메시지를 stderr로 내보내므로 Stop 대신 종료 코드로 확인
$ErrorActionPreference = 'Continue'
$Repo = 'jeonjinu940-hash/spyder-baseball-combine'
$Target = Join-Path ([Environment]::GetFolderPath('Desktop')) '컴바인'

function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function RefreshPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

Write-Host "`n[1/3] 개발 도구 설치" -ForegroundColor Cyan
if (-not (Have winget)) { throw 'winget이 없습니다. Microsoft Store에서 "앱 설치 관리자"를 설치한 뒤 다시 실행하세요.' }
foreach ($pkg in @(
    @{ cmd = 'git'; id = 'Git.Git' },
    @{ cmd = 'node'; id = 'OpenJS.NodeJS.LTS' },
    @{ cmd = 'gh'; id = 'GitHub.cli' })) {
  if (Have $pkg.cmd) { Write-Host "  - $($pkg.cmd) 이미 설치됨" }
  else {
    Write-Host "  - $($pkg.id) 설치 중..."
    winget install --id $pkg.id -e --silent --accept-package-agreements --accept-source-agreements | Out-Null
    RefreshPath
  }
}
git --version; node -v; gh --version | Select-Object -First 1

Write-Host "`n[2/3] GitHub 로그인" -ForegroundColor Cyan
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host '  브라우저가 열리면 화면의 코드를 입력하고 승인하세요.'
  gh auth login --hostname github.com --git-protocol https --web --scopes 'repo,workflow'
}
gh auth setup-git

Write-Host "`n[3/3] 프로젝트 받기" -ForegroundColor Cyan
if (Test-Path (Join-Path $Target '.git')) {
  Write-Host "  이미 있음 → 최신으로 업데이트: $Target"
  git -C $Target pull --ff-only
} else {
  if (Test-Path $Target) { throw "$Target 폴더가 이미 있습니다(저장소 아님). 이름을 바꾸거나 옮긴 뒤 다시 실행하세요." }
  gh repo clone $Repo $Target
  if ($LASTEXITCODE -ne 0) { throw '저장소를 받지 못했습니다. GitHub 로그인 계정을 확인하세요.' }
}
Set-Location $Target
$name = gh api user --jq '.login'
git config user.name $name
git config user.email "$name@users.noreply.github.com"
git config core.quotepath false
npm install --no-fund --no-audit
npm run build

Write-Host "`n완료! Antigravity에서 [File > Open Folder] → $Target 를 여세요." -ForegroundColor Green
Write-Host '운영 엑셀과 현장 갤러리 원본 폴더는 저장소에 없으니 USB/드라이브로 이 폴더에 복사하세요.'
