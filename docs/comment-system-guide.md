# 댓글 시스템 설정 가이드

## 📝 댓글 시스템 소개

민호민아 성장앨범의 댓글 시스템은 가족 구성원들이 추억에 대한 생각과 감정을 공유할 수 있는 소통 공간입니다.

### 주요 기능
- 추억별 댓글 작성
- 댓글 좋아요
- 대댓글 (답글) 기능
- 실시간 업데이트
- 댓글 수정/삭제
- 알림 시스템

## 🚀 빠른 시작 (30초 설치!)

### 🎯 가장 쉬운 방법: 간편 설치 스크립트
1. Supabase 대시보드 → SQL Editor
2. `database-comments-quick-install.sql` 파일 내용 전체 복사
3. 붙여넣기 후 "Run" 클릭
4. **완료!** 🎉

---

### 📋 단계별 설치 (문제 해결용)

### 1. 현재 상태 확인
먼저 댓글 시스템의 현재 상태를 확인합니다:
```sql
-- database-comments-check-status.sql 실행
```

### 2. 필요한 SQL 실행
상태 확인 결과에 따라:

#### 테이블이 전혀 없는 경우:
```sql
-- database-comments-schema.sql 전체 실행
```

#### 일부 테이블만 있는 경우 (comments만 있고 나머지 누락):
```sql
-- database-comments-missing-tables.sql 실행
```

### 3. 실시간 기능 활성화
```sql
-- database-realtime-setup.sql 실행
-- 또는 아래 명령어 직접 실행:
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
```

### 4. 최종 확인
```sql
-- database-comments-check-status.sql 다시 실행
-- 모든 항목이 ✅로 표시되어야 함
```

### 3. 권한 확인
댓글 시스템은 가족 구성원만 사용 가능합니다:
- **부모(parent)**: 모든 댓글 작성/수정/삭제 가능
- **가족(family)**: 댓글 작성 및 본인 댓글만 수정/삭제
- **관람객(viewer)**: 댓글 읽기만 가능

## 💡 사용 방법

### 댓글 작성
1. 추억 카드의 눈 아이콘 클릭하여 상세보기
2. 하단 댓글 섹션에서 댓글 작성
3. "등록" 버튼 클릭

### 댓글 기능
- **좋아요**: 하트 아이콘 클릭
- **답글**: "답글" 버튼 클릭 후 작성
- **수정**: 본인 댓글의 연필 아이콘 클릭
- **삭제**: 본인 댓글의 휴지통 아이콘 클릭

## 🔧 문제 해결

### 댓글이 보이지 않을 때
1. 가족 구성원으로 등록되어 있는지 확인
2. 로그인 상태 확인
3. 브라우저 새로고침

### 실시간 업데이트가 안 될 때
1. Supabase Replication 설정 확인
2. 인터넷 연결 상태 확인
3. 브라우저 콘솔에서 에러 확인

## 📊 데이터베이스 구조

### comments 테이블
- `id`: 댓글 고유 ID
- `memory_id`: 추억 ID
- `user_id`: 작성자 ID
- `parent_comment_id`: 부모 댓글 ID (대댓글용)
- `content`: 댓글 내용
- `is_edited`: 수정 여부
- `created_at`: 작성 시간
- `updated_at`: 수정 시간

### comment_likes 테이블
- `id`: 좋아요 고유 ID
- `comment_id`: 댓글 ID
- `user_id`: 좋아요한 사용자 ID
- `created_at`: 좋아요 시간

### comment_notifications 테이블
- `id`: 알림 고유 ID
- `recipient_user_id`: 수신자 ID
- `comment_id`: 관련 댓글 ID
- `type`: 알림 유형 (new_comment/reply/like)
- `is_read`: 읽음 여부
- `created_at`: 알림 생성 시간

## 🎨 UI/UX 특징

- 트리 구조로 대댓글 표시
- 실시간 업데이트로 즉각적인 소통
- 부드러운 애니메이션 효과
- 다크모드 완벽 지원
- 모바일 반응형 디자인

## 🔐 보안

- RLS(Row Level Security)로 권한 제어
- 가족 구성원만 댓글 작성 가능
- SQL 인젝션 방지
- XSS 공격 방지
