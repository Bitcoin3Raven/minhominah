# Supabase 실시간 기능 설정 가이드

## Dashboard에서 직접 설정하는 방법

### 1. 실시간 기능 활성화 (Database → Tables)

1. Supabase Dashboard 로그인
2. 좌측 메뉴에서 **Database** 클릭
3. **Tables** 메뉴 클릭
4. 각 테이블을 클릭하여 상세 페이지로 이동:
   - `comments` 테이블 클릭
   - 상단의 **Realtime** 토글 버튼 ON
   - `comment_likes` 테이블 클릭
   - 상단의 **Realtime** 토글 버튼 ON
   - `comment_notifications` 테이블 클릭
   - 상단의 **Realtime** 토글 버튼 ON

### 2. 함수 생성 확인 (Database → Functions)

1. 좌측 메뉴에서 **Database** 클릭
2. **Functions** 메뉴 클릭
3. `get_comments_tree` 함수가 있는지 확인
4. 없다면 SQL Editor에서 `database-comments-simple-install.sql` 실행

### 3. SQL Editor에서 실행

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. `database-comments-simple-install.sql` 내용 복사해서 붙여넣기
4. **Run** 버튼 클릭

### 4. 권한 확인 (Authentication → Policies)

댓글 시스템이 제대로 작동하려면 RLS 정책이 설정되어 있어야 합니다:

1. **Authentication** → **Policies** 메뉴로 이동
2. 다음 테이블들에 정책이 있는지 확인:
   - `comments` 테이블
   - `comment_likes` 테이블
   - `comment_notifications` 테이블

## 문제 해결

### 함수가 생성되지 않는 경우
- SQL Editor에서 오류 메시지 확인
- 함수 이름이 중복되는지 확인
- 스키마 권한 문제인지 확인

### 실시간 기능이 작동하지 않는 경우
- Replication 페이지에서 테이블이 활성화되어 있는지 확인
- 브라우저 콘솔에서 WebSocket 연결 오류 확인
- Supabase 프로젝트 설정에서 Realtime이 활성화되어 있는지 확인