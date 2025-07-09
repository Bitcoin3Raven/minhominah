# Supabase 데이터베이스 설정 가이드

## 권한 문제 해결 방법

현재 Supabase API를 통한 테이블 생성이 권한 문제로 막혀있습니다. 
다음 방법으로 해결할 수 있습니다:

### 1. Supabase 대시보드에서 직접 실행

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (illwscrdeyncckltjrmr)
3. SQL Editor 메뉴로 이동
4. `database_schema.sql` 파일의 내용을 복사하여 실행

### 2. 스토리지 버킷 생성

SQL Editor에서 다음 쿼리 실행:

```sql
-- 미디어 파일용 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true);

-- 썸네일용 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true);
```

### 3. 스토리지 정책 설정

```sql
-- 미디어 버킷 정책
CREATE POLICY "가족 구성원은 미디어 조회 가능" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "부모는 미디어 업로드 가능" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'parent'
    )
  );
```

### 4. 초기 사용자 설정

첫 번째 사용자를 부모 권한으로 설정:

```sql
-- 회원가입 후 실행
UPDATE profiles 
SET role = 'parent' 
WHERE id = 'YOUR_USER_ID';
```
