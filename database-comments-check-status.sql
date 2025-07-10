-- 민호민아 성장앨범: 댓글 시스템 상태 확인
-- 실행 날짜: 2025-07-10
-- 설명: 댓글 시스템 관련 테이블과 설정 상태 확인

-- 1. 댓글 관련 테이블 존재 여부 확인
SELECT 
    'comments' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') as exists,
    (SELECT COUNT(*) FROM comments WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments')) as row_count
UNION ALL
SELECT 
    'comment_likes' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_likes') as exists,
    (SELECT COUNT(*) FROM comment_likes WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_likes')) as row_count
UNION ALL
SELECT 
    'comment_notifications' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_notifications') as exists,
    (SELECT COUNT(*) FROM comment_notifications WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_notifications')) as row_count;

-- 2. RLS (Row Level Security) 상태 확인
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS 활성화됨'
        ELSE '❌ RLS 비활성화됨'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('comments', 'comment_likes', 'comment_notifications')
ORDER BY tablename;

-- 3. 실시간 구독 상태 확인
SELECT 
    'comments' as table_name,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'comments'
        ) THEN '✅ 실시간 활성화됨'
        ELSE '❌ 실시간 비활성화됨'
    END as realtime_status
UNION ALL
SELECT 
    'comment_likes',
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'comment_likes'
        ) THEN '✅ 실시간 활성화됨'
        ELSE '❌ 실시간 비활성화됨'
    END
UNION ALL
SELECT 
    'comment_notifications',
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'comment_notifications'
        ) THEN '✅ 실시간 활성화됨'
        ELSE '❌ 실시간 비활성화됨'
    END;

-- 4. 필요한 함수 존재 여부 확인
SELECT 
    proname as function_name,
    '✅ 함수 존재' as status
FROM pg_proc
WHERE proname IN ('get_comments_tree', 'create_comment_notification', 'create_like_notification', 'update_comment_updated_at')
ORDER BY proname;

-- 5. 트리거 존재 여부 확인
SELECT 
    trigger_name,
    event_object_table as table_name,
    '✅ 트리거 존재' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('update_comments_updated_at', 'create_comment_notification_trigger', 'create_like_notification_trigger')
ORDER BY trigger_name;

-- 6. 전체 시스템 상태 요약
DO $$
DECLARE
    comments_exists BOOLEAN;
    likes_exists BOOLEAN;
    notifications_exists BOOLEAN;
    realtime_enabled BOOLEAN;
BEGIN
    -- 테이블 존재 확인
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') INTO comments_exists;
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_likes') INTO likes_exists;
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_notifications') INTO notifications_exists;
    
    -- 실시간 활성화 확인
    SELECT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') INTO realtime_enabled;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== 댓글 시스템 상태 요약 ===';
    RAISE NOTICE '';
    
    IF comments_exists AND likes_exists AND notifications_exists THEN
        RAISE NOTICE '✅ 모든 테이블이 정상적으로 생성되었습니다.';
    ELSE
        RAISE NOTICE '❌ 일부 테이블이 누락되었습니다:';
        IF NOT comments_exists THEN RAISE NOTICE '   - comments 테이블 누락'; END IF;
        IF NOT likes_exists THEN RAISE NOTICE '   - comment_likes 테이블 누락'; END IF;
        IF NOT notifications_exists THEN RAISE NOTICE '   - comment_notifications 테이블 누락'; END IF;
        RAISE NOTICE '';
        RAISE NOTICE '해결 방법: database-comments-missing-tables.sql 파일을 실행하세요.';
    END IF;
    
    IF realtime_enabled THEN
        RAISE NOTICE '✅ 실시간 기능이 활성화되어 있습니다.';
    ELSE
        RAISE NOTICE '❌ 실시간 기능이 비활성화되어 있습니다.';
        RAISE NOTICE '해결 방법: database-realtime-setup.sql 파일을 실행하세요.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================';
END $$;
