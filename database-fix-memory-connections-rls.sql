-- 메모리 관련 연결 테이블들의 RLS 정책 수정
-- memory_people, memory_tags 테이블 권한 문제 해결

-- ===== memory_people 테이블 =====
-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can create memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can view memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can delete memory_people" ON memory_people;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON memory_people;
DROP POLICY IF EXISTS "Enable read access for all users" ON memory_people;

-- 2. 새로운 정책 생성
-- 조회: 모두 가능
CREATE POLICY "Anyone can view memory_people" ON memory_people
    FOR SELECT
    USING (true);

-- 삽입: 인증된 사용자가 자신의 메모리에 대해서만
CREATE POLICY "Authenticated users can create memory_people" ON memory_people
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND (memories.user_id = auth.uid() OR memories.created_by = auth.uid())
        )
    );

-- 삭제: 메모리 소유자만
CREATE POLICY "Memory owners can delete memory_people" ON memory_people
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND (memories.user_id = auth.uid() OR memories.created_by = auth.uid())
        )
    );

-- ===== memory_tags 테이블 =====
-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can create memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can view memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can delete memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON memory_tags;
DROP POLICY IF EXISTS "Enable read access for all users" ON memory_tags;

-- 2. 새로운 정책 생성
-- 조회: 모두 가능
CREATE POLICY "Anyone can view memory_tags" ON memory_tags
    FOR SELECT
    USING (true);

-- 삽입: 인증된 사용자가 자신의 메모리에 대해서만
CREATE POLICY "Authenticated users can create memory_tags" ON memory_tags
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND (memories.user_id = auth.uid() OR memories.created_by = auth.uid())
        )
    );

-- 삭제: 메모리 소유자만
CREATE POLICY "Memory owners can delete memory_tags" ON memory_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND (memories.user_id = auth.uid() OR memories.created_by = auth.uid())
        )
    );

-- 3. RLS 활성화 확인
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

-- 4. 정책 확인
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('memory_people', 'memory_tags')
ORDER BY tablename, policyname;
