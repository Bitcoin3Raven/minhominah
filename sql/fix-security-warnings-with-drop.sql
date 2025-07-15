-- Supabase 보안 경고 해결을 위한 SQL 스크립트 (함수 삭제 포함)
-- 기존 함수를 먼저 삭제하고 새로 생성합니다
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. auto_empty_trash 함수 재생성
DROP FUNCTION IF EXISTS public.auto_empty_trash();
CREATE FUNCTION public.auto_empty_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 30일 이상 된 휴지통 항목 삭제
  DELETE FROM memories 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- 2. log_activity 함수 재생성
DROP FUNCTION IF EXISTS public.log_activity(text, text, uuid, jsonb);
CREATE FUNCTION public.log_activity(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- 3. update_user_role 함수 재생성 (파라미터 이름 변경)
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text);
CREATE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 역할 유효성 검사
  IF new_role NOT IN ('parent', 'family', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- 호출자가 parent 역할인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only parent role can update user roles';
  END IF;
  
  -- 자기 자신의 역할은 변경할 수 없음
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  -- 역할 업데이트
  UPDATE profiles
  SET role = new_role,
      updated_at = NOW()
  WHERE id = target_user_id;
  
  -- 활동 로그 기록
  PERFORM log_activity('update_user_role', 'profile', target_user_id, 
    jsonb_build_object('new_role', new_role));
END;
$$;

-- 4. handle_new_user 함수 재생성
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at, role)
  VALUES (NEW.id, NOW(), NOW(), 'viewer');
  RETURN NEW;
END;
$$;

-- 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. create_invitation 함수 재생성
DROP FUNCTION IF EXISTS public.create_invitation(text, text);
CREATE FUNCTION public.create_invitation(
  p_invitee_email text,
  p_role text DEFAULT 'family'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_invitation_id uuid;
BEGIN
  -- 역할 유효성 검사
  IF p_role NOT IN ('parent', 'family', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- 권한 확인 (parent만 초대 가능)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Only parents can create invitations';
  END IF;
  
  -- 고유 토큰 생성
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- 초대 생성
  INSERT INTO invitations (
    inviter_id,
    invitee_email,
    token,
    role,
    expires_at
  )
  VALUES (
    auth.uid(),
    p_invitee_email,
    v_token,
    p_role,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_invitation_id;
  
  -- 결과 반환
  RETURN jsonb_build_object(
    'id', v_invitation_id,
    'token', v_token,
    'invitee_email', p_invitee_email,
    'role', p_role
  );
END;
$$;

-- 6. accept_invitation 함수 재생성
DROP FUNCTION IF EXISTS public.accept_invitation(text);
CREATE FUNCTION public.accept_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
BEGIN
  -- 토큰으로 초대 찾기
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
  AND expires_at > NOW()
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- 현재 사용자 ID
  v_user_id := auth.uid();
  
  -- 이메일 확인
  IF v_invitation.invitee_email != auth.email() THEN
    RAISE EXCEPTION 'This invitation is for a different email address';
  END IF;
  
  -- 초대 수락 처리
  UPDATE invitations
  SET accepted_at = NOW(),
      invitee_id = v_user_id
  WHERE id = v_invitation.id;
  
  -- 사용자 역할 업데이트
  UPDATE profiles
  SET role = v_invitation.role,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'role', v_invitation.role
  );
END;
$$;

-- 7. cleanup_expired_invitations 함수 재생성
DROP FUNCTION IF EXISTS public.cleanup_expired_invitations();
CREATE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM invitations
  WHERE expires_at < NOW()
  AND accepted_at IS NULL;
END;
$$;

-- 8. update_comment_updated_at 함수 재생성
DROP FUNCTION IF EXISTS public.update_comment_updated_at() CASCADE;
CREATE FUNCTION public.update_comment_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 트리거 재생성 (필요한 경우)
DROP TRIGGER IF EXISTS update_comment_updated_at ON comments;
CREATE TRIGGER update_comment_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_updated_at();

-- 9. generate_invitation_code 함수 재생성
DROP FUNCTION IF EXISTS public.generate_invitation_code();
CREATE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  -- 6자리 랜덤 코드 생성
  v_code := UPPER(substring(md5(random()::text), 1, 6));
  RETURN v_code;
END;
$$;

-- 10. generate_invitation_token 함수 재생성
DROP FUNCTION IF EXISTS public.generate_invitation_token();
CREATE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- 11. set_invitation_code 함수 재생성
DROP FUNCTION IF EXISTS public.set_invitation_code() CASCADE;
CREATE FUNCTION public.set_invitation_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$;

-- 12. add_creator_as_parent 함수 재생성
DROP FUNCTION IF EXISTS public.add_creator_as_parent() CASCADE;
CREATE FUNCTION public.add_creator_as_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 그룹 생성자를 parent 역할로 멤버 추가
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'parent');
  RETURN NEW;
END;
$$;

-- 13. set_invitation_token 함수 재생성
DROP FUNCTION IF EXISTS public.set_invitation_token() CASCADE;
CREATE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$;

-- 14. accept_family_invitation 함수 재생성
DROP FUNCTION IF EXISTS public.accept_family_invitation(text);
CREATE FUNCTION public.accept_family_invitation(
  p_invitation_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- 초대 코드로 유효한 초대 찾기
  SELECT * INTO v_invitation
  FROM family_invitations
  WHERE code = UPPER(p_invitation_code)
  AND expires_at > NOW()
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;
  
  -- 이미 가족 구성원인지 확인
  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = v_invitation.family_id
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this family';
  END IF;
  
  -- 초대 수락
  UPDATE family_invitations
  SET accepted_at = NOW(),
      invitee_id = v_user_id
  WHERE id = v_invitation.id;
  
  -- 가족 구성원으로 추가
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (v_invitation.family_id, v_user_id, v_invitation.role);
  
  RETURN jsonb_build_object(
    'success', true,
    'family_id', v_invitation.family_id,
    'role', v_invitation.role
  );
END;
$$;

-- 15. create_default_notification_settings 함수 재생성
DROP FUNCTION IF EXISTS public.create_default_notification_settings() CASCADE;
CREATE FUNCTION public.create_default_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- 16. get_users_with_email 함수 재생성
DROP FUNCTION IF EXISTS public.get_users_with_email();
CREATE FUNCTION public.get_users_with_email()
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
SET search_path = public
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

-- 17. get_my_family_info 함수 재생성
DROP FUNCTION IF EXISTS public.get_my_family_info();
CREATE FUNCTION public.get_my_family_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id uuid;
  v_family_info jsonb;
BEGIN
  -- 사용자가 속한 가족 찾기
  SELECT family_id INTO v_family_id
  FROM family_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_family_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 가족 정보 조회
  SELECT jsonb_build_object(
    'id', fg.id,
    'name', fg.name,
    'created_at', fg.created_at,
    'members', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'full_name', p.full_name,
          'role', fm.role,
          'joined_at', fm.joined_at
        )
      )
      FROM family_members fm
      JOIN profiles p ON p.id = fm.user_id
      WHERE fm.family_id = fg.id
    )
  ) INTO v_family_info
  FROM family_groups fg
  WHERE fg.id = v_family_id;
  
  RETURN v_family_info;
END;
$$;

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '모든 함수가 성공적으로 업데이트되었습니다. search_path 보안 문제가 해결되었습니다.';
END;
$$;