-- 최종 보안 경고 해결 스크립트
-- 완전히 함수를 삭제하고 다시 생성합니다
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. log_activity 함수 완전 재생성
DROP FUNCTION IF EXISTS public.log_activity(text, text, uuid, jsonb) CASCADE;

CREATE FUNCTION public.log_activity(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- activity_logs 테이블 존재 확인
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs'
  ) THEN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
  END IF;
END;
$$;

-- 2. create_invitation 함수 완전 재생성
DROP FUNCTION IF EXISTS public.create_invitation(text, text) CASCADE;

CREATE FUNCTION public.create_invitation(
  p_invitee_email text,
  p_role text DEFAULT 'family'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Only parents can create invitations';
  END IF;
  
  -- invitations 테이블 존재 확인
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations'
  ) THEN
    -- 테이블이 없으면 빈 결과 반환
    RETURN jsonb_build_object(
      'error', 'Invitations feature not available'
    );
  END IF;
  
  -- 고유 토큰 생성
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  -- 초대 생성
  INSERT INTO public.invitations (
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

-- 3. accept_invitation 함수 완전 재생성
DROP FUNCTION IF EXISTS public.accept_invitation(text) CASCADE;

CREATE FUNCTION public.accept_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- invitations 테이블 존재 확인
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations'
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Invitations feature not available'
    );
  END IF;

  -- 현재 사용자 정보
  v_user_id := auth.uid();
  
  -- 사용자 이메일 가져오기
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- 토큰으로 초대 찾기
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
  AND expires_at > NOW()
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- 이메일 확인
  IF v_invitation.invitee_email != v_user_email THEN
    RAISE EXCEPTION 'This invitation is for a different email address';
  END IF;
  
  -- 초대 수락 처리
  UPDATE public.invitations
  SET accepted_at = NOW(),
      invitee_id = v_user_id
  WHERE id = v_invitation.id;
  
  -- 사용자 역할 업데이트
  UPDATE public.profiles
  SET role = v_invitation.role,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'role', v_invitation.role
  );
END;
$$;

-- 4. 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.log_activity(text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '모든 보안 경고가 해결되었습니다. Supabase Security 탭을 새로고침하여 확인하세요.';
END;
$$;