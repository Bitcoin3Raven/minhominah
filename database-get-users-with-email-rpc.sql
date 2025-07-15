-- 사용자 목록을 이메일과 함께 가져오는 RPC 함수
-- Supabase 대시보드의 SQL Editor에서 실행하세요

CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 현재 사용자가 parent 역할인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only parent role can access this function';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    u.email
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;
