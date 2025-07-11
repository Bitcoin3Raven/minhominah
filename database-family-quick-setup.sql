-- 가족 시스템 테이블 빠른 설정
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 기존 테이블이 있다면 삭제 (주의: 데이터가 삭제됩니다)
DROP TABLE IF EXISTS family_invitations CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS family_groups CASCADE;

-- 2. 가족 그룹 테이블 생성
CREATE TABLE family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 가족 구성원 테이블 생성
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'family',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 4. 가족 초대 테이블 생성
CREATE TABLE family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'family',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- 5. RLS 활성화
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성
-- 가족 그룹 정책
CREATE POLICY "가족 구성원 그룹 조회" ON family_groups
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members WHERE family_id = id
    )
  );

CREATE POLICY "그룹 생성자 수정 권한" ON family_groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "그룹 생성 권한" ON family_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 가족 구성원 정책
CREATE POLICY "가족 구성원 조회" ON family_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members fm WHERE fm.family_id = family_members.family_id
    )
  );

CREATE POLICY "부모 구성원 관리" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );

-- 초대 정책
CREATE POLICY "초대 목록 조회" ON family_invitations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members WHERE family_id = family_invitations.family_id
    )
    OR email = auth.email()
  );

CREATE POLICY "부모 초대 생성" ON family_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = family_invitations.family_id
      AND user_id = auth.uid()
      AND role = 'parent'
    )
  );

CREATE POLICY "초대 상태 업데이트" ON family_invitations
  FOR UPDATE USING (email = auth.email());

-- 7. 함수 생성
-- 초대 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FAM-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- 초대 토큰 생성 함수
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 생성
-- 가족 그룹 생성 시 초대 코드 자동 생성
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_groups_invitation_code
  BEFORE INSERT ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_code();

-- 가족 그룹 생성 시 생성자를 부모로 자동 추가
CREATE OR REPLACE FUNCTION add_creator_as_parent()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'parent');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_groups_add_creator
  AFTER INSERT ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_parent();

-- 초대 생성 시 토큰 자동 생성
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := generate_invitation_token();
  END IF;
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_invitations_token
  BEFORE INSERT ON family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_token();

-- 9. 인덱스 생성
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_invitations_email ON family_invitations(email);
CREATE INDEX idx_family_invitations_token ON family_invitations(token);
CREATE INDEX idx_family_invitations_status ON family_invitations(status);

-- 10. 초대 수락 함수
CREATE OR REPLACE FUNCTION accept_family_invitation(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation family_invitations%ROWTYPE;
BEGIN
  -- 초대 정보 조회
  SELECT * INTO v_invitation
  FROM family_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW()
    AND email = auth.email();

  -- 초대가 유효하지 않으면 false 반환
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 이미 가족 구성원인지 확인
  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = v_invitation.family_id
      AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;

  -- 가족 구성원으로 추가
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (v_invitation.family_id, auth.uid(), v_invitation.role);

  -- 초대 상태 업데이트
  UPDATE family_invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 실행 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '가족 시스템 테이블이 성공적으로 생성되었습니다!';
END $$;