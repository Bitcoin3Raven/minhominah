-- 함수 존재 여부 확인
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_comments_tree';

-- 실시간 활성화 테이블 확인
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND tablename IN ('comments', 'comment_likes', 'comment_notifications')
ORDER BY 
    tablename;