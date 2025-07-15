-- 메모리 삭제 권한 문제 해결
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 옵션 1: 사용자 역할을 'parent'로 변경 (권장)
-- 아래 이메일을 실제 사용자 이메일로 변경하세요
UPDATE profiles 
SET role = 'parent' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'thaiholiccom@gmail.com');

-- 옵션 2: RLS 정책을 수정하여 created_by만 확인하도록 변경
-- (모든 사용자가 자신의 메모리를 삭제할 수 있게 됨)
/*
-- 기존 정책 삭제
DROP POLICY IF EXISTS "memories_delete_own" ON memories;
DROP POLICY IF EXISTS "부모만 추억을 삭제할 수 있음" ON memories;

-- 새로운 정책 생성 (created_by만 확인)
CREATE POLICY "memories_delete_own" ON memories
FOR DELETE USING (auth.uid() = created_by);
*/

-- 현재 사용자 역할 확인
SELECT 
    u.email,
    p.role,
    p.id
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'thaiholiccom@gmail.com';
