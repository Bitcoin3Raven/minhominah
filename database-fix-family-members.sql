-- family_members 테이블 500 오류 해결
-- RLS 정책 문제를 디버깅하고 수정합니다

-- 1. 현재 모든 정책 확인 (디버깅용)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'family_members';

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "가족 구성원 조회" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 관리" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 수정" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 삭제" ON family_members;
DROP POLICY IF EXISTS "family_members_select_own" ON family_members;
DROP POLICY IF EXISTS "family_members_select_family" ON family_members;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "family_members_update" ON family_members;
DROP POLICY IF EXISTS "family_members_delete" ON family_members;

-- 3. 간단하고 안전한 새 정책 생성
-- 자기 자신의 멤버십만 조회 (가장 기본적인 정책)
CREATE POLICY "own_membership_select" ON family_members
  FOR SELECT USING (user_id = auth.uid());

-- 같은 가족의 멤버십 조회 (서브쿼리 사용)
CREATE POLICY "same_family_select" ON family_members
  FOR SELECT USING (
    family_id IN (
      SELECT DISTINCT family_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- 부모 권한으로 멤버 추가
CREATE POLICY "parent_insert" ON family_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM family_members 
      WHERE user_id = auth.uid() 
      AND role = 'parent'
      AND family_id = family_members.family_id
    )
  );

-- 부모 권한으로 멤버 수정
CREATE POLICY "parent_update" ON family_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM family_members fm
      WHERE fm.user_id = auth.uid() 
      AND fm.role = 'parent'
      AND fm.family_id = family_members.family_id
    )
  );

-- 부모 권한으로 멤버 삭제 (자기 자신은 제외)
CREATE POLICY "parent_delete" ON family_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 
      FROM family_members fm
      WHERE fm.user_id = auth.uid() 
      AND fm.role = 'parent'
      AND fm.family_id = family_members.family_id
    )
    AND user_id != auth.uid()
  );

-- 4. 테스트를 위한 임시 디버그 정책 (선택사항)
-- 주의: 프로덕션에서는 반드시 제거하세요!
-- CREATE POLICY "debug_select_all" ON family_members
--   FOR SELECT USING (true);

-- 5. 현재 사용자의 가족 정보를 안전하게 조회하는 함수
CREATE OR REPLACE FUNCTION get_my_family_info()
RETURNS TABLE (
  member_id UUID,
  family_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as member_id,
    family_members.family_id,
    family_members.user_id,
    family_members.role,
    family_members.joined_at
  FROM family_members
  WHERE family_members.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 실행 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'family_members RLS 정책이 수정되었습니다!';
END $$;