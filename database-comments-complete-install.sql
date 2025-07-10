-- 댓글 시스템 완전 설치 SQL
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요

-- 1. get_comments_tree 함수 생성
CREATE OR REPLACE FUNCTION get_comments_tree(p_memory_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH RECURSIVE comment_tree AS (
        -- 최상위 댓글 (parent_id가 NULL인 댓글)
        SELECT 
            c.id,
            c.memory_id,
            c.user_id,
            c.parent_id,
            c.content,
            c.created_at,
            c.updated_at,
            p.name as user_name,
            p.emoji as user_emoji,
            0 as depth,
            ARRAY[c.created_at] as path_created,
            ARRAY[c.id] as path_ids
        FROM comments c
        LEFT JOIN people p ON c.user_id = p.id
        WHERE c.memory_id = p_memory_id 
          AND c.parent_id IS NULL
          AND c.deleted_at IS NULL
        
        UNION ALL
        
        -- 재귀적으로 대댓글 가져오기
        SELECT 
            c.id,
            c.memory_id,
            c.user_id,
            c.parent_id,
            c.content,
            c.created_at,
            c.updated_at,
            p.name as user_name,
            p.emoji as user_emoji,
            ct.depth + 1,
            ct.path_created || c.created_at,
            ct.path_ids || c.id
        FROM comments c
        LEFT JOIN people p ON c.user_id = p.id
        JOIN comment_tree ct ON c.parent_id = ct.id
        WHERE c.deleted_at IS NULL
    ),
    -- 각 댓글의 좋아요 수 계산
    comment_likes_count AS (
        SELECT 
            comment_id,
            COUNT(*) as like_count
        FROM comment_likes
        GROUP BY comment_id
    ),
    -- 현재 사용자의 좋아요 여부 확인
    user_likes AS (
        SELECT 
            comment_id,
            true as user_liked
        FROM comment_likes
        WHERE user_id = auth.uid()
    )
    -- 최종 결과 조합
    SELECT json_agg(
        json_build_object(
            'id', ct.id,
            'memory_id', ct.memory_id,
            'user_id', ct.user_id,
            'user_name', ct.user_name,
            'user_emoji', ct.user_emoji,
            'parent_id', ct.parent_id,
            'content', ct.content,
            'created_at', ct.created_at,
            'updated_at', ct.updated_at,
            'depth', ct.depth,
            'like_count', COALESCE(clc.like_count, 0),
            'user_liked', COALESCE(ul.user_liked, false),
            'path_created', ct.path_created,
            'path_ids', ct.path_ids
        ) ORDER BY ct.path_created[1] DESC, ct.path_ids
    ) INTO result
    FROM comment_tree ct
    LEFT JOIN comment_likes_count clc ON ct.id = clc.comment_id
    LEFT JOIN user_likes ul ON ct.id = ul.comment_id;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 2. 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION get_comments_tree(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments_tree(UUID) TO anon;

-- 3. 함수 설명 추가
COMMENT ON FUNCTION get_comments_tree(UUID) IS '특정 메모리의 댓글을 계층적 트리 구조로 가져오는 함수';

-- 4. 실시간 기능 활성화 (이미 활성화되어 있어도 오류 없음)
DO $$ 
BEGIN
    -- comments 테이블
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    END IF;
    
    -- comment_likes 테이블
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comment_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
    END IF;
    
    -- comment_notifications 테이블
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comment_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;
    END IF;
END $$;

-- 5. 설치 확인
SELECT 'get_comments_tree 함수 생성 완료' as status;

-- 6. 실시간 기능 활성화 상태 확인
SELECT 
    '실시간 기능 활성화된 테이블:' as info,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND tablename IN ('comments', 'comment_likes', 'comment_notifications')
ORDER BY 
    tablename;