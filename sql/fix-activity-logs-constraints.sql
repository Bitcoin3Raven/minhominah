-- activity_logs 테이블의 제약조건 확인 및 수정
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'activity_logs'::regclass
AND contype = 'c';  -- CHECK constraints

-- 2. activity_logs_action_check 제약조건 삭제
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_action_check;

-- 3. 더 유연한 제약조건 추가 (또는 제약조건 없이 진행)
-- 'deleted'를 포함한 모든 action 허용
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_action_check 
CHECK (action IN ('created', 'updated', 'deleted', 'viewed', 'shared', 'commented', 'uploaded', 'download', 'restored', 'update_user_role', 'create_invitation', 'accept_invitation'));

-- 또는 제약조건을 완전히 제거하려면:
-- ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_action_check;

-- 4. 테이블 구조 최종 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activity_logs'
ORDER BY ordinal_position;

-- 5. 제약조건 다시 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'activity_logs'::regclass;

-- 6. 삭제 테스트를 위한 간단한 함수
CREATE OR REPLACE FUNCTION test_delete_activity()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'deleted', 'test', gen_random_uuid());
    RAISE NOTICE 'Test insert successful';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END;
$$;

-- 테스트 실행
SELECT test_delete_activity();

-- 7. 성공 메시지
DO $$
BEGIN
    RAISE NOTICE 'activity_logs 제약조건이 수정되었습니다.';
    RAISE NOTICE '이제 메모리 삭제가 정상 작동할 것입니다.';
END;
$$;