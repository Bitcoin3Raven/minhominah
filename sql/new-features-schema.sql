-- 휴지통 기능을 위한 테이블
CREATE TABLE deleted_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE NOT NULL,
  location TEXT,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  restore_by DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  metadata JSONB, -- 원본 데이터 백업
  created_at TIMESTAMP WITH TIME ZONE
);

-- 활동 로그 테이블
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'bulk_delete', 'share')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('memory', 'media', 'tag', 'album')),
  resource_id UUID,
  resource_title TEXT,
  changes JSONB, -- 변경사항 상세
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앨범/컬렉션 테이블
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앨범-추억 연결 테이블
CREATE TABLE album_memories (
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (album_id, memory_id)
);

-- 버전 관리 테이블
CREATE TABLE memory_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  changes JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_deleted_memories_restore_by ON deleted_memories(restore_by);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_albums_created_by ON albums(created_by);

-- RLS 정책
ALTER TABLE deleted_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_versions ENABLE ROW LEVEL SECURITY;

-- 휴지통은 생성자만 접근 가능
CREATE POLICY "휴지통 접근 권한" ON deleted_memories
  FOR ALL USING (deleted_by = auth.uid());

-- 활동 로그는 가족 구성원만 조회 가능
CREATE POLICY "활동 로그 조회" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('parent', 'family')
    )
  );

-- 앨범은 공개이거나 가족 구성원인 경우 조회 가능
CREATE POLICY "앨범 조회" ON albums
  FOR SELECT USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('parent', 'family')
    )
  );

-- 자동 휴지통 비우기 함수
CREATE OR REPLACE FUNCTION auto_empty_trash()
RETURNS void AS $$
BEGIN
  DELETE FROM deleted_memories 
  WHERE restore_by < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 매일 실행할 크론잡 (Supabase Edge Functions 사용)
-- SELECT cron.schedule('empty-trash', '0 0 * * *', 'SELECT auto_empty_trash();');
