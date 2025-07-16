-- 긴급 memory_people, memory_tags RLS 정책 수정
-- 이 SQL을 Supabase SQL Editor에서 즉시 실행하세요!

-- 1. memory_people 테이블 정책 삭제 및 재생성
DROP POLICY IF EXISTS "Users can view memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can insert memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can update memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can delete memory_people" ON memory_people;

-- 더 간단한 정책으로 재생성
CREATE POLICY "Enable all for authenticated users on memory_people" ON memory_people
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 2. memory_tags 테이블도 동일하게 처리
DROP POLICY IF EXISTS "Users can view memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can insert memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can update memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can delete memory_tags" ON memory_tags;

CREATE POLICY "Enable all for authenticated users on memory_tags" ON memory_tags
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 3. RLS 활성화 확인
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

-- 4. 확인용 쿼리
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('memory_people', 'memory_tags')
ORDER BY tablename, policyname;
