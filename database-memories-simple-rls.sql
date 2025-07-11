-- memories 관련 테이블의 간단한 RLS 정책 설정
-- Storage 권한 문제로 인해 데이터베이스 테이블만 설정

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "memories_select_policy" ON memories;
DROP POLICY IF EXISTS "memories_insert_policy" ON memories;
DROP POLICY IF EXISTS "memories_update_policy" ON memories;
DROP POLICY IF EXISTS "memories_delete_policy" ON memories;

-- 2. memories 테이블 - 간단한 정책
CREATE POLICY "Anyone can read memories" ON memories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);

-- 3. media_files 테이블 정책
DROP POLICY IF EXISTS "media_files_select_policy" ON media_files;
DROP POLICY IF EXISTS "media_files_insert_policy" ON media_files;
DROP POLICY IF EXISTS "media_files_delete_policy" ON media_files;

CREATE POLICY "Anyone can view media files" ON media_files
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert media files" ON media_files
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM memories WHERE id = media_files.memory_id
    )
  );

CREATE POLICY "Users can delete own media files" ON media_files
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM memories WHERE id = media_files.memory_id
    )
  );

-- 4. memory_tags 테이블 정책
DROP POLICY IF EXISTS "memory_tags_select_policy" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_insert_policy" ON memory_tags;
DROP POLICY IF EXISTS "memory_tags_delete_policy" ON memory_tags;

CREATE POLICY "Anyone can view memory tags" ON memory_tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert memory tags" ON memory_tags
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM memories WHERE id = memory_tags.memory_id
    )
  );

CREATE POLICY "Users can delete own memory tags" ON memory_tags
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM memories WHERE id = memory_tags.memory_id
    )
  );

-- 5. memory_people 테이블 정책
DROP POLICY IF EXISTS "memory_people_select_policy" ON memory_people;
DROP POLICY IF EXISTS "memory_people_insert_policy" ON memory_people;
DROP POLICY IF EXISTS "memory_people_delete_policy" ON memory_people;

CREATE POLICY "Anyone can view memory people" ON memory_people
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert memory people" ON memory_people
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM memories WHERE id = memory_people.memory_id
    )
  );

CREATE POLICY "Users can delete own memory people" ON memory_people
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM memories WHERE id = memory_people.memory_id
    )
  );

-- 6. RLS 활성화
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;

-- 7. 정책 확인
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('memories', 'media_files', 'memory_tags', 'memory_people')
ORDER BY tablename, policyname;