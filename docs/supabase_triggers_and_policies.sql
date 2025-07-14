-- 프로필 자동 생성 트리거
-- 새 사용자가 가입하면 자동으로 profiles 테이블에 기본 프로필 생성

-- 1. 프로필 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    'viewer'  -- 기본 역할은 viewer
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. auth.users 테이블에 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. profiles 테이블에 대한 RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정할 수 있음  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- parent 역할을 가진 사용자는 모든 프로필을 볼 수 있음
CREATE POLICY "Parents can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'parent'
    )
  );

-- 4. 활동 로그 자동 생성 함수 수정
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger AS $$
BEGIN
  -- 메모리 생성
  IF TG_TABLE_NAME = 'memories' AND TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.created_by, 'created', 'memory', NEW.id, 
            jsonb_build_object('title', NEW.title));
  
  -- 메모리 수정
  ELSIF TG_TABLE_NAME = 'memories' AND TG_OP = 'UPDATE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'updated', 'memory', NEW.id, 
            jsonb_build_object('title', NEW.title));
  
  -- 메모리 삭제
  ELSIF TG_TABLE_NAME = 'memories' AND TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'deleted', 'memory', OLD.id, 
            jsonb_build_object('title', OLD.title));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 역할 기반 권한 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS void AS $$
BEGIN
  -- role은 'parent', 'family', 'viewer' 중 하나여야 함
  IF new_role NOT IN ('parent', 'family', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- parent 역할을 가진 사용자만 다른 사용자의 역할을 변경할 수 있음
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Only parents can update user roles';
  END IF;
  
  UPDATE profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
