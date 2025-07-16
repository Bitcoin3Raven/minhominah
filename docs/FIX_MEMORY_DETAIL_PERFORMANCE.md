# 메모리 상세페이지 성능 개선 가이드

## 문제 증상
- /memories/:id 페이지 접속 시 느린 로딩
- 간헐적인 404 에러 발생

## 원인 분석

### 1. 인증 지연
- PrivateRoute의 인증 확인 과정에서 지연 발생
- 세션 만료 시 로그인 페이지로 리다이렉션

### 2. 데이터베이스 쿼리 성능
- 복잡한 join 쿼리로 인한 성능 저하
- RLS 정책 확인 과정에서 추가 지연

### 3. 이미지 로딩
- 대용량 이미지 파일 로딩 지연
- 썸네일 없이 원본 이미지 로드

## 즉시 적용 가능한 해결책

### 1. 쿼리 최적화
```sql
-- Supabase 대시보드에서 실행
-- memories 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_memories_id ON memories(id);
CREATE INDEX IF NOT EXISTS idx_media_files_memory_id ON media_files(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_people_memory_id ON memory_people(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_memory_id ON memory_tags(memory_id);
```

### 2. 이미지 최적화
- 이미지 업로드 시 썸네일 생성 구현 필요
- lazy loading 적용으로 초기 로딩 속도 개선

### 3. 캐싱 전략
- React Query의 캐시 시간 연장
- prefetch 구현으로 미리 데이터 로드

## 장기적 개선 방안

### 1. 이미지 CDN 적용
- Supabase Storage + CDN 조합
- 이미지 리사이징 서비스 활용

### 2. 데이터 구조 최적화
- 자주 사용되는 데이터 denormalization
- 뷰(View) 생성으로 쿼리 단순화

### 3. Progressive Enhancement
- 핵심 데이터 먼저 로드
- 이미지는 별도로 lazy load

## 임시 해결책

### 브라우저 캐시 활용
```javascript
// 이미지 URL에 캐시 버스터 추가
const getMediaUrl = (path: string) => {
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
};
```

### 에러 핸들링 개선
```javascript
// 404 에러 시 재시도 로직 추가
const { data: memory, isLoading, error } = useQuery({
  queryKey: ['memory', id],
  queryFn: async () => {
    // ... 기존 코드
  },
  retry: 3,
  retryDelay: 1000,
});
```
