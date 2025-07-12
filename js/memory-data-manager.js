/**
 * 메모리 데이터 관리자
 * 가상 스크롤과 페이지네이션을 위한 데이터 관리 클래스
 */
class MemoryDataManager {
    constructor(options = {}) {
        this.pageSize = options.pageSize || 20;
        this.reset();
    }
    
    reset() {
        this.allMemories = [];
        this.filteredMemories = [];
        this.displayedMemories = [];
        this.currentPage = 0;
        this.hasMore = true;
        this.totalCount = 0;
    }
    
    /**
     * 전체 메모리 설정
     */
    setAllMemories(memories) {
        this.allMemories = memories;
        this.totalCount = memories.length;
    }
    
    /**
     * 필터링된 메모리 설정
     */
    setFilteredMemories(memories) {
        this.filteredMemories = memories;
        this.currentPage = 0;
        this.displayedMemories = [];
        this.hasMore = memories.length > 0;
        this.totalCount = memories.length;
    }
    
    /**
     * 다음 페이지 로드
     */
    loadNextPage() {
        if (!this.hasMore) {
            return [];
        }
        
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const nextBatch = this.filteredMemories.slice(start, end);
        
        if (nextBatch.length === 0 || end >= this.filteredMemories.length) {
            this.hasMore = false;
        }
        
        this.displayedMemories.push(...nextBatch);
        this.currentPage++;
        
        return nextBatch;
    }
    
    /**
     * 특정 페이지로 이동
     */
    goToPage(pageNumber) {
        if (pageNumber < 0) return [];
        
        const start = pageNumber * this.pageSize;
        const end = start + this.pageSize;
        
        if (start >= this.filteredMemories.length) {
            return [];
        }
        
        this.currentPage = pageNumber;
        this.displayedMemories = this.filteredMemories.slice(0, end);
        this.hasMore = end < this.filteredMemories.length;
        
        return this.filteredMemories.slice(start, end);
    }
    
    /**
     * 현재 표시중인 메모리 반환
     */
    getDisplayedMemories() {
        return this.displayedMemories;
    }
    
    /**
     * 상태 정보 반환
     */
    getStatus() {
        return {
            total: this.totalCount,
            displayed: this.displayedMemories.length,
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            hasMore: this.hasMore,
            pages: Math.ceil(this.totalCount / this.pageSize)
        };
    }
    
    /**
     * 페이지 크기 변경
     */
    setPageSize(size) {
        this.pageSize = size;
        this.reset();
    }
}

// 전역 인스턴스 생성
if (!window.memoryDataManager) {
    window.memoryDataManager = new MemoryDataManager();
}