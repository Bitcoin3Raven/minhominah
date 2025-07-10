# 🚀 민호민아 성장앨범 - 댓글 시스템 간편 설치

## 🎯 30초 설치 가이드

### 1단계: Supabase SQL Editor 열기
- Supabase 대시보드 → SQL Editor

### 2단계: SQL 실행
```sql
-- 아래 파일 중 하나를 선택하여 전체 내용 복사 & 실행

-- 옵션 1 (권장): 간편 설치
database-comments-quick-install.sql

-- 옵션 2: 전체 설치 (처음부터)
database-comments-schema.sql
```

### 3단계: 확인
- 브라우저에서 `test/comment-system-check.html` 열기
- 모든 항목이 ✅로 표시되면 완료!

## ❌ 문제 해결

### "relation 'comment_likes' does not exist" 오류
```sql
-- database-comments-missing-tables.sql 실행
```

### 실시간 기능이 작동하지 않을 때
```sql
-- database-realtime-setup.sql 실행
```

### 상태 확인
```sql
-- database-comments-check-status.sql 실행
```

## 📁 관련 파일

### SQL 파일
- `database-comments-quick-install.sql` - 🚀 간편 설치 (권장)
- `database-comments-schema.sql` - 전체 스키마
- `database-comments-missing-tables.sql` - 누락 테이블 복구
- `database-comments-check-status.sql` - 상태 확인
- `database-realtime-setup.sql` - 실시간 설정

### 테스트 파일
- `test/comment-system-check.html` - 웹 상태 확인
- `test/realtime-test.html` - 실시간 테스트

### 문서
- `docs/comment-system-guide.md` - 상세 가이드
- `docs/realtime-setup-guide.md` - 실시간 가이드

## ✅ 성공!

설치가 완료되면:
1. 메인 페이지에서 추억 카드의 👁️ 아이콘 클릭
2. 상세 모달 하단에서 댓글 작성
3. 실시간으로 업데이트되는 댓글 확인

---

문제가 있나요? `database-comments-check-status.sql`을 실행하여 상태를 확인하세요!
