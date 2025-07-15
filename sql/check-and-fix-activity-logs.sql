-- activity_logs 테이블 구조 확인 및 수정
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activity_logs'
ORDER BY ordinal_position;

-- 2. 모든 트리거 확인
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'memories'::regclass;

-- 3. 테이블 구조를 강제로 수정
-- resource_type과 entity_type이 모두 있는 경우 처리
DO $$
BEGIN
    -- 기존 컬럼이 둘 다 있는지 확인
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'resource_type'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'entity_type'
    ) THEN
        -- resource_type의 데이터를 entity_type으로 복사
        UPDATE activity_logs 
        SET entity_type = resource_type 
        WHERE entity_type IS NULL AND resource_type IS NOT NULL;
        
        -- resource_type 컬럼 삭제
        ALTER TABLE activity_logs DROP COLUMN resource_type CASCADE;
    END IF;
    
    -- resource_id와 entity_id도 동일하게 처리
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'resource_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'entity_id'
    ) THEN
        -- resource_id의 데이터를 entity_id로 복사
        UPDATE activity_logs 
        SET entity_id = resource_id 
        WHERE entity_id IS NULL AND resource_id IS NOT NULL;
        
        -- resource_id 컬럼 삭제
        ALTER TABLE activity_logs DROP COLUMN resource_id CASCADE;
    END IF;
END;
$$;

-- 4. 모든 관련 트리거 삭제 및 재생성
DROP TRIGGER IF EXISTS log_memory_delete ON memories CASCADE;
DROP TRIGGER IF EXISTS after_memory_delete ON memories CASCADE;
DROP TRIGGER IF EXISTS before_memory_delete ON memories CASCADE;

-- 5. 트리거 함수 재생성
CREATE OR REPLACE FUNCTION log_memory_delete()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- entity_type/entity_id 사용
    INSERT INTO activity_logs (
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        details
    ) VALUES (
        auth.uid(), 
        'deleted', 
        'memory', 
        OLD.id,
        jsonb_build_object('title', OLD.title)
    );
    RETURN OLD;
END;
$$;

-- 6. 새 트리거 생성
CREATE TRIGGER log_memory_delete
    AFTER DELETE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION log_memory_delete();

-- 7. log_activity 함수도 다시 생성
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
    -- entity_type/entity_id만 사용
    INSERT INTO activity_logs (
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        details
    )
    VALUES (
        auth.uid(), 
        p_action, 
        p_entity_type, 
        p_entity_id, 
        p_details
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to log activity: %', SQLERRM;
END;
$$;

-- 8. 최종 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activity_logs'
ORDER BY ordinal_position;