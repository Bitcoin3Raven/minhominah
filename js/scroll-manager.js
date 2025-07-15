/**
 * 스크롤 관리자
 * 무한 스크롤 및 페이지네이션을 위한 스크롤 감지
 */
class ScrollManager {
    constructor(options = {}) {
        this.container = options.container || window;
        this.callback = options.callback || (() => {});
        this.threshold = options.threshold || 200;
        this.isLoading = false;
        this.enabled = true;
        this.observer = null;
        this.sentinel = null;
        
        this.setupScrollDetection();
    }
    
    /**
     * 스크롤 감지 설정
     */
    setupScrollDetection() {
        // 스크롤 컨테이너 확인
        const scrollContainer = this.container === window 
            ? document.getElementById('memoriesContainer') 
            : this.container;
            
        if (!scrollContainer) {
            console.error('Scroll container not found');
            return;
        }
        
        // 센티넬 요소 생성
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'scroll-sentinel';
        this.sentinel.style.height = '1px';
        this.sentinel.style.visibility = 'hidden';
        this.sentinel.setAttribute('aria-hidden', 'true');
        
        // Intersection Observer 설정
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.enabled && !this.isLoading) {
                        this.triggerLoad();
                    }
                });
            },
            {
                root: this.container === window ? null : this.container,
                rootMargin: `${this.threshold}px`,
                threshold: 0.01
            }
        );
    }
    
    /**
     * 로드 트리거
     */
    async triggerLoad() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingIndicator();
        
        try {
            await this.callback();
        } catch (error) {
            console.error('Error loading more items:', error);
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
        }
    }
    
    /**
     * 센티넬 요소 추가 및 관찰 시작
     */
    attachSentinel(container) {
        if (!container || !this.sentinel) return;
        
        // 기존 센티넬 제거
        this.detachSentinel();
        
        // 새로운 위치에 센티넬 추가
        container.appendChild(this.sentinel);
        
        // 관찰 시작
        if (this.observer) {
            this.observer.observe(this.sentinel);
        }
    }
    
    /**
     * 센티넬 요소 제거
     */
    detachSentinel() {
        if (this.sentinel && this.sentinel.parentNode) {
            if (this.observer) {
                this.observer.unobserve(this.sentinel);
            }
            this.sentinel.parentNode.removeChild(this.sentinel);
        }
    }
    
    /**
     * 로딩 인디케이터 표시
     */
    showLoadingIndicator() {
        // 기존 인디케이터 확인
        let indicator = document.getElementById('scroll-loading-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'scroll-loading-indicator';
            indicator.className = 'loading-indicator';
            indicator.innerHTML = `
                <div class="flex justify-center items-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span class="ml-3 text-gray-600 dark:text-gray-400">더 많은 추억을 불러오는 중...</span>
                </div>
            `;
        }
        
        // 센티넬 앞에 인디케이터 추가
        if (this.sentinel && this.sentinel.parentNode) {
            this.sentinel.parentNode.insertBefore(indicator, this.sentinel);
        }
    }
    
    /**
     * 로딩 인디케이터 숨기기
     */
    hideLoadingIndicator() {
        const indicator = document.getElementById('scroll-loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * 스크롤 관리 활성화/비활성화
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.hideLoadingIndicator();
        }
    }
    
    /**
     * 정리
     */
    destroy() {
        this.detachSentinel();
        this.hideLoadingIndicator();
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        this.sentinel = null;
    }
    
    /**
     * 수동 로드 (더보기 버튼 등)
     */
    loadMore() {
        if (!this.isLoading && this.enabled) {
            this.triggerLoad();
        }
    }
}

// 전역 스크롤 관리자 인스턴스
window.scrollManager = null;