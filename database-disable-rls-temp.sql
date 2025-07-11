-- 임시로 RLS를 비활성화하여 테스트
-- 주의: 이것은 개발/테스트용입니다. 프로덕션에서는 사용하지 마세요!

-- 1. RLS 비활성화
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people DISABLE ROW LEVEL SECURITY;

-- 2. 확인
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('memories', 'media_files', 'memory_tags', 'memory_people')
AND schemaname = 'public';

-- 나중에 다시 활성화하려면:
-- ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;