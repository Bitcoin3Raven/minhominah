-- user_id와 created_by 필드 중복 문제 해결
-- created_by 필드만 사용하도록 정리

-- 1. 현재 상태 확인
SELECT 
    COUNT(*) as total_memories,
    COUNT(user_id) as has_user_id,
    COUNT(created_by) as has_created_by,
    COUNT(CASE WHEN user_id IS NOT NULL AND created_by IS NULL THEN 1 END) as only_user_id,
    COUNT(CASE WHEN user_id IS NULL AND created_by IS NOT NULL THEN 1 END) as only_created_by,
    COUNT(CASE WHEN user_id = created_by THEN 1 END) as both_same,
    COUNT(CASE WHEN user_id != created_by THEN 1 END) as both_different
FROM memories;

-- 2. created_by가 NULL인 경우 user_id 값으로 채우기
UPDATE memories
SET created_by = user_id
WHERE created_by IS NULL AND user_id IS NOT NULL;

-- 3. 향후 user_id 필드를 사용하지 않도록 트리거 제거 (있는 경우)
DROP TRIGGER IF EXISTS set_user_id_trigger ON memories;
DROP FUNCTION IF EXISTS set_user_id();

-- 4. 결과 확인
SELECT id, title, user_id, created_by 
FROM memories 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. (옵션) 나중에 user_id 컬럼을 완전히 제거하려면:
-- ALTER TABLE memories DROP COLUMN user_id;
-- 단, 이 작업은 신중하게 진행해야 합니다. 먼저 모든 코드에서 user_id 참조를 제거한 후 실행하세요.

-- 6. RLS 정책이 created_by를 사용하는지 확인
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'memories'
ORDER BY policyname;
