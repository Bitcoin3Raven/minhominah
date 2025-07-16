-- 기존 메모리의 created_by 필드 업데이트
-- user_id 값을 created_by로 복사

-- 1. 현재 created_by가 NULL이고 user_id가 있는 메모리 확인
SELECT 
    id,
    title,
    user_id,
    created_by,
    created_at
FROM memories
WHERE created_by IS NULL 
    AND user_id IS NOT NULL
ORDER BY created_at DESC;

-- 2. created_by 필드 업데이트
UPDATE memories
SET created_by = user_id
WHERE created_by IS NULL 
    AND user_id IS NOT NULL;

-- 3. 업데이트 결과 확인
SELECT 
    id,
    title,
    user_id,
    created_by,
    created_at
FROM memories
ORDER BY created_at DESC
LIMIT 10;

-- 4. 권한 확인 (특정 사용자 ID로 테스트)
-- 사용자 ID를 실제 ID로 변경하세요
-- SELECT 
--     id,
--     title,
--     user_id,
--     created_by,
--     (created_by = 'YOUR-USER-ID-HERE') as is_owner
-- FROM memories
-- WHERE created_by = 'YOUR-USER-ID-HERE'
-- ORDER BY created_at DESC;
