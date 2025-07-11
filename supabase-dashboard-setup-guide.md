# Supabase 대시보드 설정 가이드

## 1. Storage 정책 설정

### 1.1 Supabase 대시보드 접속
1. https://app.supabase.com 로그인
2. 해당 프로젝트 선택

### 1.2 Storage 버킷 설정
1. 왼쪽 메뉴에서 **Storage** 클릭
2. **media** 버킷 찾기 (없으면 "New bucket" 클릭하여 생성)
3. media 버킷 옆의 **점 3개 메뉴(⋮)** 클릭
4. **Policies** 선택

### 1.3 Storage 정책 추가

#### 방법 1: 템플릿 사용 (권장)
1. **New Policy** 버튼 클릭
2. **For full customization** 선택
3. 다음 4개의 정책을 각각 추가:

##### 정책 1: 업로드 허용
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated` 선택
- **USING expression**: 비워두기
- **WITH CHECK expression**:
```sql
bucket_id = 'media' AND auth.role() = 'authenticated'
```

##### 정책 2: 조회 허용
- **Policy name**: `Allow authenticated downloads`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated` 선택
- **USING expression**:
```sql
bucket_id = 'media'
```
- **WITH CHECK expression**: 비워두기

##### 정책 3: 수정 허용
- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated` 선택
- **USING expression**:
```sql
bucket_id = 'media' AND auth.role() = 'authenticated'
```
- **WITH CHECK expression**:
```sql
bucket_id = 'media'
```

##### 정책 4: 삭제 허용
- **Policy name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated` 선택
- **USING expression**:
```sql
bucket_id = 'media' AND auth.role() = 'authenticated'
```
- **WITH CHECK expression**: 비워두기

#### 방법 2: 빠른 설정 (임시)
1. media 버킷의 점 3개 메뉴 클릭
2. **Edit bucket** 선택
3. **Public bucket** 토글을 켜기 (주의: 보안상 임시로만 사용)

## 2. Database RLS 정책 설정 (SQL Editor 사용)

### 2.1 SQL Editor 접속
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭

### 2.2 memories 테이블 구조 확인 및 수정
```sql
-- 1. 현재 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memories'
ORDER BY ordinal_position;

-- 2. user_id 컬럼 추가 (없는 경우)
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. 기본값 설정 (필요한 경우)
UPDATE memories 
SET user_id = 'YOUR-USER-ID-HERE'
WHERE user_id IS NULL;
```

### 2.3 RLS 정책 설정
```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON memories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON memories;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON memories;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON memories;

-- 새 정책 생성
CREATE POLICY "Enable read access for all users" ON memories
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON memories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON memories
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON memories
FOR DELETE USING (auth.uid() = user_id);

-- RLS 활성화
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
```

## 3. 확인 방법

### 3.1 Storage 정책 확인
1. Storage 탭 → media 버킷 → Policies
2. 추가한 4개의 정책이 보이는지 확인

### 3.2 Database 정책 확인
SQL Editor에서:
```sql
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'memories'
ORDER BY policyname;
```

## 4. 문제 해결

### Storage 업로드 400 에러
1. Storage 정책이 제대로 설정되었는지 확인
2. 파일 경로가 올바른지 확인 (`memories/{user_id}/filename`)
3. 버킷이 public인지 private인지 확인

### RLS 정책 위반 에러
1. user_id 컬럼이 있는지 확인
2. 저장하려는 데이터의 user_id가 현재 로그인한 사용자와 일치하는지 확인
3. RLS 정책이 올바르게 설정되었는지 확인

### 임시 해결책 (개발용)
문제가 계속되면 임시로:
1. Storage: Public bucket으로 설정
2. Database: RLS 비활성화
```sql
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;
```

**주의: 프로덕션에서는 반드시 적절한 보안 정책을 설정하세요!**