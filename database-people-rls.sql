-- people 테이블 RLS 정책 설정
-- 민호민아 성장앨범용

-- 1. 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Allow public read access" ON people;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON people;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON people;

-- 2. people 테이블에 대한 공개 읽기 권한 부여
-- 나이별 필터링을 위해 모든 사용자가 people 데이터를 읽을 수 있도록 허용
CREATE POLICY "Allow public read access" 
ON people 
FOR SELECT 
TO public 
USING (true);

-- 3. 인증된 사용자만 추가/수정 가능
CREATE POLICY "Allow authenticated users to insert" 
ON people 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update" 
ON people 
FOR UPDATE 
TO authenticated 
USING (true);

-- 4. RLS 활성화 확인
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- 5. 테스트 쿼리
-- 이 쿼리를 실행해서 데이터가 보이는지 확인
SELECT * FROM people;
