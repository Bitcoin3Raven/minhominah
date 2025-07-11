# Supabase Storage 설정 가이드

## 문제 해결 방법

### 방법 1: Supabase 대시보드에서 직접 설정 (권장)

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 로그인
   - 프로젝트 선택

2. **Storage 탭으로 이동**
   - 왼쪽 메뉴에서 "Storage" 클릭

3. **media 버킷 설정**
   - `media` 버킷이 없으면 생성
   - 버킷 옆의 점 3개 메뉴 클릭
   - "Policies" 선택

4. **정책 추가**
   - "New Policy" 클릭
   - "For full customization" 선택
   - 다음 정책들을 추가:

#### 업로드 정책
```sql
-- Policy name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Target roles: authenticated

bucket_id = 'media'
```

#### 조회 정책
```sql
-- Policy name: Allow authenticated downloads
-- Allowed operation: SELECT
-- Target roles: authenticated

bucket_id = 'media'
```

#### 수정 정책
```sql
-- Policy name: Allow authenticated updates
-- Allowed operation: UPDATE
-- Target roles: authenticated

bucket_id = 'media'
```

#### 삭제 정책
```sql
-- Policy name: Allow authenticated deletes
-- Allowed operation: DELETE
-- Target roles: authenticated

bucket_id = 'media'
```

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치 (아직 없다면)
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로그인
supabase login

# Storage 정책 파일 생성
supabase gen types typescript --project-id "your-project-id" > database.types.ts
```

### 방법 3: 임시 해결책 - Public 버킷 사용

만약 긴급하게 테스트가 필요하다면:

1. Supabase 대시보드 > Storage
2. media 버킷 설정
3. "Make bucket public" 토글 켜기
4. 테스트 후 다시 private으로 변경하고 정책 설정

## 주의사항

- Storage RLS 정책은 데이터베이스 슈퍼유저 권한이 필요합니다
- Supabase 대시보드나 CLI를 통해서만 설정 가능합니다
- SQL Editor에서는 일반적으로 권한 오류가 발생합니다

## 확인 방법

정책이 제대로 설정되었는지 확인:

1. Storage 탭에서 Policies 확인
2. 또는 SQL Editor에서:
```sql
SELECT * FROM storage.policies;
```