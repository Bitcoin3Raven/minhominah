-- activity_logs 테이블 구조 수정
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 activity_logs 테이블 구조 확인 및 수정
DO $$
BEGIN
  -- entity_type 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN entity_type text;
  END IF;

  -- entity_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN entity_id uuid;
  END IF;

  -- details 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'details'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN details jsonb;
  END IF;
END;
$$;

-- 2. activity_logs 테이블이 없는 경우 생성
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- 4. RLS 정책 설정
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;
DROP POLICY IF EXISTS "Parents can view all activities" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activities" ON activity_logs;

-- 새 정책 생성
CREATE POLICY "Users can view their own activities" ON activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view all activities" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'parent'
    )
  );

CREATE POLICY "System can insert activities" ON activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. log_activity 함수 재생성 (안전한 버전)
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
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 무시 (로깅 실패가 메인 작업을 방해하지 않도록)
    RAISE WARNING 'Failed to log activity: %', SQLERRM;
END;
$$;

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE 'activity_logs 테이블이 수정되었습니다. 이제 삭제 기능이 정상 작동할 것입니다.';
END;
$$;