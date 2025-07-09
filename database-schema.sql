-- 민호민아 성장앨범 데이터베이스 스키마

-- 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 추억/메모리 테이블
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인물 테이블
CREATE TABLE people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 미디어 파일 테이블
CREATE TABLE media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('image', 'video')),
  file_size INTEGER,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 추억-인물 연결 테이블
CREATE TABLE memory_people (
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, person_id)
);

-- 태그 테이블
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 추억-태그 연결 테이블
CREATE TABLE memory_tags (
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, tag_id)
);

-- 성장 기록 테이블
CREATE TABLE growth_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요 테이블 (NEW)
CREATE TABLE memory_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- 인덱스 생성
CREATE INDEX idx_memory_likes_memory_id ON memory_likes(memory_id);
CREATE INDEX idx_memory_likes_user_id ON memory_likes(user_id);

-- RLS 정책 설정
ALTER TABLE memory_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON memory_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON memory_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON memory_likes
  FOR DELETE USING (auth.uid() = user_id);
