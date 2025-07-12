# 성능 최적화 구현 계획

## 1. 가상 스크롤/페이지네이션 시스템

### 1.1 설계 방향
- **기본 전략**: 초기 20개 아이템 로드 + 무한 스크롤
- **대안 옵션**: 사용자가 페이지네이션 선택 가능
- **기존 코드 호환성**: displayMemories() 함수를 확장하여 점진적 마이그레이션

### 1.2 구현 단계

#### Phase 1: 데이터 관리 계층 추가
```javascript
class MemoryDataManager {
    constructor() {
        this.allMemories = [];
        this.filteredMemories = [];
        this.displayedMemories = [];
        this.pageSize = 20;
        this.currentPage = 0;
        this.hasMore = true;
    }
    
    // 필터링된 메모리 설정
    setFilteredMemories(memories) {
        this.filteredMemories = memories;
        this.currentPage = 0;
        this.displayedMemories = [];
        this.hasMore = true;
    }
    
    // 다음 페이지 로드
    loadNextPage() {
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const nextBatch = this.filteredMemories.slice(start, end);
        
        if (nextBatch.length < this.pageSize) {
            this.hasMore = false;
        }
        
        this.displayedMemories.push(...nextBatch);
        this.currentPage++;
        
        return nextBatch;
    }
}
```

#### Phase 2: 스크롤 감지 시스템
```javascript
class ScrollManager {
    constructor(container, callback) {
        this.container = container;
        this.callback = callback;
        this.isLoading = false;
        this.threshold = 200; // 하단 200px 전에 로드
        
        this.setupObserver();
    }
    
    setupObserver() {
        // Intersection Observer 사용
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        this.container.appendChild(sentinel);
        
        this.observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !this.isLoading) {
                    this.callback();
                }
            },
            { rootMargin: `${this.threshold}px` }
        );
        
        this.observer.observe(sentinel);
    }
}
```

#### Phase 3: 기존 displayMemories() 수정
```javascript
// 백업 보관
const originalDisplayMemories = displayMemories;

// 새로운 구현
function displayMemories(append = false) {
    const container = document.getElementById('memoriesContainer');
    
    if (!append) {
        // 초기 로드
        container.innerHTML = '';
        memoryDataManager.setFilteredMemories(getFilteredMemories());
    }
    
    const nextBatch = memoryDataManager.loadNextPage();
    
    if (nextBatch.length === 0) {
        if (!append) {
            container.innerHTML = '<p class="no-memories">추억이 없습니다.</p>';
        }
        return;
    }
    
    // 기존 렌더링 로직 재사용
    renderMemoryBatch(nextBatch, container, append);
    
    // Lazy loading 재초기화
    if (window.imageOptimizer) {
        window.imageOptimizer.setupLazyLoading();
    }
}
```

### 1.3 UI 개선사항
- 로딩 인디케이터 추가
- "더 보기" 버튼 옵션
- 스크롤 위치 복원 기능
- 성능 카운터 표시 (선택사항)

## 2. 필터 결과 캐싱 시스템

### 2.1 설계 방향
- 필터 조합별 결과 캐싱
- 메모리 효율적인 LRU 캐시
- 캐시 무효화 전략

### 2.2 구현 계획

```javascript
class FilterCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    // 캐시 키 생성
    generateKey(filters) {
        return JSON.stringify({
            person: filters.person || 'all',
            search: filters.search || '',
            tags: (filters.tags || []).sort(),
            sortBy: filters.sortBy || 'date'
        });
    }
    
    // 캐시 조회
    get(filters) {
        const key = this.generateKey(filters);
        const cached = this.cache.get(key);
        
        if (cached) {
            // LRU: 최근 사용 항목을 맨 뒤로
            this.cache.delete(key);
            this.cache.set(key, cached);
            return cached;
        }
        
        return null;
    }
    
    // 캐시 저장
    set(filters, results) {
        const key = this.generateKey(filters);
        
        // 크기 제한 확인
        if (this.cache.size >= this.maxSize) {
            // 가장 오래된 항목 제거 (LRU)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, results);
    }
    
    // 캐시 무효화
    invalidate() {
        this.cache.clear();
    }
}
```

### 2.3 통합 방법
```javascript
// 필터 함수 수정
function applyFilters() {
    const filters = getCurrentFilters();
    
    // 캐시 확인
    let filteredMemories = filterCache.get(filters);
    
    if (!filteredMemories) {
        // 캐시 미스: 필터링 수행
        filteredMemories = performFiltering(allMemories, filters);
        filterCache.set(filters, filteredMemories);
    }
    
    // 가상 스크롤과 통합
    memoryDataManager.setFilteredMemories(filteredMemories);
    displayMemories();
}
```

## 3. 성능 모니터링 도구

### 3.1 구현 계획
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            renderTime: [],
            filterTime: [],
            imageLoadTime: [],
            memoryCount: 0,
            cacheHitRate: 0
        };
    }
    
    // 렌더링 시간 측정
    measureRender(callback) {
        const start = performance.now();
        callback();
        const end = performance.now();
        
        this.metrics.renderTime.push(end - start);
        this.updateDisplay();
    }
    
    // 성능 표시 (개발 모드)
    updateDisplay() {
        if (!window.DEBUG_MODE) return;
        
        const avgRender = this.getAverage(this.metrics.renderTime);
        console.log(`Average render time: ${avgRender.toFixed(2)}ms`);
    }
}
```

## 4. 구현 우선순위 및 일정

### Week 1: 가상 스크롤 구현
1. MemoryDataManager 클래스 생성
2. 기존 displayMemories 백업 및 수정
3. 무한 스크롤 기능 추가
4. 테스트 및 디버깅

### Week 2: 필터 캐싱
1. FilterCache 클래스 구현
2. 필터 함수 통합
3. 캐시 무효화 로직 추가
4. 성능 테스트

### Week 3: 모니터링 및 최적화
1. PerformanceMonitor 구현
2. 디버그 모드 추가
3. 최종 성능 튜닝
4. 문서화

## 5. 롤백 계획
- 모든 변경사항은 feature flag로 제어
- 기존 함수 백업 유지
- 단계별 배포 가능한 구조

## 6. 테스트 시나리오
1. 대용량 데이터 (1000+ 항목) 테스트
2. 빠른 스크롤 테스트
3. 필터 변경 반응성 테스트
4. 메모리 사용량 모니터링
5. 모바일 성능 테스트