# 성능 최적화 사용 가이드

## 구현된 최적화 기능

### 1. 가상 스크롤 (Virtual Scroll)
- **자동 활성화**: 사진이 많을 때 자동으로 20개씩 로드
- **무한 스크롤**: 페이지 하단에 도달하면 자동으로 다음 사진들 로드
- **상태 표시**: 화면 하단에 "총 X개 중 Y개 표시" 정보 제공

### 2. 필터 캐싱
- **자동 캐싱**: 동일한 필터 조합 재사용 시 즉시 결과 표시
- **메모리 효율**: 최대 50개 필터 조합 저장 (LRU 방식)
- **캐시 무효화**: 새 사진 추가 시 자동으로 캐시 초기화

### 3. 성능 모니터링 (개발자용)
- **실시간 모니터**: 화면 우측 하단에 성능 정보 표시
- **측정 항목**:
  - 렌더링 시간
  - 필터링 시간
  - 캐시 적중률
  - 메모리 사용량

## 설정 변경 방법

### 기능 활성화/비활성화
`js/performance-optimization.js` 파일 상단의 설정 변경:

```javascript
const PERFORMANCE_FLAGS = {
    VIRTUAL_SCROLL: true,    // 가상 스크롤 (true/false)
    FILTER_CACHE: true,      // 필터 캐싱 (true/false)
    DEBUG_MODE: false        // 디버그 모드 (true/false)
};
```

### 페이지 크기 변경
한 번에 로드할 사진 개수 조정:

```javascript
// js/memory-data-manager.js
window.memoryDataManager = new MemoryDataManager({
    pageSize: 20  // 기본값: 20, 원하는 값으로 변경
});
```

## 개발자 콘솔 명령어

디버그 모드가 활성화된 경우 사용 가능:

1. **성능 리포트 보기**
   ```javascript
   perfReport()
   ```

2. **성능 데이터 CSV 내보내기**
   ```javascript
   perfExport()
   ```

3. **캐시 통계 보기**
   ```javascript
   showCacheStats()
   ```

## 주의사항

1. **첫 로드 시간**: 가상 스크롤로 인해 초기 로드는 빠르지만, 전체 사진을 보려면 여러 번 스크롤 필요

2. **필터 변경**: 필터 변경 시 자동으로 처음부터 다시 로드

3. **브라우저 호환성**: 
   - Chrome, Edge, Firefox 최신 버전 권장
   - Safari에서도 작동하나 성능 모니터링 일부 제한

4. **모바일 최적화**: 모바일에서는 자동으로 더 적은 수의 사진 로드

## 문제 해결

### 스크롤이 작동하지 않는 경우
1. 브라우저 콘솔에서 오류 확인
2. `VIRTUAL_SCROLL`을 `false`로 설정하여 기존 방식으로 전환

### 성능이 느린 경우
1. 페이지 크기를 10-15개로 줄이기
2. 캐시 크기 늘리기 (최대 100개까지 권장)

### 캐시가 제대로 작동하지 않는 경우
```javascript
// 브라우저 콘솔에서 캐시 초기화
window.filterCache.invalidate()
```

## 향후 개선 예정

1. 페이지네이션 버튼 옵션 추가
2. 사용자별 설정 저장
3. 이미지 품질 단계별 로딩
4. 오프라인 모드 지원