-- 가장 간단한 RLS 정책 - user_id 없이
-- 임시로 모든 인증된 사용자가 모든 작업을 할 수 있도록 설정

-- 1. memories 테이블 정책
DROP POLICY IF EXISTS "Anyone can read memories" ON memories;
DROP POLICY IF EXISTS "Authenticated users can insert memories" ON memories;
DROP POLICY IF EXISTS "Users can update own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;

CREATE POLICY "Anyone can read memories" ON memories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can do everything" ON memories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. media_files 테이블 정책
DROP POLICY IF EXISTS "Anyone can view media files" ON media_files;
DROP POLICY IF EXISTS "Authenticated users can insert media files" ON media_files;
DROP POLICY IF EXISTS "Users can delete own media files" ON media_files;

CREATE POLICY "Anyone can view media files" ON media_files
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage media files" ON media_files
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. memory_tags 테이블 정책
DROP POLICY IF EXISTS "Anyone can view memory tags" ON memory_tags;
DROP POLICY IF EXISTS "Authenticated users can insert memory tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can delete own memory tags" ON memory_tags;

CREATE POLICY "Anyone can view memory tags" ON memory_tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage memory tags" ON memory_tags
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. memory_people 테이블 정책
DROP POLICY IF EXISTS "Anyone can view memory people" ON memory_people;
DROP POLICY IF EXISTS "Authenticated users can insert memory people" ON memory_people;
DROP POLICY IF EXISTS "Users can delete own memory people" ON memory_people;

CREATE POLICY "Anyone can view memory people" ON memory_people
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage memory people" ON memory_people
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. RLS 활성화
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;

-- 6. 정책 확인
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('memories', 'media_files', 'memory_tags', 'memory_people')
ORDER BY tablename, policyname;