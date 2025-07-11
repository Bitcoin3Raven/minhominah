-- 가족 시스템 RLS 정책 간단 버전
-- 무한 재귀 문제를 피하기 위한 단순화된 정책

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "가족 구성원 그룹 조회" ON family_groups;
DROP POLICY IF EXISTS "그룹 생성자 수정 권한" ON family_groups;
DROP POLICY IF EXISTS "그룹 생성 권한" ON family_groups;
DROP POLICY IF EXISTS "가족 구성원 조회" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 관리" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 수정" ON family_members;
DROP POLICY IF EXISTS "부모 구성원 삭제" ON family_members;
DROP POLICY IF EXISTS "초대 목록 조회" ON family_invitations;
DROP POLICY IF EXISTS "부모 초대 생성" ON family_invitations;
DROP POLICY IF EXISTS "초대 상태 업데이트" ON family_invitations;

-- 2. family_groups 정책 (단순화)
-- 모든 로그인한 사용자가 자신이 속한 그룹 조회 가능
CREATE POLICY "family_groups_select" ON family_groups
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- 로그인한 사용자는 그룹 생성 가능
CREATE POLICY "family_groups_insert" ON family_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 그룹 생성자만 수정 가능
CREATE POLICY "family_groups_update" ON family_groups
  FOR UPDATE USING (created_by = auth.uid());

-- 3. family_members 정책 (단순화)
-- 자기 자신의 멤버십 정보는 항상 조회 가능
CREATE POLICY "family_members_select_own" ON family_members
  FOR SELECT USING (user_id = auth.uid());

-- 같은 가족의 다른 구성원 정보 조회 (JOIN 없이)
CREATE POLICY "family_members_select_family" ON family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- 부모만 구성원 추가 가능
CREATE POLICY "family_members_insert" ON family_members
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- 부모만 구성원 정보 수정 가능
CREATE POLICY "family_members_update" ON family_members
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- 부모만 구성원 삭제 가능 (자기 자신 제외)
CREATE POLICY "family_members_delete" ON family_members
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'parent'
    )
    AND user_id != auth.uid()
  );

-- 4. family_invitations 정책 (단순화)
-- 같은 가족의 초대 목록 조회 가능
CREATE POLICY "family_invitations_select_family" ON family_invitations
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- 초대받은 이메일 주소의 사용자는 자신의 초대 조회 가능
CREATE POLICY "family_invitations_select_own" ON family_invitations
  FOR SELECT USING (email = auth.email());

-- 부모만 초대 생성 가능
CREATE POLICY "family_invitations_insert" ON family_invitations
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- 초대받은 사람만 상태 업데이트 가능
CREATE POLICY "family_invitations_update" ON family_invitations
  FOR UPDATE USING (email = auth.email());

-- 실행 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '단순화된 RLS 정책이 적용되었습니다!';
END $$;