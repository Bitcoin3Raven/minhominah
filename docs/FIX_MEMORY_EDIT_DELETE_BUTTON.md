# 메모리 수정/삭제 버튼이 보이지 않는 문제 해결 가이드

## 문제 설명
- 본인이 등록한 메모리임에도 수정/삭제 버튼이 보이지 않는 문제
- 메모리 상세 페이지(`/memories/{id}`)에서 점점점(더보기) 메뉴가 나타나지 않음

## 원인
메모리 테이블에 두 개의 사용자 ID 필드가 존재:
- `user_id`: 새로 추가된 필드 (실제로 데이터가 저장되는 필드)
- `created_by`: 원래 스키마의 필드 (권한 체크에 사용되는 필드)

메모리 생성 시 `user_id`만 설정되고 `created_by`는 NULL로 남아있어 권한 체크가 실패했습니다.

## 해결 방법

### 1. 기존 데이터 수정 (즉시 해결)

Supabase 대시보드에서 다음 SQL 실행:

```sql
-- created_by가 NULL인 메모리를 user_id 값으로 업데이트
UPDATE memories
SET created_by = user_id
WHERE created_by IS NULL 
    AND user_id IS NOT NULL;
```

또는 `database-fix-memories-created-by.sql` 파일의 전체 내용을 실행하여 상세 확인 가능

### 2. 코드 수정 (이미 완료)

`src/pages/UploadPage.tsx`에서 메모리 생성 시 `created_by` 필드도 함께 설정하도록 수정:

```typescript
.insert({
  title: data.title,
  description: data.description,
  memory_date: data.memory_date,
  user_id: user.id,
  created_by: user.id,  // 추가된 부분
})
```

### 3. 확인 방법

1. Supabase 대시보드에서 다음 쿼리 실행:
   ```sql
   SELECT id, title, user_id, created_by 
   FROM memories 
   WHERE user_id = 'YOUR-USER-ID';
   ```

2. `created_by` 필드가 본인의 user ID와 일치하는지 확인

3. 웹사이트에서 메모리 상세 페이지 새로고침 후 수정/삭제 버튼 확인

## 장기적 해결책

향후 데이터베이스 스키마 정리 시:
1. `user_id`와 `created_by` 중 하나로 통일
2. 또는 트리거를 사용하여 자동으로 동기화

## 관련 파일
- `/src/pages/MemoryDetailPage.tsx` - 권한 체크 로직
- `/src/pages/UploadPage.tsx` - 메모리 생성 로직
- `/database-fix-memories-created-by.sql` - 데이터 수정 SQL
