# 민호민아 성장앨범 배포 가이드

## 📚 목차
1. [GitHub 저장소 생성 및 연동](#1-github-저장소-생성-및-연동)
2. [Vercel 배포](#2-vercel-배포)
3. [커스텀 도메인 연결](#3-커스텀-도메인-연결)
4. [환경변수 설정](#4-환경변수-설정)
5. [자동 배포 설정](#5-자동-배포-설정)

## 1. GitHub 저장소 생성 및 연동

### 1.1 GitHub 저장소 생성
1. [GitHub](https://github.com) 로그인
2. 우측 상단 "+" 버튼 → "New repository" 클릭
3. Repository 설정:
   - Repository name: `minhominah`
   - Description: `민호와 민아의 성장 앨범`
   - Public/Private 선택 (Vercel 무료 플랜은 Public만 지원)
   - "Create repository" 클릭

### 1.2 로컬 저장소와 연동
```bash
# 현재 폴더: C:\Users\thaih\Documents\minhominah

# 원격 저장소 추가 (GitHub 주소는 생성된 저장소의 주소로 변경)
git remote add origin https://github.com/yourusername/minhominah.git

# 브랜치 이름을 main으로 변경 (GitHub 기본값)
git branch -M main

# 첫 번째 푸시
git push -u origin main
```

### 1.3 GitHub 인증
- Username: GitHub 사용자명
- Password: Personal Access Token (PAT) 사용
  - GitHub Settings → Developer settings → Personal access tokens
  - Generate new token → repo 권한 체크

## 2. Vercel 배포

### 2.1 Vercel 계정 생성
1. [Vercel](https://vercel.com) 접속
2. "Sign Up" → GitHub 계정으로 가입 (권장)
3. 이메일 인증 완료

### 2.2 프로젝트 Import
1. Vercel 대시보드에서 "New Project" 클릭
2. "Import Git Repository" 선택
3. GitHub 저장소 목록에서 `minhominah` 선택
4. "Import" 클릭

### 2.3 프로젝트 설정
- **Framework Preset**: Other (정적 사이트)
- **Root Directory**: `./` (기본값)
- **Build Command**: 비워둠 (정적 사이트이므로)
- **Output Directory**: `./` (기본값)
- **Install Command**: `npm install`

### 2.4 환경변수 설정
Environment Variables 섹션에서 추가:
```
NEXT_PUBLIC_SUPABASE_URL = your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
```

### 2.5 배포
1. "Deploy" 버튼 클릭
2. 약 1-2분 후 배포 완료
3. 생성된 URL 확인: `https://minhominah.vercel.app`

## 3. 커스텀 도메인 연결

### 3.1 도메인 준비
- 도메인 등록업체에서 `minhominah.com` 구매
- 권장 업체: Namecheap, GoDaddy, Gabia 등

### 3.2 Vercel에서 도메인 추가
1. 프로젝트 대시보드 → Settings → Domains
2. "Add" 버튼 클릭
3. `minhominah.com` 입력
4. "Add" 클릭

### 3.3 DNS 설정
도메인 등록업체의 DNS 관리에서:

**A 레코드 (권장)**
```
Type: A
Name: @
Value: 76.76.21.21
```

**또는 CNAME 레코드**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3.4 SSL 인증서
- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 보통 10-30분 내 활성화

## 4. 환경변수 설정

### 4.1 Supabase 정보 확인
1. [Supabase Dashboard](https://app.supabase.com) 로그인
2. 프로젝트 선택
3. Settings → API
4. 다음 정보 복사:
   - Project URL
   - anon public key

### 4.2 Vercel 환경변수 추가
1. Vercel 프로젝트 → Settings → Environment Variables
2. 추가할 변수:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
3. "Save" 클릭

### 4.3 로컬 개발 환경
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 5. 자동 배포 설정

### 5.1 Git Push 자동 배포
- main 브랜치에 push하면 자동으로 배포
- Preview 배포: 다른 브랜치 push 시

### 5.2 배포 상태 확인
1. Vercel 대시보드에서 실시간 로그 확인
2. GitHub에 배포 상태 표시
3. 배포 실패 시 이메일 알림

### 5.3 롤백
- Vercel 대시보드 → Deployments
- 이전 배포 선택 → "..." → "Promote to Production"

## 📝 체크리스트

- [ ] Git 저장소 초기화 완료
- [ ] GitHub 저장소 생성
- [ ] 로컬과 GitHub 연동
- [ ] Vercel 계정 생성
- [ ] 프로젝트 Import
- [ ] 환경변수 설정
- [ ] 첫 배포 성공
- [ ] 커스텀 도메인 연결 (선택)
- [ ] SSL 인증서 활성화 확인

## 🚨 문제 해결

### 배포 실패 시
1. Build 로그 확인
2. 환경변수 설정 확인
3. `vercel.json` 파일 검증

### 404 오류
1. 파일 경로 확인
2. `vercel.json` routes 설정 확인
3. index.html 존재 여부 확인

### 환경변수 인식 안 됨
1. 변수명이 `NEXT_PUBLIC_`로 시작하는지 확인
2. 재배포 시도
3. Vercel 대시보드에서 수동 재배포

## 📞 추가 지원
- [Vercel 문서](https://vercel.com/docs)
- [Vercel 커뮤니티](https://github.com/vercel/vercel/discussions)
- [Supabase 문서](https://supabase.com/docs)
