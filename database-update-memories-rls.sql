-- memories 테이블 RLS 정책 업데이트
-- user_id 컬럼을 사용하도록 변경

-- 1. 먼저 memories 테이블의 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memories' 
AND column_name IN ('user_id', 'created_by');

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "memories_select_all" ON memories;
DROP POLICY IF EXISTS "memories_insert_authenticated" ON memories;
DROP POLICY IF EXISTS "memories_update_own" ON memories;
DROP POLICY IF EXISTS "memories_delete_own" ON memories;

-- 3. 새로운 정책 생성 (user_id 기반)

-- 3-1. 조회 정책: 모든 사용자가 모든 추억을 볼 수 있음 (임시)
-- is_public 컬럼이 있으면 아래 주석을 해제하고 위를 주석처리하세요
CREATE POLICY "memories_select_policy" ON memories
  FOR SELECT 
  USING (true);
  
-- CREATE POLICY "memories_select_policy" ON memories
--   FOR SELECT 
--   USING (
--     is_public = true OR 
--     user_id = auth.uid()
--   );

-- 3-2. 생성 정책: 로그인한 사용자가 자신의 user_id로만 생성 가능
CREATE POLICY "memories_insert_policy" ON memories
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- 3-3. 수정 정책: 자신의 추억만 수정 가능
CREATE POLICY "memories_update_policy" ON memories
  FOR UPDATE 
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- 3-4. 삭제 정책: 자신의 추억만 삭제 가능
CREATE POLICY "memories_delete_policy" ON memories
  FOR DELETE 
  USING (
    auth.uid() = user_id
  );

-- 4. memory_tags 테이블 정책 추가
DROP POLICY IF EXISTS "memory_tags_select_all" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_insert" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_delete" ON memory_tags;

CREATE POLICY "memory_tags_select_policy" ON memory_tags
  FOR SELECT USING (true);

CREATE POLICY "memory_tags_insert_policy" ON memory_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_tags.memory_id 
      AND memories.user_id = auth.uid()
    )
  );

CREATE POLICY "memory_tags_delete_policy" ON memory_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_tags.memory_id 
      AND memories.user_id = auth.uid()
    )
  );

-- 5. memory_people 테이블 정책 업데이트
DROP POLICY IF EXISTS "memory_people_select_all" ON memory_people;
DROP POLICY IF EXISTS "memory_people_insert" ON memory_people;
DROP POLICY IF EXISTS "memory_people_delete" ON memory_people;

CREATE POLICY "memory_people_select_policy" ON memory_people
  FOR SELECT USING (true);

CREATE POLICY "memory_people_insert_policy" ON memory_people
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_people.memory_id 
      AND memories.user_id = auth.uid()
    )
  );

CREATE POLICY "memory_people_delete_policy" ON memory_people
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_people.memory_id 
      AND memories.user_id = auth.uid()
    )
  );

-- 6. media_files 테이블 정책 업데이트
DROP POLICY IF EXISTS "media_files_select_all" ON media_files;
DROP POLICY IF EXISTS "media_files_insert" ON media_files;
DROP POLICY IF EXISTS "media_files_delete" ON media_files;

CREATE POLICY "media_files_select_policy" ON media_files
  FOR SELECT USING (true);

CREATE POLICY "media_files_insert_policy" ON media_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = media_files.memory_id 
      AND memories.user_id = auth.uid()
    )
  );

CREATE POLICY "media_files_delete_policy" ON media_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = media_files.memory_id 
      AND memories.user_id = auth.uid()
    )
  );

-- 7. RLS 활성화 확인
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- 8. 정책이 올바르게 적용되었는지 확인
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('memories', 'memory_tags', 'memory_people', 'media_files')
ORDER BY tablename, policyname;