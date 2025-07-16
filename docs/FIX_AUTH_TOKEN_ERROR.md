# 인증 토큰 에러 해결 가이드

## 에러: "Error: No authorization token was found"

이 에러는 인증 토큰이 없거나 만료되었을 때 발생합니다.

## 즉시 해결 방법:

### 1. 로그아웃 후 다시 로그인
1. 우측 상단의 로그아웃 버튼 클릭
2. 로그인 페이지에서 이메일과 비밀번호 입력
3. 로그인 버튼 클릭

### 2. 브라우저 캐시 및 쿠키 클리어
1. Chrome: 설정 → 개인정보 및 보안 → 인터넷 사용 기록 삭제
2. 또는 Ctrl+Shift+Delete (Mac: Cmd+Shift+Delete)
3. "쿠키 및 기타 사이트 데이터" 체크
4. "캐시된 이미지 및 파일" 체크
5. 삭제 클릭

### 3. 시크릿/프라이빗 모드로 시도
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P
- Safari: Cmd+Shift+N

### 4. 개발자 도구에서 로컬 스토리지 확인
1. F12로 개발자 도구 열기
2. Application/Storage 탭 클릭
3. Local Storage → minhominah.com 클릭
4. `sb-illwscrdeyncckltjrmr-auth-token` 항목 확인
5. 없거나 만료되었다면 로그인 필요

## 근본적인 해결 방법:

### Supabase 대시보드에서 JWT 만료 시간 연장
1. Supabase 대시보드 → Authentication → Settings
2. JWT Expiry 시간을 더 길게 설정 (예: 604800 = 7일)

## 문제가 계속되면:

1. 브라우저 콘솔(F12)에서 정확한 에러 메시지 확인
2. Network 탭에서 실패한 요청의 Headers 확인
3. Authorization 헤더가 있는지 확인

## 코드 수정이 필요한 경우:

만약 특정 API 호출에서만 발생한다면, 해당 코드에서 인증 헤더가 제대로 전달되는지 확인:

```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  // 인증이 필요한 경우 자동으로 헤더가 추가됨
```
