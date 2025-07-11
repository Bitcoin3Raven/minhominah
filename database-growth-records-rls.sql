-- growth_records 테이블 RLS 정책 설정
-- 403 오류 해결을 위한 정책 추가

-- 1. RLS 활성화
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "growth_records_select_all" ON growth_records;
DROP POLICY IF EXISTS "growth_records_insert_authenticated" ON growth_records;
DROP POLICY IF EXISTS "growth_records_update_authenticated" ON growth_records;
DROP POLICY IF EXISTS "growth_records_delete_authenticated" ON growth_records;

-- 3. 새로운 정책 생성

-- 3-1. 조회 정책: 모든 사용자가 성장 기록을 볼 수 있음
CREATE POLICY "growth_records_select_all" ON growth_records
  FOR SELECT 
  USING (true);

-- 3-2. 생성 정책: 로그인한 사용자는 누구나 성장 기록을 추가할 수 있음
CREATE POLICY "growth_records_insert_authenticated" ON growth_records
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 3-3. 수정 정책: 로그인한 사용자는 누구나 성장 기록을 수정할 수 있음
-- (가족 앱이므로 모든 가족 구성원이 수정 가능하도록 설정)
CREATE POLICY "growth_records_update_authenticated" ON growth_records
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL
  );

-- 3-4. 삭제 정책: 로그인한 사용자는 누구나 성장 기록을 삭제할 수 있음
CREATE POLICY "growth_records_delete_authenticated" ON growth_records
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL
  );

-- 4. 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'growth_records'
ORDER BY ordinal_position;

-- 5. 정책이 올바르게 적용되었는지 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'growth_records'
ORDER BY policyname;