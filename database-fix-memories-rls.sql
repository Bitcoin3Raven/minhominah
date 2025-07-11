-- memories 테이블 RLS 정책 수정
-- 추억 저장 시 발생하는 RLS 정책 오류 해결

-- 1. 현재 memories 테이블의 모든 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'memories';

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view memories" ON memories;
DROP POLICY IF EXISTS "Authenticated users can create memories" ON memories;
DROP POLICY IF EXISTS "Users can update own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;

-- 3. 새로운 정책 생성 (더 간단하고 명확하게)

-- 3-1. 조회 정책: 모든 사용자가 모든 추억을 볼 수 있음
CREATE POLICY "memories_select_all" ON memories
  FOR SELECT 
  USING (true);

-- 3-2. 생성 정책: 로그인한 사용자는 누구나 추억을 생성할 수 있음
CREATE POLICY "memories_insert_authenticated" ON memories
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 3-3. 수정 정책: 자신이 생성한 추억만 수정 가능
CREATE POLICY "memories_update_own" ON memories
  FOR UPDATE 
  USING (
    auth.uid() = created_by
  );

-- 3-4. 삭제 정책: 자신이 생성한 추억만 삭제 가능
CREATE POLICY "memories_delete_own" ON memories
  FOR DELETE 
  USING (
    auth.uid() = created_by
  );

-- 4. RLS 활성화 확인
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 5. 테이블 구조 확인 (created_by 컬럼이 있는지 확인)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'memories' 
AND column_name = 'created_by';

-- 6. created_by 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'memories' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE memories ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 7. 관련 테이블들의 RLS 정책도 확인 및 수정

-- memory_people 테이블
DROP POLICY IF EXISTS "Anyone can view memory people" ON memory_people;
DROP POLICY IF EXISTS "Memory creators can manage people" ON memory_people;

CREATE POLICY "memory_people_select_all" ON memory_people
  FOR SELECT USING (true);

CREATE POLICY "memory_people_insert" ON memory_people
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_people.memory_id 
      AND memories.created_by = auth.uid()
    )
  );

CREATE POLICY "memory_people_delete" ON memory_people
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_people.memory_id 
      AND memories.created_by = auth.uid()
    )
  );

-- media_files 테이블
DROP POLICY IF EXISTS "Anyone can view media files" ON media_files;
DROP POLICY IF EXISTS "Memory creators can insert media files" ON media_files;
DROP POLICY IF EXISTS "Memory creators can delete media files" ON media_files;

CREATE POLICY "media_files_select_all" ON media_files
  FOR SELECT USING (true);

CREATE POLICY "media_files_insert" ON media_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = media_files.memory_id 
      AND memories.created_by = auth.uid()
    )
  );

CREATE POLICY "media_files_delete" ON media_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = media_files.memory_id 
      AND memories.created_by = auth.uid()
    )
  );

-- 8. RLS 활성화
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- 9. 정책이 올바르게 적용되었는지 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('memories', 'memory_people', 'media_files')
ORDER BY tablename, policyname;