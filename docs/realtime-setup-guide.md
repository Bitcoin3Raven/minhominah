# Supabase 실시간 기능 설정 가이드

## 📡 실시간 기능이란?
Supabase의 실시간 기능을 통해 데이터베이스 변경사항을 즉시 클라이언트에 반영할 수 있습니다.

## 🚀 설정 방법

### 방법 1: SQL Editor 사용 (권장)

1. **Supabase 대시보드 → SQL Editor**로 이동

2. 다음 SQL 실행:
```sql
-- 실시간 구독에 댓글 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;

-- 확인
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### 방법 2: Supabase UI 사용 (새로운 방법)

최신 Supabase UI에서는 다음과 같이 설정합니다:

1. **Database → Tables** 메뉴로 이동
2. 각 테이블명 클릭:
   - `comments`
   - `comment_likes`
   - `comment_notifications`
3. 테이블 상세 페이지에서 **"Enable Realtime"** 토글 활성화

### 방법 3: API를 통한 설정

```javascript
// supabase.js에서 실시간 구독 설정 확인
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

## 🔍 설정 확인 방법

### SQL로 확인
```sql
-- 실시간 구독에 포함된 테이블 목록
SELECT 
    schemaname as 스키마,
    tablename as 테이블명
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

### 브라우저 콘솔에서 확인
```javascript
// 개발자 도구 콘솔에서 실행
const channel = supabase
  .channel('test-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'comments' },
    (payload) => console.log('실시간 이벤트:', payload)
  )
  .subscribe();

// 구독 상태 확인
console.log('구독 상태:', channel.state);
```

## ❗ 주의사항

1. **테이블이 이미 존재해야 함**
   - `database-comments-schema.sql`을 먼저 실행하여 테이블 생성

2. **RLS 정책 확인**
   - 실시간 구독도 RLS 정책을 따름
   - 로그인한 사용자만 실시간 업데이트 수신

3. **브라우저 지원**
   - WebSocket을 지원하는 최신 브라우저 필요
   - 방화벽이 WebSocket을 차단하지 않는지 확인

## 🐛 문제 해결

### "테이블을 찾을 수 없음" 오류
```sql
-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comments', 'comment_likes');
```

### "이미 publication에 있음" 오류
```sql
-- 기존 설정 제거 후 다시 추가
ALTER PUBLICATION supabase_realtime DROP TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

### 실시간 업데이트가 작동하지 않을 때
1. 브라우저 개발자 도구 → Network → WS 탭 확인
2. WebSocket 연결 상태 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## 📊 성능 고려사항

- 실시간 구독은 서버 리소스를 사용합니다
- 필요한 테이블만 선택적으로 활성화
- 대량의 업데이트가 예상되는 경우 throttling 고려

## 🎯 다음 단계

실시간 기능 설정이 완료되면:
1. 브라우저에서 민호민아 성장앨범 접속
2. 추억 상세보기 → 댓글 작성
3. 다른 브라우저/탭에서 실시간 업데이트 확인
