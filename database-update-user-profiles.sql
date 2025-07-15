-- 관리자 페이지에서 "이름 없음" 문제를 해결하기 위한 SQL
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 사용자 정보 확인
SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 2. 사용자 정보 업데이트 (예시)
-- 아래 값들을 실제 사용자 정보로 변경하세요

-- thaiholiccom@gmail.com 사용자 업데이트
UPDATE profiles 
SET 
    full_name = '관리자',
    username = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'thaiholiccom@gmail.com');

-- ployminhominah@gmail.com 사용자 업데이트
UPDATE profiles 
SET 
    full_name = 'Ploy',
    username = 'ploy'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ployminhominah@gmail.com');

-- 3. 업데이트 후 확인
SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;
