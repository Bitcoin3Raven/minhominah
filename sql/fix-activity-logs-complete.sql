-- activity_logs 테이블 완전 재구성
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 기존 activity_logs 테이블의 실제 구조 확인
DO $$
DECLARE
  v_table_exists boolean;
  v_has_resource_type boolean;
  v_has_entity_type boolean;
BEGIN
  -- 테이블 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    -- resource_type 컬럼 존재 확인
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'activity_logs' 
      AND column_name = 'resource_type'
    ) INTO v_has_resource_type;

    -- entity_type 컬럼 존재 확인
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'activity_logs' 
      AND column_name = 'entity_type'
    ) INTO v_has_entity_type;

    -- resource_type이 있고 entity_type이 없는 경우
    IF v_has_resource_type AND NOT v_has_entity_type THEN
      -- resource_type을 entity_type으로 이름 변경
      ALTER TABLE activity_logs RENAME COLUMN resource_type TO entity_type;
      RAISE NOTICE 'Renamed resource_type to entity_type';
    END IF;

    -- resource_id 컬럼도 같은 방식으로 처리
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'activity_logs' 
      AND column_name = 'resource_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'activity_logs' 
      AND column_name = 'entity_id'
    ) THEN
      ALTER TABLE activity_logs RENAME COLUMN resource_id TO entity_id;
      RAISE NOTICE 'Renamed resource_id to entity_id';
    END IF;

    -- NOT NULL 제약 조건 제거 (필요한 경우)
    ALTER TABLE activity_logs ALTER COLUMN entity_type DROP NOT NULL;
    ALTER TABLE activity_logs ALTER COLUMN entity_id DROP NOT NULL;
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

-- 3. 누락된 컬럼 추가
DO $$
BEGIN
  -- entity_type 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN entity_type text;
  END IF;

  -- entity_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN entity_id uuid;
  END IF;

  -- details 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'details'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN details jsonb;
  END IF;
END;
$$;

-- 4. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- 5. RLS 정책 설정
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

-- 6. log_activity 함수 재생성 (유연한 버전)
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
  -- 실제 컬럼명 확인 후 동적으로 처리
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name = 'resource_type'
  ) THEN
    -- resource_type 컬럼 사용
    EXECUTE format(
      'INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)',
      auth.uid(), p_action, p_entity_type, p_entity_id, p_details
    ) USING auth.uid(), p_action, p_entity_type, p_entity_id, p_details;
  ELSE
    -- entity_type 컬럼 사용
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 경고만 발생 (메인 작업 방해 방지)
    RAISE WARNING 'Failed to log activity: %', SQLERRM;
END;
$$;

-- 7. 삭제 트리거 확인 및 수정
-- memories 테이블의 삭제 트리거가 있는지 확인
DO $$
BEGIN
  -- 기존 트리거 삭제
  DROP TRIGGER IF EXISTS log_memory_delete ON memories;
  
  -- 새 트리거 함수 생성
  CREATE OR REPLACE FUNCTION log_memory_delete()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    -- log_activity 함수 호출
    PERFORM log_activity('deleted', 'memory', OLD.id, 
      jsonb_build_object('title', OLD.title));
    RETURN OLD;
  END;
  $trigger$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- 트리거 생성
  CREATE TRIGGER log_memory_delete
    BEFORE DELETE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION log_memory_delete();
END;
$$;

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE 'activity_logs 테이블 구조가 완전히 수정되었습니다.';
  RAISE NOTICE '이제 메모리 삭제가 정상 작동할 것입니다.';
END;
$$;