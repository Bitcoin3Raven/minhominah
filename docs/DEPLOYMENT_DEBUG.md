# 배포 디버깅 가이드

## 문제 상황 (2025-01-23)
www.minhominah.com에서 404 에러 발생

### 에러 메시지
```
Failed to load resource: the server responded with a status of 404
- assets/index-B6TDmNP7.js
- assets/GrowthPage-K9WjrXgE.js
```

### 원인 분석
1. **파일 불일치**
   - 웹사이트가 참조하는 파일: `index-B6TDmNP7.js`
   - 로컬 빌드 파일: `index-B6veEBfE.js`
   - Vercel 빌드와 로컬 빌드가 다른 해시 생성

2. **캐시 문제**
   - Service Worker가 이전 버전 캐싱
   - CDN 캐시가 이전 버전 유지

## 해결 방법

### 1. Service Worker 캐시 무효화 ✅
```javascript
// public/sw.js
const CACHE_VERSION = 'v2-2025-01-23'; // v1에서 업데이트
```

### 2. Vercel 재배포 (필요)
```bash
# Vercel CLI 사용
vercel --prod --force

# 또는 Vercel 대시보드에서:
# 1. Settings → Functions → Clear Cache
# 2. Deployments → Redeploy
```

### 3. 브라우저 캐시 삭제
- Chrome DevTools → Application → Storage → Clear site data
- 또는 강제 새로고침: Ctrl+Shift+R

## 예방 조치

### 1. 빌드 일관성
```json
// package.json
{
  "scripts": {
    "build": "tsc && vite build",
    "deploy": "npm run build && vercel --prod"
  }
}
```

### 2. 캐시 버스팅
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  }
});
```

### 3. Service Worker 업데이트 전략
```javascript
// 자동 업데이트 확인
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
```

## 모니터링
1. Vercel Dashboard → Functions → Logs
2. Chrome DevTools → Network → 404 에러 확인
3. Service Worker 상태: chrome://serviceworker-internals/

## 체크리스트
- [ ] Service Worker 버전 업데이트
- [ ] 로컬 빌드 실행
- [ ] Vercel 캐시 삭제
- [ ] Vercel 재배포
- [ ] 배포 후 404 에러 확인
- [ ] Service Worker 업데이트 확인
