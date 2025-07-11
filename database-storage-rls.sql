-- Supabase Storage RLS 정책 설정
-- media 버킷에 대한 접근 권한 설정

-- 1. 먼저 기존 정책들을 확인
-- SELECT * FROM storage.buckets WHERE name = 'media';

-- 2. media 버킷의 공개 설정 확인 및 수정
UPDATE storage.buckets
SET public = false
WHERE name = 'media';

-- 3. 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can upload their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view public media files" ON storage.objects;

-- 4. 사용자가 자신의 미디어 파일을 업로드할 수 있도록 허용
CREATE POLICY "Users can upload their own media files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. 사용자가 자신의 미디어 파일을 볼 수 있도록 허용
CREATE POLICY "Users can view their own media files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- 6. 사용자가 자신의 미디어 파일을 수정할 수 있도록 허용
CREATE POLICY "Users can update their own media files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- 7. 사용자가 자신의 미디어 파일을 삭제할 수 있도록 허용
CREATE POLICY "Users can delete their own media files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'memories' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- 8. 공개된 추억의 미디어 파일은 누구나 볼 수 있도록 허용
-- 주의: is_public 컬럼이 없는 경우 이 정책을 제거하거나 수정하세요
-- CREATE POLICY "Public can view public media files"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (
--     bucket_id = 'media' AND
--     EXISTS (
--         SELECT 1 FROM media_files mf
--         JOIN memories m ON mf.memory_id = m.id
--         WHERE mf.file_path = name
--         AND m.is_public = true
--     )
-- );

-- 8. 대신 인증된 사용자가 모든 미디어 파일을 볼 수 있도록 임시 정책 추가
CREATE POLICY "Authenticated users can view all media files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'media'
);

-- 9. Storage 버킷 정책 활성화 확인
-- RLS가 활성화되어 있어야 정책이 작동합니다
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 참고: 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요
-- 실행 후 Storage 탭에서 정책이 제대로 적용되었는지 확인하세요