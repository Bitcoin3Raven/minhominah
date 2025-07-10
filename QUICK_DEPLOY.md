# 🚀 Vercel 빠른 배포 가이드

## 1️⃣ PowerShell에서 실행 (Windows)
```powershell
# PowerShell을 관리자 권한으로 실행
cd C:\Users\thaih\Documents\minhominah
.\deploy-to-vercel.ps1
```

## 2️⃣ 또는 수동으로 실행
```bash
# Git Bash 또는 터미널에서
cd C:\Users\thaih\Documents\minhominah
git add .
git commit -m "민호민아 성장앨범 업데이트"
git push origin main
```

## 3️⃣ Vercel에서 배포
1. https://vercel.com 접속
2. GitHub로 로그인
3. "New Project" → GitHub 리포지토리 선택
4. "Deploy" 클릭

## ✅ 배포 완료!
- 배포 URL: https://minhominah.vercel.app
- 커스텀 도메인: minhominah.com (추가 설정 필요)

## 📝 주의사항
- Supabase URL과 Anon Key는 js/supabase.js에 하드코딩됨
- 이는 정적 사이트에서는 정상적인 방법 (Anon Key는 공개용)
- 민감한 정보는 절대 코드에 포함하지 마세요

## 🔄 업데이트 방법
```bash
# 코드 수정 후
git add .
git commit -m "업데이트 내용"
git push
# Vercel이 자동으로 재배포
```
