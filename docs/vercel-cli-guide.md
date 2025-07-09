# Vercel CLI를 통한 직접 배포 가이드

GitHub 없이 로컬 프로젝트를 Vercel에 직접 배포하는 방법입니다.

## 1. Vercel CLI 설치

```bash
# npm을 사용하는 경우
npm install -g vercel

# 또는 yarn을 사용하는 경우
yarn global add vercel
```

## 2. Vercel 로그인

```bash
vercel login
```
- 이메일 주소 입력
- 이메일로 받은 인증 링크 클릭
- Google 계정으로 가입했다면 Google 이메일 사용

## 3. 프로젝트 배포

프로젝트 폴더에서:
```bash
# C:\Users\thaih\Documents\minhominah 폴더에서
vercel
```

### 첫 배포 시 질문:
1. **Set up and deploy?** → Y
2. **Which scope?** → 개인 계정 선택
3. **Link to existing project?** → N (새 프로젝트)
4. **Project name?** → minhominah (또는 원하는 이름)
5. **Directory?** → ./ (현재 폴더)
6. **Override settings?** → N

## 4. 환경변수 설정

```bash
# Supabase URL 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Supabase Anon Key 설정
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 5. 재배포 (환경변수 적용)

```bash
vercel --prod
```

## 장점
- Git/GitHub 없이 바로 배포 가능
- 로컬 파일을 직접 업로드
- 간단하고 빠른 배포

## 단점
- 버전 관리 어려움
- 협업 불가능
- 자동 배포 설정 불가

## 추후 GitHub 연동
나중에 GitHub을 연동하고 싶다면:
1. Vercel 대시보드 → Settings → Git
2. "Connect Git Repository" 클릭
3. GitHub 계정 연동
