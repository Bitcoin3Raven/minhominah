# 민호민아 사이트 배포 문제 해결 가이드

## 🚨 현재 문제
www.minhominah.com에서 JavaScript 파일 404 에러 발생

## 📋 즉시 해결 방법

### 방법 1: Vercel 대시보드에서 재배포
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. `minhominah` 프로젝트 선택
3. `Settings` → `Functions` → `Clear Cache` 클릭
4. `Deployments` 탭으로 이동
5. 최신 배포의 `...` 메뉴 → `Redeploy` 클릭
6. `Use existing Build Cache` 체크 해제 ❗
7. `Redeploy` 버튼 클릭

### 방법 2: Git Push로 강제 재배포
```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "Force redeploy to fix 404 errors"
git push origin main
```

### 방법 3: Vercel CLI 사용 (설치 필요)
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 폴더에서 실행
cd C:\Users\thaih\Documents\minhominah
vercel --prod --force
```

## 🔍 확인 사항

### 1. 배포 상태 확인
- Vercel Dashboard → Deployments에서 빌드 로그 확인
- 빌드 성공 여부 확인
- 생성된 파일 목록 확인

### 2. 브라우저 캐시 삭제
- Chrome: `Ctrl + Shift + R` (강제 새로고침)
- 또는 DevTools → Application → Storage → Clear site data

### 3. Service Worker 확인
- Chrome DevTools → Application → Service Workers
- `Unregister` 클릭 후 페이지 새로고침

## 📝 문제 원인 분석
1. **해시 불일치**: 로컬 빌드와 Vercel 빌드의 파일 해시가 다름
2. **캐시 문제**: CDN이나 Service Worker가 이전 버전 캐싱
3. **빌드 환경 차이**: 로컬과 Vercel의 Node.js 버전 차이

## 🛡️ 향후 예방책
1. `vercel.json`에 캐시 설정 추가
2. Service Worker 버전 관리 자동화
3. 배포 전 로컬 빌드 테스트

## 💡 추가 도움
문제가 지속되면:
1. Vercel Support 문의
2. 프로젝트 재연결 (Vercel Dashboard에서 프로젝트 삭제 후 재생성)
3. DNS 캐시 확인 (도메인 제공업체)
