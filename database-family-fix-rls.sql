-- RLS 정책 무한 재귀 문제 해결
-- 기존 정책을 삭제하고 수정된 정책으로 교체합니다

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "가족 구성원 조회" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 관리" ON family_members;

-- 2. 수정된 정책 생성
-- 자기 자신의 정보나 같은 가족의 구성원 정보를 조회할 수 있도록 수정
CREATE POLICY "가족 구성원 조회" ON family_members
  FOR SELECT USING (
    -- 자기 자신의 정보는 항상 조회 가능
    user_id = auth.uid()
    OR
    -- 같은 가족 구성원의 정보 조회 가능 (서브쿼리 사용)
    EXISTS (
      SELECT 1 FROM family_members AS fm1
      JOIN family_members AS fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
      AND fm2.id = family_members.id
    )
  );

-- 부모 권한 정책도 수정
CREATE POLICY "부모 구성원 관리" ON family_members
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.role = 'parent'
      -- INSERT 시에는 family_id가 같은지 확인
      AND fm.family_id = family_members.family_id
    )
  );

CREATE POLICY "부모 구성원 수정" ON family_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.role = 'parent'
      AND fm.family_id = family_members.family_id
    )
  );

CREATE POLICY "부모 구성원 삭제" ON family_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.role = 'parent'
      AND fm.family_id = family_members.family_id
    )
    -- 자기 자신은 삭제할 수 없음
    AND family_members.user_id != auth.uid()
  );

-- 3. 간단한 테스트를 위한 임시 정책 (선택사항)
-- 개발 중에만 사용하고 프로덕션에서는 제거하세요
-- CREATE POLICY "임시 - 로그인한 사용자 모두 조회" ON family_members
--   FOR SELECT USING (auth.uid() IS NOT NULL);

-- 실행 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'RLS 정책이 성공적으로 수정되었습니다!';
END $$;