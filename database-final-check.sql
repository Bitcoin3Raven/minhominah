-- 최종 데이터베이스 확인 및 설정

-- 1. memories 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'memories'
ORDER BY ordinal_position;

-- 2. user_id 컬럼이 없으면 추가
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. 트리거 함수 생성 (user_id 자동 설정)
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 트리거 생성
DROP TRIGGER IF EXISTS set_user_id_trigger ON memories;
CREATE TRIGGER set_user_id_trigger
BEFORE INSERT ON memories
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- 5. RLS 정책 재설정
DROP POLICY IF EXISTS "Enable read access for all users" ON memories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON memories;

CREATE POLICY "Enable read access for all users" ON memories
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON memories
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. RLS 활성화
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;

-- 7. 보안 경로 설정 (보안 경고 해결)
ALTER FUNCTION set_user_id() SET search_path = public;

-- 8. 최종 확인
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('memories', 'media_files')
ORDER BY tablename, policyname;