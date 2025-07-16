-- 썸네일 경로 문제 해결
-- 존재하지 않는 썸네일 경로를 원본 파일 경로로 업데이트

-- 1. 현재 썸네일 경로 상태 확인
SELECT 
    id,
    file_path,
    thumbnail_path,
    file_type,
    memory_id
FROM media_files
WHERE thumbnail_path IS NOT NULL
    AND thumbnail_path LIKE 'thumbnails/%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. 잘못된 썸네일 경로를 원본 파일 경로로 업데이트
-- (thumbnails/로 시작하는 경로를 원본 경로로 변경)
UPDATE media_files
SET thumbnail_path = file_path
WHERE thumbnail_path LIKE 'thumbnails/%'
    AND file_type = 'image';

-- 3. 업데이트 결과 확인
SELECT 
    id,
    file_path,
    thumbnail_path,
    file_type
FROM media_files
WHERE file_type = 'image'
ORDER BY created_at DESC
LIMIT 10;

-- 4. 향후 업로드를 위한 대안:
-- 썸네일이 없는 경우 NULL로 설정하도록 수정
-- (이미 코드에서 수정했으므로 새로 업로드되는 이미지는 문제없음)
