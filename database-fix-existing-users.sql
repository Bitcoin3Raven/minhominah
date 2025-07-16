-- 기존 profiles 레코드가 없는 사용자들을 위한 profiles 생성
INSERT INTO profiles (id, username, full_name, role)
SELECT 
    u.id,
    split_part(u.email, '@', 1) as username,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    'viewer' as role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 기존 사용자 중 이름이 없는 경우 이메일의 앞부분으로 설정
UPDATE profiles 
SET username = split_part(u.email, '@', 1),
    full_name = COALESCE(full_name, split_part(u.email, '@', 1))
FROM auth.users u
WHERE profiles.id = u.id 
  AND (profiles.username IS NULL OR profiles.full_name IS NULL);

-- 특정 사용자의 정보를 수동으로 업데이트하려면 아래 쿼리 사용
-- UPDATE profiles 
-- SET full_name = '홍길동', 
--     username = 'gildong'
-- WHERE id = '사용자-UUID';

-- 현재 사용자 목록 확인
SELECT 
    p.id,
    u.email,
    p.username,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;