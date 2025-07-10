# Vercel 배포 가이드 - 민호민아닷컴

## 🚀 빠른 배포 (3단계)

### 1. GitHub에 코드 업로드
```bash
# Git 초기화 (이미 되어있으면 스킵)
git init

# 파일 추가
git add .

# 커밋
git commit -m "민호민아 성장앨범 프로젝트"

# GitHub 리포지토리 연결
git remote add origin https://github.com/[your-username]/minhominah.git

# 푸시
git push -u origin main
```

### 2. Vercel 계정 설정
1. [Vercel 웹사이트](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

### 3. 프로젝트 배포
1. GitHub 리포지토리 선택 (minhominah)
2. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
3. "Deploy" 클릭

## 📝 상세 배포 가이드

### 1단계: 로컬 환경 준비

#### 1.1 환경 변수 확인
```bash
# .env 파일이 없다면 생성
cp .env.example .env

# .env 파일 편집하여 Supabase 정보 입력
# NEXT_PUBLIC_SUPABASE_URL=https://illwscrdeyncckltjrmr.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 1.2 .gitignore 확인
`.env` 파일이 `.gitignore`에 포함되어 있는지 확인 (이미 포함됨 ✅)

### 2단계: GitHub 리포지토리 생성

#### 2.1 GitHub에서 새 리포지토리 생성
1. GitHub.com 로그인
2. "New repository" 클릭
3. Repository name: `minhominah`
4. Private 또는 Public 선택
5. "Create repository" 클릭

#### 2.2 로컬 프로젝트를 GitHub에 연결
```bash
# 현재 디렉토리: C:\Users\thaih\Documents\minhominah
cd C:\Users\thaih\Documents\minhominah

# Git 상태 확인
git status

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit: 민호민아 성장앨범"

# GitHub 리포지토리 연결
git remote add origin https://github.com/[your-username]/minhominah.git

# main 브랜치로 푸시
git push -u origin main
```

### 3단계: Vercel 설정

#### 3.1 Vercel 계정 생성/로그인
1. https://vercel.com 접속
2. "Sign Up" 또는 "Log In"
3. GitHub 계정으로 로그인 (권장)

#### 3.2 새 프로젝트 생성
1. Vercel 대시보드에서 "New Project" 클릭
2. "Import Git Repository" 선택
3. GitHub 연동 허용
4. `minhominah` 리포지토리 선택

#### 3.3 프로젝트 설정
```
Framework Preset: Other (정적 사이트)
Root Directory: ./ (그대로 두기)
Build Command: (비워두기 - 빌드 불필요)
Output Directory: ./ (그대로 두기)
Install Command: (비워두기)
```

#### 3.4 환경 변수 설정
"Environment Variables" 섹션에서:

| Name | Value |
|------|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://illwscrdeyncckltjrmr.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | [Supabase에서 복사한 Anon Key] |

> ⚠️ 주의: Supabase Dashboard > Settings > API에서 정확한 값 복사

#### 3.5 배포
1. "Deploy" 버튼 클릭
2. 배포 진행 상황 확인 (1-2분 소요)
3. 성공 시 URL 제공됨: `https://minhominah.vercel.app`

### 4단계: 커스텀 도메인 설정 (선택사항)

#### 4.1 도메인 추가
1. Vercel 프로젝트 대시보드 > Settings > Domains
2. "Add Domain" 클릭
3. `minhominah.com` 입력
4. "Add" 클릭

#### 4.2 DNS 설정
도메인 등록업체에서 DNS 설정:

**A 레코드 (도메인 루트용):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 레코드 (www용):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 4.3 SSL 인증서
- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 보통 10-30분 내 활성화

### 5단계: 배포 후 확인사항

#### 5.1 기능 테스트
- [ ] 홈페이지 정상 로딩
- [ ] Supabase 연결 확인
- [ ] 이미지/파일 로딩 확인
- [ ] 다국어 전환 작동
- [ ] 모바일 반응형 확인

#### 5.2 성능 최적화
Vercel 자동 최적화 기능:
- ✅ 자동 이미지 최적화
- ✅ 글로벌 CDN 배포
- ✅ Brotli 압축
- ✅ HTTP/2 지원

## 🔧 문제 해결

### 환경 변수가 작동하지 않을 때
1. Vercel 대시보드 > Settings > Environment Variables
2. 변수 이름이 정확한지 확인
3. "Redeploy" 클릭하여 재배포

### 404 에러가 발생할 때
`vercel.json`의 routes 설정 확인:
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 빌드 에러가 발생할 때
- Framework Preset을 "Other"로 설정했는지 확인
- Build Command를 비워두었는지 확인

## 📱 배포 후 관리

### 자동 배포 설정
- GitHub main 브랜치에 푸시하면 자동 재배포
- Pull Request 시 미리보기 배포 생성

### 배포 이력 확인
- Vercel 대시보드 > Deployments
- 각 배포의 로그와 상태 확인 가능

### 분석 도구
- Vercel Analytics로 방문자 통계 확인
- Web Vitals로 성능 모니터링

## 🎯 다음 단계

1. **모니터링 설정**
   - Vercel Analytics 활성화
   - 에러 추적 도구 연동 (Sentry 등)

2. **성능 개선**
   - 이미지 최적화
   - 코드 스플리팅
   - 캐싱 전략 수립

3. **보안 강화**
   - CSP(Content Security Policy) 헤더 설정
   - 환경 변수 정기 교체

## 💡 유용한 명령어

```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# CLI로 배포
vercel

# 프로덕션 배포
vercel --prod

# 환경 변수 확인
vercel env ls

# 로그 확인
vercel logs
```

## 📞 지원 및 문의

- Vercel 문서: https://vercel.com/docs
- Vercel 지원: https://vercel.com/support
- 커뮤니티: https://github.com/vercel/vercel/discussions

---

🎉 축하합니다! 민호민아닷컴이 이제 전 세계에서 접속 가능합니다!
