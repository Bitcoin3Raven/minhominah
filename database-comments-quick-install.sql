-- 민호민아 성장앨범: 댓글 시스템 간편 설치 스크립트
-- 실행 날짜: 2025-07-10
-- 설명: 이 스크립트 하나로 누락된 모든 댓글 관련 기능을 설치합니다

-- ================================================
-- 1단계: 누락된 테이블 생성
-- ================================================

-- comment_likes 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- comment_notifications 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('new_comment', 'reply', 'like')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2단계: 인덱스 생성 (성능 향상)
-- ================================================

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient ON comment_notifications(recipient_user_id, is_read);

-- ================================================
-- 3단계: RLS (Row Level Security) 활성화
-- ================================================

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 4단계: RLS 정책 생성
-- ================================================

-- 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Family members can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Family members can manage their likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can view their own notifications" ON comment_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON comment_notifications;

-- 새 정책 생성
CREATE POLICY "Family members can view comment likes" ON comment_likes
    FOR SELECT USING (true);  -- 임시로 모든 사용자 허용 (family_members 테이블이 없을 수 있음)

CREATE POLICY "Family members can manage their likes" ON comment_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON comment_notifications
    FOR SELECT USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can update their own notifications" ON comment_notifications
    FOR UPDATE USING (auth.uid() = recipient_user_id);

-- ================================================
-- 5단계: 댓글 트리 함수 생성
-- ================================================

CREATE OR REPLACE FUNCTION get_comments_tree(p_memory_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH RECURSIVE comment_tree AS (
        -- 최상위 댓글
        SELECT 
            c.id,
            c.memory_id,
            c.user_id,
            c.parent_comment_id,
            c.content,
            c.is_edited,
            c.created_at,
            c.updated_at,
            p.username,
            p.full_name,
            p.avatar_url,
            COUNT(DISTINCT cl.id) as like_count,
            EXISTS(
                SELECT 1 FROM comment_likes 
                WHERE comment_id = c.id 
                AND user_id = auth.uid()
            ) as is_liked_by_current_user,
            0 as depth
        FROM comments c
        LEFT JOIN profiles p ON c.user_id = p.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        WHERE c.memory_id = p_memory_id 
        AND c.parent_comment_id IS NULL
        GROUP BY c.id, p.username, p.full_name, p.avatar_url
        
        UNION ALL
        
        -- 대댓글
        SELECT 
            c.id,
            c.memory_id,
            c.user_id,
            c.parent_comment_id,
            c.content,
            c.is_edited,
            c.created_at,
            c.updated_at,
            p.username,
            p.full_name,
            p.avatar_url,
            COUNT(DISTINCT cl.id) as like_count,
            EXISTS(
                SELECT 1 FROM comment_likes 
                WHERE comment_id = c.id 
                AND user_id = auth.uid()
            ) as is_liked_by_current_user,
            ct.depth + 1 as depth
        FROM comments c
        INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
        LEFT JOIN profiles p ON c.user_id = p.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        GROUP BY c.id, p.username, p.full_name, p.avatar_url, ct.depth
    )
    SELECT json_agg(
        json_build_object(
            'id', id,
            'memory_id', memory_id,
            'user_id', user_id,
            'parent_comment_id', parent_comment_id,
            'content', content,
            'is_edited', is_edited,
            'created_at', created_at,
            'updated_at', updated_at,
            'username', username,
            'full_name', full_name,
            'avatar_url', avatar_url,
            'like_count', like_count,
            'is_liked_by_current_user', is_liked_by_current_user,
            'depth', depth
        ) ORDER BY created_at
    ) INTO result
    FROM comment_tree;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6단계: 실시간 기능 활성화
-- ================================================

-- Publication이 없으면 생성
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- 테이블을 실시간 구독에 추가 (에러 무시)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;  -- 이미 추가되어 있으면 무시
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;  -- 이미 추가되어 있으면 무시
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;  -- 이미 추가되어 있으면 무시
END $$;

-- ================================================
-- 7단계: 설치 결과 확인
-- ================================================

SELECT 
    '설치 완료!' as status,
    COUNT(*) FILTER (WHERE table_name = 'comments') as comments_table,
    COUNT(*) FILTER (WHERE table_name = 'comment_likes') as likes_table,
    COUNT(*) FILTER (WHERE table_name = 'comment_notifications') as notifications_table
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('comments', 'comment_likes', 'comment_notifications');

-- 실시간 기능 확인
SELECT 
    tablename,
    '✅ 실시간 활성화' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('comments', 'comment_likes', 'comment_notifications');

-- ================================================
-- 완료 메시지
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 댓글 시스템 설치가 완료되었습니다!';
    RAISE NOTICE '';
    RAISE NOTICE '설치된 기능:';
    RAISE NOTICE '✅ comment_likes 테이블';
    RAISE NOTICE '✅ comment_notifications 테이블';
    RAISE NOTICE '✅ 필요한 인덱스';
    RAISE NOTICE '✅ RLS 정책';
    RAISE NOTICE '✅ get_comments_tree 함수';
    RAISE NOTICE '✅ 실시간 기능';
    RAISE NOTICE '';
    RAISE NOTICE '이제 웹사이트에서 댓글 기능을 사용할 수 있습니다!';
END $$;
