# 민호민아닷컴 Vercel 배포 스크립트
# Windows PowerShell 또는 Git Bash에서 실행

Write-Host "🚀 민호민아닷컴 Vercel 배포 시작..." -ForegroundColor Green

# Git 초기화 확인
if (!(Test-Path .git)) {
    Write-Host "📁 Git 초기화 중..." -ForegroundColor Yellow
    git init
}

# Git 상태 확인
Write-Host "📋 Git 상태 확인 중..." -ForegroundColor Yellow
git status

# 파일 추가
Write-Host "➕ 파일 추가 중..." -ForegroundColor Yellow
git add .

# 커밋
$commitMessage = Read-Host "커밋 메시지를 입력하세요 (기본값: Update 민호민아 성장앨범)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update 민호민아 성장앨범"
}
git commit -m $commitMessage

# GitHub 리모트 확인
$remoteUrl = git remote get-url origin 2>$null
if ($?) {
    Write-Host "✅ GitHub 리포지토리 연결됨: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "❌ GitHub 리포지토리가 연결되지 않았습니다." -ForegroundColor Red
    $githubUsername = Read-Host "GitHub 사용자명을 입력하세요"
    $repoName = Read-Host "리포지토리 이름을 입력하세요 (기본값: minhominah)"
    if ([string]::IsNullOrWhiteSpace($repoName)) {
        $repoName = "minhominah"
    }
    git remote add origin "https://github.com/$githubUsername/$repoName.git"
}

# 푸시
Write-Host "🔄 GitHub에 푸시 중..." -ForegroundColor Yellow
git push -u origin main

if ($?) {
    Write-Host "✅ GitHub 푸시 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📌 다음 단계:" -ForegroundColor Cyan
    Write-Host "1. https://vercel.com 접속" -ForegroundColor White
    Write-Host "2. GitHub 계정으로 로그인" -ForegroundColor White
    Write-Host "3. 'New Project' 클릭" -ForegroundColor White
    Write-Host "4. 'minhominah' 리포지토리 선택" -ForegroundColor White
    Write-Host "5. 'Deploy' 클릭" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 배포가 완료되면 https://minhominah.vercel.app 에서 확인할 수 있습니다!" -ForegroundColor Green
} else {
    Write-Host "❌ GitHub 푸시 실패. 위의 오류를 확인하세요." -ForegroundColor Red
}
