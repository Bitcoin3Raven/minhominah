-- 민호민아 성장앨범: 누락된 댓글 관련 테이블 생성
-- 실행 날짜: 2025-07-10
-- 설명: comment_likes, comment_notifications 테이블이 누락된 경우 실행

-- 1. 댓글 좋아요 테이블 생성 (누락된 경우)
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- 한 사용자가 하나의 댓글에 한 번만 좋아요 가능
);

-- 2. 댓글 알림 테이블 생성 (누락된 경우)
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('new_comment', 'reply', 'like')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient ON comment_notifications(recipient_user_id, is_read);

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- 5. 댓글 좋아요 RLS 정책
-- 가족 구성원만 좋아요 조회 가능
CREATE POLICY "Family members can view comment likes" ON comment_likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- 가족 구성원만 좋아요 추가/삭제 가능
CREATE POLICY "Family members can manage their likes" ON comment_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
        AND auth.uid() = user_id
    );

-- 6. 알림 RLS 정책
-- 수신자만 자신의 알림 조회 가능
CREATE POLICY "Users can view their own notifications" ON comment_notifications
    FOR SELECT USING (auth.uid() = recipient_user_id);

-- 수신자만 알림 업데이트 가능 (읽음 표시)
CREATE POLICY "Users can update their own notifications" ON comment_notifications
    FOR UPDATE USING (auth.uid() = recipient_user_id);

-- 7. 댓글 수 집계를 위한 뷰 (이미 있을 수 있음)
CREATE OR REPLACE VIEW comments_with_details AS
SELECT 
    c.*,
    p.username,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT cl.id) as like_count,
    COUNT(DISTINCT replies.id) as reply_count,
    EXISTS(
        SELECT 1 FROM comment_likes 
        WHERE comment_id = c.id 
        AND user_id = auth.uid()
    ) as is_liked_by_current_user
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN comment_likes cl ON c.id = cl.comment_id
LEFT JOIN comments replies ON c.id = replies.parent_comment_id
GROUP BY c.id, p.username, p.full_name, p.avatar_url;

-- 8. 알림 트리거 함수 (누락된 경우)
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    memory_owner_id UUID;
    parent_comment_author_id UUID;
BEGIN
    -- 추억 소유자에게 알림
    SELECT created_by INTO memory_owner_id 
    FROM memories 
    WHERE id = NEW.memory_id;
    
    IF memory_owner_id IS NOT NULL AND memory_owner_id != NEW.user_id THEN
        INSERT INTO comment_notifications (recipient_user_id, comment_id, type)
        VALUES (memory_owner_id, NEW.id, 'new_comment');
    END IF;
    
    -- 대댓글인 경우 원댓글 작성자에게 알림
    IF NEW.parent_comment_id IS NOT NULL THEN
        SELECT user_id INTO parent_comment_author_id 
        FROM comments 
        WHERE id = NEW.parent_comment_id;
        
        IF parent_comment_author_id IS NOT NULL AND parent_comment_author_id != NEW.user_id THEN
            INSERT INTO comment_notifications (recipient_user_id, comment_id, type)
            VALUES (parent_comment_author_id, NEW.id, 'reply');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 댓글 생성 시 알림 트리거 (누락된 경우)
DROP TRIGGER IF EXISTS create_comment_notification_trigger ON comments;
CREATE TRIGGER create_comment_notification_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION create_comment_notification();

-- 10. 좋아요 알림 트리거 함수 (누락된 경우)
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    comment_author_id UUID;
BEGIN
    -- 댓글 작성자에게 알림
    SELECT user_id INTO comment_author_id 
    FROM comments 
    WHERE id = NEW.comment_id;
    
    IF comment_author_id IS NOT NULL AND comment_author_id != NEW.user_id THEN
        INSERT INTO comment_notifications (recipient_user_id, comment_id, type)
        VALUES (comment_author_id, NEW.comment_id, 'like');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 좋아요 생성 시 알림 트리거 (누락된 경우)
DROP TRIGGER IF EXISTS create_like_notification_trigger ON comment_likes;
CREATE TRIGGER create_like_notification_trigger
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION create_like_notification();

-- 12. 실시간 기능 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;

-- 13. 댓글 트리 구조 함수 (누락된 경우)
CREATE OR REPLACE FUNCTION get_comments_tree(p_memory_id UUID)
RETURNS JSON AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 생성된 테이블 확인
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime'
        ) THEN '✅ 실시간 활성화됨'
        ELSE '❌ 실시간 비활성화'
    END as realtime_status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('comments', 'comment_likes', 'comment_notifications')
ORDER BY table_name;

-- 실행 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '누락된 댓글 관련 테이블이 생성되었습니다!';
    RAISE NOTICE '- comment_likes: 댓글 좋아요 기능';
    RAISE NOTICE '- comment_notifications: 댓글 알림 기능';
    RAISE NOTICE '';
    RAISE NOTICE '실시간 기능도 자동으로 활성화되었습니다.';
END $$;
