-- 앨범 테이블에 cover_image_id 외래 키 관계 설정
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 외래 키 제약 조건이 있다면 삭제 (있을 경우)
ALTER TABLE albums 
DROP CONSTRAINT IF EXISTS albums_cover_image_id_fkey;

-- 2. media_files 테이블과의 외래 키 관계 추가
ALTER TABLE albums
ADD CONSTRAINT albums_cover_image_id_fkey 
FOREIGN KEY (cover_image_id) 
REFERENCES media_files(id)
ON DELETE SET NULL;

-- 3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_albums_cover_image_id ON albums(cover_image_id);

-- 4. RLS 정책 확인 (media_files 테이블에 대한 읽기 권한)
-- 이미 있을 수 있으므로 IF NOT EXISTS 사용
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'media_files' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON media_files
        FOR SELECT USING (true);
    END IF;
END $$;
