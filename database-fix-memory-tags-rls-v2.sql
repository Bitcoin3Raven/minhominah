-- memory_tags 테이블의 RLS 정책 수정
-- 문제: upsert 작업 시 RLS 정책 위반 에러 발생

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "memory_tags_view_policy" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_insert_policy" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_update_policy" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_delete_policy" ON memory_tags;

-- 2. 새로운 정책 생성
-- 조회: 모든 인증된 사용자가 조회 가능
CREATE POLICY "memory_tags_view_policy" ON memory_tags
    FOR SELECT USING (auth.role() = 'authenticated');

-- 삽입: 인증된 사용자가 자신의 메모리에 태그 추가 가능
CREATE POLICY "memory_tags_insert_policy" ON memory_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- 업데이트: 인증된 사용자가 자신의 메모리의 태그 수정 가능
CREATE POLICY "memory_tags_update_policy" ON memory_tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- 삭제: 인증된 사용자가 자신의 메모리의 태그 삭제 가능
CREATE POLICY "memory_tags_delete_policy" ON memory_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- 3. RLS 활성화 확인
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

-- 4. memory_people 테이블도 동일하게 수정
DROP POLICY IF EXISTS "memory_people_view_policy" ON memory_people;
DROP POLICY IF EXISTS "memory_people_insert_policy" ON memory_people;
DROP POLICY IF EXISTS "memory_people_update_policy" ON memory_people;
DROP POLICY IF EXISTS "memory_people_delete_policy" ON memory_people;

-- memory_people 정책 생성
CREATE POLICY "memory_people_view_policy" ON memory_people
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "memory_people_insert_policy" ON memory_people
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

CREATE POLICY "memory_people_update_policy" ON memory_people
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

CREATE POLICY "memory_people_delete_policy" ON memory_people
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- RLS 활성화 확인
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
