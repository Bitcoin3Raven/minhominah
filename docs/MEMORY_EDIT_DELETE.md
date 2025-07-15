# 추억 갤러리 수정/삭제 기능

## 개요
`/memories` 페이지에 추억 수정 및 삭제 기능을 추가했습니다.

## 주요 기능

### 1. 권한 체크
- 본인이 작성한 추억만 수정/삭제 가능
- `user_id`를 통해 현재 로그인한 사용자와 비교

### 2. UI/UX
#### 그리드 뷰
- 카드 호버 시 우측 상단에 더보기(⋮) 버튼 표시
- 클릭 시 드롭다운 메뉴로 수정/삭제 옵션 제공

#### 리스트 뷰
- 각 항목 우측에 수정/삭제 버튼 상시 표시
- 직관적인 아이콘 사용 (연필, 휴지통)

### 3. 수정 기능
- 수정 버튼 클릭 시 `/upload?edit={memoryId}` 로 이동
- UploadPage에서 편집 모드로 기존 데이터 로드

### 4. 삭제 기능
- 삭제 버튼 클릭 시 확인 모달 표시
- 실수로 삭제하는 것을 방지
- 삭제 중 로딩 표시
- 성공 시 목록 자동 갱신

## 구현 상세

### Memory 인터페이스 수정
```typescript
interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
  user_id: string; // 추가
  // ...
}
```

### 삭제 Mutation
```typescript
const deleteMutation = useMutation({
  mutationFn: async (memoryId: string) => {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', user?.id); // 본인 것만 삭제
      
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['memories-infinite'] });
    // 모달 닫기 및 상태 초기화
  }
});
```

## 다음 작업
- UploadPage에 편집 모드 구현
- 수정 시 기존 데이터 로드 및 업데이트 기능
