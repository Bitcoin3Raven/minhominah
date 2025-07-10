-- 민호민아닷컴 가족 계정 시스템 데이터베이스 스키마
-- 2025-07-09 추가 기능

-- 가족 그룹 테이블
CREATE TABLE family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 가족 구성원 테이블
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'family',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 가족 초대 테이블
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

-- AI 태그 관련 컬럼 추가
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- memory_tags 테이블에 AI 관련 컬럼 추가
ALTER TABLE memory_tags ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);
ALTER TABLE memory_tags ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;

-- memories 테이블에 AI 분석 여부 컬럼 추가
ALTER TABLE memories ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT FALSE;

-- RLS (Row Level Security) 정책 설정
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- 가족 그룹 정책
-- 가족 구성원만 그룹 정보 조회 가능
CREATE POLICY "가족 구성원 그룹 조회" ON family_groups
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members WHERE family_id = id
    )
  );

-- 생성자만 그룹 수정 가능
CREATE POLICY "그룹 생성자 수정 권한" ON family_groups
  FOR UPDATE USING (created_by = auth.uid());

-- 로그인한 사용자는 그룹 생성 가능
CREATE POLICY "그룹 생성 권한" ON family_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 가족 구성원 정책
-- 같은 가족 구성원만 조회 가능
CREATE POLICY "가족 구성원 조회" ON family_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members fm WHERE fm.family_id = family_members.family_id
    )
  );

-- 부모만 구성원 추가/삭제 가능
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
-- 가족 구성원만 초대 목록 조회 가능
CREATE POLICY "초대 목록 조회" ON family_invitations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members WHERE family_id = family_invitations.family_id
    )
    OR email = auth.email()
  );

-- 부모만 초대 생성 가능
CREATE POLICY "부모 초대 생성" ON family_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = family_invitations.family_id
      AND user_id = auth.uid()
      AND role = 'parent'
    )
  );

-- 초대받은 사람만 상태 업데이트 가능
CREATE POLICY "초대 상태 업데이트" ON family_invitations
  FOR UPDATE USING (email = auth.email());

-- 함수: 초대 코드 생성
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FAM-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- 트리거: 가족 그룹 생성 시 초대 코드 자동 생성
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

-- 트리거: 가족 그룹 생성 시 생성자를 부모로 자동 추가
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

-- 함수: 초대 토큰 생성
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 트리거: 초대 생성 시 토큰 자동 생성
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

-- 함수: 초대 수락
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

-- 인덱스 생성
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_invitations_email ON family_invitations(email);
CREATE INDEX idx_family_invitations_token ON family_invitations(token);
CREATE INDEX idx_family_invitations_status ON family_invitations(status);

-- 뷰: 가족 구성원 상세 정보
CREATE OR REPLACE VIEW family_members_detailed AS
SELECT 
  fm.*,
  p.full_name,
  p.avatar_url,
  fg.name as family_name
FROM family_members fm
JOIN profiles p ON fm.user_id = p.id
JOIN family_groups fg ON fm.family_id = fg.id;

-- 권한 부여
GRANT SELECT ON family_members_detailed TO authenticated;
