# add-memory.html 페이지 개선 사항

## 수정 날짜: 2025-01-12

### 수정 내용

1. **헤더 로고 영역 개선**
   - "민호민아 성장앨범" 텍스트 제거
   - 로고 이미지만 표시하여 깔끔한 디자인 구현

2. **히어로 섹션 레이아웃 개선**
   - 텍스트를 수직 중앙 정렬로 변경
   - flexbox에 `justify-center` 추가하여 중앙 배치
   - "앨범으로 돌아가기" 버튼을 절대 위치(`absolute`)로 상단 좌측에 배치
   - 버튼과 메인 텍스트 간의 간섭 제거

### 기술적 변경사항

```html
<!-- 변경 전 -->
<section class="hero-section relative overflow-hidden mt-16 flex items-center">
  <div class="relative z-10 container mx-auto px-4 py-12 text-center">
    <div class="flex items-center justify-between mb-8">
      <a href="index.html">앨범으로 돌아가기</a>
    </div>
    <h1>새로운 추억 만들기</h1>
  </div>
</section>

<!-- 변경 후 -->
<section class="hero-section relative overflow-hidden mt-16 flex items-center justify-center">
  <div class="absolute top-8 left-4 z-20">
    <a href="index.html">앨범으로 돌아가기</a>
  </div>
  <div class="relative z-10 container mx-auto px-4 text-center">
    <h1>새로운 추억 만들기</h1>
  </div>
</section>
```

### 결과
- 더 깔끔하고 집중된 UI
- 사용자 경험 개선
- 일관된 디자인 언어 유지
