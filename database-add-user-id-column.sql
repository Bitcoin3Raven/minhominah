-- memories 테이블에 user_id 컬럼 추가

-- 1. 먼저 현재 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memories'
ORDER BY ordinal_position;

-- 2. user_id 컬럼이 없으면 추가
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. 기존 데이터가 있다면 created_by 값을 user_id로 복사 (created_by가 있는 경우)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'memories' 
        AND column_name = 'created_by'
    ) THEN
        UPDATE memories 
        SET user_id = created_by 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- 4. 현재 로그인한 사용자의 추억에 user_id 설정 (임시)
-- 필요한 경우 주석 해제
 "/mnt/c/Users/thaih/Downloads/2025-07-11 213346.png"
-- UPDATE memories 
-- SET user_id = auth.uid() 
-- WHERE user_id IS NULL;

-- 5. 향후 추가되는 추억에 자동으로 user_id 설정
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_id_trigger ON memories;
CREATE TRIGGER set_user_id_trigger
BEFORE INSERT ON memories
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- 6. 테이블 구조 다시 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memories'
ORDER BY ordinal_position;