-- 간단한 Supabase Storage RLS 정책 설정
-- 먼저 이 파일을 실행한 후, 문제가 해결되면 더 복잡한 정책을 적용하세요

-- 1. media 버킷 설정
UPDATE storage.buckets
SET public = false
WHERE name = 'media';

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can upload their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view public media files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all media files" ON storage.objects;

-- 3. 간단한 정책 설정 - 인증된 사용자는 모든 작업 가능
CREATE POLICY "Authenticated users can do everything"
ON storage.objects 
FOR ALL
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- 4. RLS 활성화
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 5. 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects';