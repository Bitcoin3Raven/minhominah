#!/bin/bash

# 민호민아닷컴 Vercel 배포 스크립트
# Mac/Linux용

echo "🚀 민호민아닷컴 Vercel 배포 시작..."

# Git 초기화 확인
if [ ! -d .git ]; then
    echo "📁 Git 초기화 중..."
    git init
fi

# Git 상태 확인
echo "📋 Git 상태 확인 중..."
git status

# 파일 추가
echo "➕ 파일 추가 중..."
git add .

# 커밋
echo -n "커밋 메시지를 입력하세요 (기본값: Update 민호민아 성장앨범): "
read commitMessage
if [ -z "$commitMessage" ]; then
    commitMessage="Update 민호민아 성장앨범"
fi
git commit -m "$commitMessage"

# GitHub 리모트 확인
if git remote get-url origin &>/dev/null; then
    echo "✅ GitHub 리포지토리 연결됨: $(git remote get-url origin)"
else
    echo "❌ GitHub 리포지토리가 연결되지 않았습니다."
    echo -n "GitHub 사용자명을 입력하세요: "
    read githubUsername
    echo -n "리포지토리 이름을 입력하세요 (기본값: minhominah): "
    read repoName
    if [ -z "$repoName" ]; then
        repoName="minhominah"
    fi
    git remote add origin "https://github.com/$githubUsername/$repoName.git"
fi

# 푸시
echo "🔄 GitHub에 푸시 중..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ GitHub 푸시 완료!"
    echo ""
    echo "📌 다음 단계:"
    echo "1. https://vercel.com 접속"
    echo "2. GitHub 계정으로 로그인"
    echo "3. 'New Project' 클릭"
    echo "4. 'minhominah' 리포지토리 선택"
    echo "5. 'Deploy' 클릭"
    echo ""
    echo "🎉 배포가 완료되면 https://minhominah.vercel.app 에서 확인할 수 있습니다!"
else
    echo "❌ GitHub 푸시 실패. 위의 오류를 확인하세요."
fi
