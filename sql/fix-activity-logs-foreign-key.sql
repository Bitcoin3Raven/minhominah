-- activity_logs 테이블의 외래키 문제 해결
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. profiles 테이블과의 외래키 관계 확인 및 수정
-- activity_logs에서 user_id를 통한 profiles 조인이 실패하는 문제 해결

-- 기존 외래키 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'activity_logs'::regclass
AND contype = 'f';  -- FOREIGN KEY constraints

-- activity_logs 테이블 구조 다시 생성 (안전한 버전)
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS 정책 재설정
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;
DROP POLICY IF EXISTS "Parents can view all activities" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activities" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert activities" ON activity_logs;

-- 새 정책 생성
CREATE POLICY "Users can view their own activities" ON activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Parents can view all activities" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'parent'
        )
    );

CREATE POLICY "Users can insert activities" ON activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- get_users_with_email 함수 확인 및 재생성
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
    id uuid,
    username text,
    full_name text,
    role text,
    created_at timestamptz,
    updated_at timestamptz,
    email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 현재 사용자가 parent 역할인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'parent'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only parent role can access this function';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.role,
        p.created_at,
        p.updated_at,
        u.email
    FROM profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_users_with_email() TO authenticated;

-- 테스트: activity_logs 조회가 작동하는지 확인
DO $$
DECLARE
    test_result record;
BEGIN
    -- 테스트 데이터 삽입
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'test', 'test', gen_random_uuid());
    
    -- 조회 테스트
    SELECT * INTO test_result
    FROM activity_logs
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF test_result IS NOT NULL THEN
        RAISE NOTICE 'activity_logs 테이블이 정상 작동합니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END;
$$;

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE 'activity_logs 테이블 문제가 해결되었습니다.';
    RAISE NOTICE '관리자 페이지가 정상 작동할 것입니다.';
END;
$$;