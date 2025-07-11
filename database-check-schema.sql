-- memories 테이블의 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'memories'
ORDER BY ordinal_position;

-- media_files 테이블의 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'media_files'
ORDER BY ordinal_position;