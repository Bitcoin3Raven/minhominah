-- 민호민아 성장앨범: 댓글 시스템 데이터베이스 스키마
-- 실행 날짜: 2025-07-10
-- 설명: 추억에 댓글을 남길 수 있는 기능을 위한 테이블 및 정책

-- 1. 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글 지원
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 댓글 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- 한 사용자가 하나의 댓글에 한 번만 좋아요 가능
);

-- 3. 댓글 알림을 위한 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('new_comment', 'reply', 'like')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_comments_memory_id ON comments(memory_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_notifications_recipient ON comment_notifications(recipient_user_id, is_read);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 설정

-- 댓글 조회: 가족 구성원과 댓글 작성자만 가능
CREATE POLICY "Comments viewable by family members and author" ON comments
    FOR SELECT USING (
        -- 작성자 본인
        auth.uid() = user_id
        OR
        -- 가족 구성원
        EXISTS (
            SELECT 1 FROM family_members fm1
            WHERE fm1.user_id = auth.uid()
            AND fm1.status = 'active'
            AND EXISTS (
                SELECT 1 FROM family_members fm2
                WHERE fm2.user_id = comments.user_id
                AND fm2.family_id = fm1.family_id
                AND fm2.status = 'active'
            )
        )
    );

-- 댓글 작성: 가족 구성원만 가능
CREATE POLICY "Only family members can create comments" ON comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
        AND auth.uid() = user_id
    );

-- 댓글 수정: 작성자만 가능
CREATE POLICY "Only comment author can update" ON comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 댓글 삭제: 작성자와 부모 역할만 가능
CREATE POLICY "Comment author and parents can delete" ON comments
    FOR DELETE USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM family_members
            WHERE user_id = auth.uid()
            AND role = 'parent'
            AND status = 'active'
        )
    );

-- 댓글 좋아요 조회: 가족 구성원만
CREATE POLICY "Family members can view comment likes" ON comment_likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- 댓글 좋아요 추가/삭제: 가족 구성원만
CREATE POLICY "Family members can like comments" ON comment_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
        AND auth.uid() = user_id
    );

-- 알림 조회: 수신자만
CREATE POLICY "Users can view their own notifications" ON comment_notifications
    FOR SELECT USING (auth.uid() = recipient_user_id);

-- 알림 업데이트: 수신자만 (읽음 표시)
CREATE POLICY "Users can update their own notifications" ON comment_notifications
    FOR UPDATE USING (auth.uid() = recipient_user_id);

-- 7. 트리거 함수: 댓글 수정 시 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.is_edited = TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 생성
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_updated_at();

-- 9. 트리거 함수: 새 댓글 알림 생성
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

-- 10. 댓글 생성 시 알림 트리거
CREATE TRIGGER create_comment_notification_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION create_comment_notification();

-- 11. 좋아요 알림 트리거 함수
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

-- 12. 좋아요 생성 시 알림 트리거
CREATE TRIGGER create_like_notification_trigger
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION create_like_notification();

-- 13. 뷰: 댓글과 관련 정보를 함께 조회
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

-- 14. 함수: 댓글 트리 구조로 가져오기
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

-- 실행 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '댓글 시스템 스키마가 성공적으로 생성되었습니다!';
    RAISE NOTICE '다음 테이블들이 생성되었습니다:';
    RAISE NOTICE '- comments: 댓글 저장';
    RAISE NOTICE '- comment_likes: 댓글 좋아요';
    RAISE NOTICE '- comment_notifications: 댓글 알림';
    RAISE NOTICE '- comments_with_details: 댓글 상세 정보 뷰';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS 정책이 적용되어 가족 구성원만 댓글을 읽고 쓸 수 있습니다.';
END $$;
