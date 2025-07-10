# Supabase 실제 데이터 연결 가이드

## 현재 상황
- Supabase people 테이블에 실제 데이터 존재:
  - 민호: 2018-03-18 (현재 만 7세)
  - 민아: 2019-08-03 (현재 만 6세)
- 웹사이트는 테스트 모드로 동작 중 (하드코딩된 데이터 사용)

## Supabase 연결 방법

### 1. Supabase 프로젝트 정보 가져오기
1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. Settings > API 메뉴로 이동
4. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co` 형태
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형태의 긴 문자열

### 2. js/supabase.js 파일 수정
```javascript
// 변경 전
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// 변경 후 (실제 값으로 교체)
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...실제키...';
```

### 3. 테스트 모드 제거 (선택사항)
현재 index.html에는 Supabase 연결 실패 시 테스트 데이터를 사용하도록 되어 있습니다.
실제 운영 시에는 이 부분을 제거하거나 에러 메시지를 표시하도록 수정할 수 있습니다.

## 확인 방법
1. 브라우저에서 F12 (개발자 도구) 열기
2. Console 탭 확인
3. "Supabase 클라이언트가 없어 테스트 모드로 실행합니다." 메시지가 사라지면 성공

## 데이터 동기화
Supabase가 연결되면:
- people 테이블의 실제 생년월일 데이터 사용
- 민호: 2018-03-18 → 7세 버튼에 👦 표시
- 민아: 2019-08-03 → 6세 버튼에 👧 표시
- Supabase에서 직접 수정한 내용이 실시간으로 반영됨

## 보안 주의사항
- `SUPABASE_ANON_KEY`는 공개되어도 되는 키입니다 (Row Level Security 적용 필수)
- 민감한 작업은 서버사이드에서 처리하거나 Supabase Edge Functions 사용
- 프로덕션 배포 시 환경변수 사용 권장
