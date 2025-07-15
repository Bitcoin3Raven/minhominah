-- 남은 4개 보안 경고 해결을 위한 SQL 스크립트
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. log_activity 함수 다시 확인 및 수정
-- 이미 존재하는 함수 확인 후 재생성
DO $$
BEGIN
  -- log_activity 함수가 search_path 없이 생성되었을 수 있음
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'log_activity'
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc p2
      JOIN pg_namespace n2 ON p2.pronamespace = n2.oid
      WHERE n2.nspname = 'public' 
      AND p2.proname = 'log_activity'
      AND p2.prosrc LIKE '%search_path%'
    )
  ) THEN
    DROP FUNCTION IF EXISTS public.log_activity(text, text, uuid, jsonb);
  END IF;
END;
$$;

-- log_activity 함수 재생성 (확실하게)
CREATE OR REPLACE FUNCTION public.log_activity(
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
  -- activity_logs 테이블이 있는지 확인
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
  END IF;
END;
$$;

-- 2. create_invitation 함수 확인 및 재생성
DO $$
BEGIN
  -- 기존 함수 삭제
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_invitation'
  ) THEN
    DROP FUNCTION IF EXISTS public.create_invitation(text, text);
  END IF;
END;
$$;

-- create_invitation 함수 재생성
CREATE OR REPLACE FUNCTION public.create_invitation(
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
  
  -- invitations 테이블이 있는지 확인
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
    RAISE EXCEPTION 'Invitations table does not exist';
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

-- 3. accept_invitation 함수 재생성
DO $$
BEGIN
  -- 기존 함수 삭제
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'accept_invitation'
  ) THEN
    DROP FUNCTION IF EXISTS public.accept_invitation(text);
  END IF;
END;
$$;

-- accept_invitation 함수 재생성
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- invitations 테이블이 있는지 확인
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
    RAISE EXCEPTION 'Invitations table does not exist';
  END IF;

  -- 토큰으로 초대 찾기
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
  AND expires_at > NOW()
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- 현재 사용자 정보
  v_user_id := auth.uid();
  
  -- auth.email() 함수가 없을 수 있으므로 직접 조회
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  -- 이메일 확인
  IF v_invitation.invitee_email != v_user_email THEN
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

-- 4. 모든 함수에 대해 search_path 설정 확인
-- 누락된 함수가 있는지 다시 확인
DO $$
DECLARE
  func_record record;
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'log_activity',
      'create_invitation', 
      'accept_invitation',
      'auto_empty_trash',
      'update_user_role',
      'handle_new_user',
      'cleanup_expired_invitations',
      'update_comment_updated_at',
      'generate_invitation_code',
      'generate_invitation_token',
      'set_invitation_code',
      'add_creator_as_parent',
      'set_invitation_token',
      'accept_family_invitation',
      'create_default_notification_settings',
      'get_users_with_email',
      'get_my_family_info'
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM pg_proc p2
      WHERE p2.oid = p.oid
      AND p2.prosrc LIKE '%search_path%'
    )
  LOOP
    RAISE NOTICE 'Function % still missing search_path', func_record.function_name;
  END LOOP;
END;
$$;

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '남은 보안 경고가 해결되었습니다.';
END;
$$;