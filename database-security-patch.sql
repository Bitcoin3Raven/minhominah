-- 보안 패치 - 2025-01-20
-- Supabase Security Advisor 경고 해결

-- 1. Function Search Path Mutable 문제 해결
-- get_comments_tree 함수에 search_path 설정 추가
CREATE OR REPLACE FUNCTION get_comments_tree(p_memory_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- 2. 다른 함수들도 search_path 설정 확인 및 추가
-- 모든 SECURITY DEFINER 함수에 대해 search_path 설정 추가가 필요합니다.

-- 사용자 정의 함수 목록 확인
-- SELECT 
--     n.nspname AS schema_name,
--     p.proname AS function_name,
--     pg_get_functiondef(p.oid) AS function_definition
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prosecdef = true  -- SECURITY DEFINER 함수만
--   AND p.proconfig IS NULL OR NOT 'search_path' = ANY(p.proconfig);

-- 3. Auth 설정 관련 권장사항 (Supabase 대시보드에서 설정 필요)
-- 
-- Auth OTP Long Expiry 해결:
-- - Supabase Dashboard > Authentication > Auth Settings
-- - OTP Expiry Duration을 300초(5분) 이하로 설정
-- 
-- Leaked Password Protection 활성화:
-- - Supabase Dashboard > Authentication > Auth Settings
-- - "Enable leaked password protection" 옵션 활성화
-- - 이 기능은 사용자가 유출된 비밀번호를 사용하는 것을 방지합니다.

-- 4. 추가 보안 강화 사항
-- RLS(Row Level Security) 정책 검토
-- 모든 테이블에 적절한 RLS 정책이 설정되어 있는지 확인

-- 예시: comments 테이블 RLS 정책
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 댓글을 볼 수 있음
-- CREATE POLICY "Comments are viewable by everyone" 
--     ON comments FOR SELECT 
--     USING (true);

-- 작성자만 수정 가능
-- CREATE POLICY "Users can update own comments" 
--     ON comments FOR UPDATE 
--     USING (auth.uid() = user_id);

-- 작성자만 삭제 가능
-- CREATE POLICY "Users can delete own comments" 
--     ON comments FOR DELETE 
--     USING (auth.uid() = user_id);

-- 인증된 사용자만 댓글 작성 가능
-- CREATE POLICY "Authenticated users can create comments" 
--     ON comments FOR INSERT 
--     WITH CHECK (auth.uid() IS NOT NULL);
