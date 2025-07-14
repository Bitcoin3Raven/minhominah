-- 초대 기능을 위한 스키마

-- 1. invitations 테이블 생성
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'family', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- 3. RLS 정책
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- parent 역할을 가진 사용자만 초대 생성 가능
CREATE POLICY "Parents can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'parent'
    )
  );

-- parent 역할을 가진 사용자는 모든 초대 조회 가능
CREATE POLICY "Parents can view all invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'parent'
    )
  );

-- 초대받은 이메일 주소로 초대 조회 가능
CREATE POLICY "Users can view their invitations" ON public.invitations
  FOR SELECT USING (
    email = auth.jwt()->>'email'
  );

-- 4. 초대 생성 함수
CREATE OR REPLACE FUNCTION public.create_invitation(
  p_email VARCHAR,
  p_role VARCHAR,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  invitation_id UUID,
  invitation_token VARCHAR,
  invitation_expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_token VARCHAR;
  v_invitation_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- parent 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Only parents can create invitations';
  END IF;
  
  -- 이미 가입한 사용자인지 확인
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;
  
  -- 유효한 초대가 이미 있는지 확인
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE email = p_email 
    AND expires_at > NOW() 
    AND accepted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Valid invitation already exists for this email';
  END IF;
  
  -- 토큰 생성
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  
  -- 초대 생성
  INSERT INTO invitations (email, role, invited_by, token, expires_at)
  VALUES (p_email, p_role, auth.uid(), v_token, v_expires_at)
  RETURNING id INTO v_invitation_id;
  
  RETURN QUERY SELECT v_invitation_id, v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 초대 수락 함수
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token VARCHAR,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- 초대 정보 조회
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
  AND expires_at > NOW()
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- 이메일 확인
  IF v_invitation.email != auth.jwt()->>'email' THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;
  
  -- 프로필 업데이트
  UPDATE profiles
  SET role = v_invitation.role
  WHERE id = p_user_id;
  
  -- 초대 수락 처리
  UPDATE invitations
  SET accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 만료된 초대 정리 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM invitations
  WHERE expires_at < NOW()
  AND accepted_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
