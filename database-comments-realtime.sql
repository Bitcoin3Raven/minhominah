-- 댓글 시스템 실시간 기능 활성화
-- Supabase Dashboard에서 실행하거나 SQL Editor에서 실행하세요

-- 먼저 현재 실시간 기능이 활성화된 테이블 확인
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND tablename IN ('comments', 'comment_likes', 'comment_notifications')
ORDER BY 
    schemaname, tablename;

-- 이미 활성화되어 있지 않은 경우에만 추가
-- 아래 명령어를 하나씩 실행하면서 이미 존재한다는 오류가 나면 무시하세요

-- 1. comments 테이블 실시간 기능 활성화 (이미 있으면 오류 무시)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 2. comment_likes 테이블 실시간 기능 활성화 (이미 있으면 오류 무시)
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;

-- 3. comment_notifications 테이블 실시간 기능 활성화 (이미 있으면 오류 무시)
ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;

-- 실시간 기능이 활성화된 테이블 확인
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    schemaname, tablename;

-- 참고: 실시간 기능을 비활성화하려면 아래 명령어 사용
-- ALTER PUBLICATION supabase_realtime DROP TABLE comments;
-- ALTER PUBLICATION supabase_realtime DROP TABLE comment_likes;
-- ALTER PUBLICATION supabase_realtime DROP TABLE comment_notifications;