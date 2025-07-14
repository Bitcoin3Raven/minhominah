-- RLS 정책 무한 재귀 문제 해결

-- 1. profiles 테이블의 중복된 정책 삭제
DROP POLICY IF EXISTS "사용자는 자신의 프로필을 볼 수 있음" ON profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필을 수정할 수 있음" ON profiles;
DROP POLICY IF EXISTS "Parents can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 2. profiles 테이블에 단순한 정책만 남기기
-- 모든 사용자가 프로필을 볼 수 있도록 허용 (순환 참조 제거)
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Enable update for users based on id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. memories 테이블 - 기존 정책은 유지하되 중복 제거
-- 이미 적절한 정책들이 있으므로 추가 작업 불필요

-- 4. media_files 테이블 - 기존 정책은 유지하되 중복 제거
-- 이미 적절한 정책들이 있으므로 추가 작업 불필요

-- 5. people 테이블 - 중복 정책 제거
DROP POLICY IF EXISTS "가족 구성원은 인물 정보를 볼 수 있음" ON people;
-- "Allow public read access" 정책은 유지

-- 6. tags 테이블 - 중복 정책 제거
DROP POLICY IF EXISTS "가족 구성원은 태그를 볼 수 있음" ON tags;
-- "Anyone can view tags"와 "Authenticated users can create tags" 정책은 유지

-- 7. memory_people 테이블 - 중복 정책 제거
DROP POLICY IF EXISTS "Anyone can view memory_people" ON memory_people;
DROP POLICY IF EXISTS "Memory creators can delete memory_people" ON memory_people;
DROP POLICY IF EXISTS "Memory creators can insert memory_people" ON memory_people;
-- 나머지 정책은 유지

-- 8. memory_tags 테이블 - 중복 정책 제거
DROP POLICY IF EXISTS "Anyone can view memory tags" ON memory_tags;
DROP POLICY IF EXISTS "Memory creators can delete memory tags" ON memory_tags;
DROP POLICY IF EXISTS "Memory creators can insert memory tags" ON memory_tags;

-- 9. 모든 테이블의 RLS가 활성화되어 있는지 확인
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;