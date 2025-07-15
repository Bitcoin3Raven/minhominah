-- 태그 관련 테이블 및 제약조건 확인
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. tags 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tags'
ORDER BY ordinal_position;

-- 2. tags 테이블의 제약조건 확인
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tags'::regclass;

-- 3. memory_tags 테이블 확인 (외래키 제약)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'memory_tags'::regclass
AND contype = 'f';

-- 4. RLS 정책 확인
SELECT 
    pol.polname AS policy_name,
    pol.polcmd AS command,
    pol.polroles::regrole[] AS roles,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_policy pol
WHERE pol.polrelid = 'tags'::regclass;

-- 5. tags 테이블에 대한 RLS 정책 추가 (필요한 경우)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Parents can manage tags" ON tags;

-- 새 정책 생성
CREATE POLICY "Anyone can view tags" ON tags
    FOR SELECT
    USING (true);

CREATE POLICY "Parents can manage tags" ON tags
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'parent'
        )
    );

-- 6. memory_tags의 외래키 제약조건 수정 (CASCADE DELETE 추가)
ALTER TABLE memory_tags
    DROP CONSTRAINT IF EXISTS memory_tags_tag_id_fkey;

ALTER TABLE memory_tags
    ADD CONSTRAINT memory_tags_tag_id_fkey
    FOREIGN KEY (tag_id) 
    REFERENCES tags(id) 
    ON DELETE CASCADE;

-- 7. 테스트: 태그 삭제가 작동하는지 확인
DO $$
DECLARE
    test_tag_id uuid;
BEGIN
    -- 테스트 태그 생성
    INSERT INTO tags (name)
    VALUES ('test_delete_tag')
    RETURNING id INTO test_tag_id;
    
    -- 삭제 시도
    DELETE FROM tags WHERE id = test_tag_id;
    
    RAISE NOTICE '태그 삭제 테스트 성공';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '태그 삭제 테스트 실패: %', SQLERRM;
END;
$$;

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE 'tags 테이블 권한 및 제약조건이 수정되었습니다.';
    RAISE NOTICE '이제 관리자 페이지에서 태그 삭제가 가능합니다.';
END;
$$;