-- Albums 테이블 생성
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_albums_created_by ON albums(created_by);
CREATE INDEX idx_albums_created_at ON albums(created_at);
CREATE INDEX idx_albums_is_public ON albums(is_public);

-- RLS 활성화
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 1. 모든 사용자가 공개 앨범을 볼 수 있음
CREATE POLICY "Public albums are viewable by all" ON albums
  FOR SELECT USING (is_public = true);

-- 2. 사용자는 자신이 만든 앨범을 볼 수 있음
CREATE POLICY "Users can view own albums" ON albums
  FOR SELECT USING (auth.uid() = created_by);

-- 3. parent 역할 사용자는 모든 앨범을 볼 수 있음
CREATE POLICY "Parents can view all albums" ON albums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'parent'
    )
  );

-- 4. 사용자는 자신의 앨범을 생성할 수 있음
CREATE POLICY "Users can create albums" ON albums
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 5. 사용자는 자신이 만든 앨범을 수정할 수 있음
CREATE POLICY "Users can update own albums" ON albums
  FOR UPDATE USING (auth.uid() = created_by);

-- 6. 사용자는 자신이 만든 앨범을 삭제할 수 있음
CREATE POLICY "Users can delete own albums" ON albums
  FOR DELETE USING (auth.uid() = created_by);

-- Album-Memory 연결 테이블
CREATE TABLE IF NOT EXISTS album_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(album_id, memory_id)
);

-- 인덱스 생성
CREATE INDEX idx_album_memories_album_id ON album_memories(album_id);
CREATE INDEX idx_album_memories_memory_id ON album_memories(memory_id);

-- RLS 활성화
ALTER TABLE album_memories ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 1. 공개 앨범의 메모리는 모두가 볼 수 있음
CREATE POLICY "Public album memories are viewable" ON album_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE id = album_memories.album_id 
      AND is_public = true
    )
  );

-- 2. 사용자는 자신의 앨범의 메모리를 볼 수 있음
CREATE POLICY "Users can view own album memories" ON album_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE id = album_memories.album_id 
      AND created_by = auth.uid()
    )
  );

-- 3. parent 역할 사용자는 모든 앨범 메모리를 볼 수 있음
CREATE POLICY "Parents can view all album memories" ON album_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'parent'
    )
  );

-- 4. 앨범 소유자는 메모리를 추가할 수 있음
CREATE POLICY "Album owners can add memories" ON album_memories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE id = album_memories.album_id 
      AND created_by = auth.uid()
    )
  );

-- 5. 앨범 소유자는 메모리를 삭제할 수 있음
CREATE POLICY "Album owners can remove memories" ON album_memories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE id = album_memories.album_id 
      AND created_by = auth.uid()
    )
  );

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();