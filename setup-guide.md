# 민호민아 성장앨범 - Tailwind CSS & Kakao SDK 설정 가이드

## 1. Tailwind CSS 프로덕션 설정

### 필요한 작업:

1. **패키지 설치**
   ```bash
   npm install
   ```

2. **Tailwind CSS 빌드**
   ```bash
   npm run build-css
   ```

3. **HTML 파일 업데이트**
   ```bash
   node update-tailwind-links.js
   ```

4. **각 HTML 파일 수동 확인**
   모든 HTML 파일에서 다음 부분을 찾아서:
   ```html
   <!-- 이 부분을 찾아서 -->
   <script src="https://cdn.tailwindcss.com"></script>
   <script>
       tailwind.config = {
           darkMode: 'class',
           theme: {
               extend: {
                   colors: {
                       primary: '#FF6B6B',
                       secondary: '#4ECDC4'
                   }
               }
           }
       }
   </script>
   ```
   
   다음으로 교체:
   ```html
   <!-- 이렇게 교체 -->
   <link rel="stylesheet" href="css/tailwind.css">
   ```

## 2. Kakao SDK 설정

### 카카오 개발자 콘솔에서:

1. https://developers.kakao.com/ 접속
2. 앱 생성 후 JavaScript 키 복사
3. 플랫폼에 `https://www.minhominah.com` 추가

### 코드에서:

1. **js/kakao-config.js 파일 수정**
   ```javascript
   const KAKAO_JAVASCRIPT_KEY = '여기에_실제_키_입력';
   ```

2. **모든 HTML 파일에 추가**
   Kakao SDK 스크립트 다음에 추가:
   ```html
   <!-- Kakao SDK -->
   <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.5.0/kakao.min.js"></script>
   <script src="js/kakao-config.js"></script>
   ```

## 3. 배포 전 체크리스트

- [ ] `npm run build-css` 실행
- [ ] 모든 HTML에서 Tailwind CDN 제거
- [ ] kakao-config.js에 실제 키 입력
- [ ] 로컬에서 테스트
- [ ] Git에 커밋 & 푸시
- [ ] Vercel 자동 배포 확인

## 4. 주의사항

1. **Kakao 키 보안**
   - JavaScript 키는 도메인 제한으로 보호됨
   - 등록된 도메인에서만 작동

2. **Tailwind CSS**
   - CSS 파일 변경 시 `npm run build-css` 재실행
   - 개발 중에는 `npm run watch-css` 사용

3. **캐시 문제**
   - 배포 후 브라우저 캐시 삭제 필요할 수 있음
   - Vercel은 자동으로 캐시 무효화 처리