-- 개발 중 임시로 RLS 비활성화 (보안 주의!)
-- 프로덕션에서는 절대 사용하지 마세요!

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE people DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people DISABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash DISABLE ROW LEVEL SECURITY;