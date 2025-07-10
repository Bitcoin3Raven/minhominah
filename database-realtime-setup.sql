-- 민호민아 성장앨범: 실시간 기능 활성화 SQL
-- 실행 날짜: 2025-07-10
-- 설명: 댓글 시스템의 실시간 업데이트를 위한 설정

-- 1. Realtime Publication 생성 (이미 있을 수 있음)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- 2. 댓글 테이블을 실시간 구독에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 3. 댓글 좋아요 테이블을 실시간 구독에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;

-- 4. (선택사항) 알림 테이블도 실시간 구독에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;

-- 5. 현재 실시간 구독에 포함된 테이블 확인
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    schemaname, tablename;

-- 6. 함수: 실시간 테이블 목록 조회 (선택사항)
CREATE OR REPLACE FUNCTION get_realtime_tables()
RETURNS TABLE(schema_name text, table_name text) AS $
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
    ORDER BY schemaname, tablename;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 실행 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '실시간 기능이 활성화되었습니다!';
    RAISE NOTICE '다음 테이블들이 실시간 구독에 추가되었습니다:';
    RAISE NOTICE '- comments: 댓글 실시간 업데이트';
    RAISE NOTICE '- comment_likes: 좋아요 실시간 업데이트';
    RAISE NOTICE '- comment_notifications: 알림 실시간 업데이트';
    RAISE NOTICE '';
    RAISE NOTICE '참고: 테이블이 이미 publication에 추가되어 있다면 오류가 발생할 수 있습니다.';
    RAISE NOTICE '이 경우 무시하고 진행하셔도 됩니다.';
END $$;
