-- memory_people 테이블의 RLS 정책 수정
-- 이 테이블은 메모리와 인물을 연결하는 중간 테이블입니다

-- 1. 현재 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'memory_people';

-- 2. 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can create memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can view memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can delete memory_people" ON memory_people;

-- 3. 새로운 RLS 정책 생성

-- 조회 정책: 모든 사용자가 memory_people를 볼 수 있음
CREATE POLICY "Anyone can view memory_people" ON memory_people
    FOR SELECT
    USING (true);

-- 삽입 정책: 인증된 사용자가 자신의 메모리에 대해 memory_people 생성 가능
CREATE POLICY "Users can create memory_people" ON memory_people
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND (memories.user_id = auth.uid() OR memories.created_by = auth.uid())
        )
    );

-- 삭제 정책: 메모리 소유자가 memory_people 삭제 가능
CREATE POLICY "Users can delete memory_people" ON memory_people
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND (memories.user_id = auth.uid() OR memories.created_by = auth.uid())
        )
    );

-- 4. RLS 활성화 확인
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;

-- 5. 정책 적용 확인
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'memory_people'
ORDER BY policyname;
