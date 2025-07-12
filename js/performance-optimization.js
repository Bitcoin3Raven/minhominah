/**
 * 성능 최적화 모듈
 * 가상 스크롤과 필터 캐싱을 통한 성능 개선
 */

// Feature flags - 전역 변수로 노출
window.PERFORMANCE_FLAGS = {
    VIRTUAL_SCROLL: true,  // 가상 스크롤 활성화
    FILTER_CACHE: true,
    DEBUG_MODE: false     // 성능 모니터 비활성화
};

// 로컬 참조용
const PERFORMANCE_FLAGS = window.PERFORMANCE_FLAGS;

// 원본 함수 백업
let originalDisplayMemories = null;
let originalApplyFilters = null;

/**
 * 성능 최적화된 displayMemories 함수
 */
async function optimizedDisplayMemories(append = false) {
    const container = document.getElementById('memoriesContainer');
    if (!container) return;
    
    // 가상 스크롤이 비활성화된 경우 원본 함수 사용
    if (!PERFORMANCE_FLAGS.VIRTUAL_SCROLL && originalDisplayMemories) {
        return originalDisplayMemories();
    }
    
    // 렌더링 성능 측정
    await window.performanceMonitor?.measureRender(async () => {
        if (!append) {
            // 초기 로드
            container.innerHTML = '';
            
            // 필터링된 메모리 가져오기
            const filteredMemories = getFilteredMemories();
            window.memoryDataManager.setFilteredMemories(filteredMemories);
            
            // 스크롤 관리자 초기화
            if (window.scrollManager) {
                window.scrollManager.destroy();
            }
            
            window.scrollManager = new ScrollManager({
                container: window,
                callback: async () => {
                    displayMemories(true);
                },
                threshold: 300
            });
        }
        
        // 다음 페이지 로드
        const nextBatch = window.memoryDataManager.loadNextPage();
        const status = window.memoryDataManager.getStatus();
        
        if (PERFORMANCE_FLAGS.DEBUG_MODE) {
            console.log('Loading batch:', {
                batchSize: nextBatch.length,
                total: status.total,
                displayed: status.displayed,
                hasMore: status.hasMore
            });
        }
        
        if (nextBatch.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400 text-lg">
                            등록된 추억이 없습니다.
                        </p>
                    </div>
                `;
            }
            
            // 더 이상 로드할 것이 없으면 스크롤 관리자 비활성화
            if (window.scrollManager) {
                window.scrollManager.setEnabled(false);
                window.scrollManager.detachSentinel();
            }
            return;
        }
        
        // 메모리 아이템 렌더링
        renderMemoryBatch(nextBatch, container, append);
        
        // 스크롤 센티넬 재배치
        if (window.scrollManager && status.hasMore) {
            window.scrollManager.attachSentinel(container);
        } else if (window.scrollManager) {
            window.scrollManager.setEnabled(false);
            window.scrollManager.detachSentinel();
        }
        
        // Lazy loading 재초기화
        if (typeof lazyLoadImages === 'function') {
            setTimeout(lazyLoadImages, 100);
        } else if (typeof setupLazyLoading === 'function') {
            setupLazyLoading();
        } else if (window.setupLazyLoading) {
            window.setupLazyLoading();
        }
        
        // AOS 애니메이션 새로고침
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
        
        // 상태 표시 업데이트
        updateStatusDisplay(status);
    }, append ? 'append' : 'initial');
}

/**
 * 메모리 배치 렌더링
 */
function renderMemoryBatch(memories, container, append) {
    const fragment = document.createDocumentFragment();
    const currentLayout = window.currentLayout || 'grid';
    
    memories.forEach(memory => {
        const memoryElement = createMemoryElement(memory, currentLayout);
        fragment.appendChild(memoryElement);
    });
    
    if (append) {
        container.appendChild(fragment);
    } else {
        container.innerHTML = '';
        container.appendChild(fragment);
    }
}

/**
 * 미디어 URL 가져오기
 */
function getMediaUrl(mediaFile) {
    if (!mediaFile) return '';
    
    // 썸네일이 있으면 썸네일 사용, 없으면 원본 사용
    const path = mediaFile.thumbnail_path || mediaFile.file_path;
    const { data } = supabaseClient.storage
        .from('media')
        .getPublicUrl(path);
    
    return data.publicUrl;
}

/**
 * 메모리 요소 생성 (기존 코드에서 추출)
 */
function createMemoryElement(memory, layout) {
    // 기존 displayMemories에서 메모리 카드 생성 로직 재사용
    const memoryCard = document.createElement('div');
    
    if (layout === 'masonry') {
        memoryCard.className = 'masonry-item break-inside-avoid';
    } else if (layout === 'timeline') {
        memoryCard.className = 'timeline-item';
    } else {
        memoryCard.className = 'memory-card';
    }
    
    // 이미지 URL 설정
    const hasMedia = memory.media_files && memory.media_files.length > 0;
    const imageUrl = hasMedia 
        ? getMediaUrl(memory.media_files[0])
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E';
    
    // 사람 정보
    const peopleNames = memory.memory_people
        .map(mp => peopleData[mp.person_id]?.name || '')
        .filter(name => name)
        .join(', ');
    
    // 태그 정보
    const tags = memory.memory_tags || [];
    const tagElements = tags.map(tag => 
        `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
            ${tag.tag_name}
        </span>`
    ).join('');
    
    // 카드 내용 생성
    memoryCard.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" data-aos="fade-up">
            <div class="aspect-w-16 aspect-h-12 bg-gray-200 dark:bg-gray-700">
                <img 
                    data-src="${imageUrl}" 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3C/svg%3E"
                    alt="${memory.title || '추억'}" 
                    class="w-full h-full object-cover lazy-load"
                    loading="lazy"
                >
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ${memory.title || '제목 없음'}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    ${memory.date ? new Date(memory.date).toLocaleDateString('ko-KR') : '날짜 없음'}
                </p>
                ${peopleNames ? `
                    <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-user mr-1"></i> ${peopleNames}
                    </p>
                ` : ''}
                ${memory.description ? `
                    <p class="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3">
                        ${memory.description}
                    </p>
                ` : ''}
                ${tagElements ? `
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${tagElements}
                    </div>
                ` : ''}
                <div class="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onclick="viewMemoryDetail(${memory.id})" 
                        class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                        자세히 보기
                    </button>
                    <div class="flex gap-3 text-gray-500 dark:text-gray-400 text-sm">
                        ${memory.media_files && memory.media_files.length > 1 ? `
                            <span><i class="fas fa-images"></i> ${memory.media_files.length}</span>
                        ` : ''}
                        ${memory.likes_count > 0 ? `
                            <span><i class="fas fa-heart"></i> ${memory.likes_count}</span>
                        ` : ''}
                        ${memory.comments_count > 0 ? `
                            <span><i class="fas fa-comment"></i> ${memory.comments_count}</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return memoryCard;
}

/**
 * 상태 표시 업데이트
 */
function updateStatusDisplay(status) {
    // 상태 표시 요소 찾기 또는 생성
    let statusElement = document.getElementById('memory-status');
    
    if (!statusElement) {
        const container = document.getElementById('memoriesContainer');
        if (!container) return;
        
        statusElement = document.createElement('div');
        statusElement.id = 'memory-status';
        statusElement.className = 'text-center text-sm text-gray-600 dark:text-gray-400 py-4';
        container.parentNode.insertBefore(statusElement, container.nextSibling);
    }
    
    if (status.total === 0) {
        statusElement.style.display = 'none';
    } else {
        statusElement.style.display = 'block';
        statusElement.innerHTML = `
            총 ${status.total}개 중 ${status.displayed}개 표시
            ${status.hasMore ? ' • 스크롤하여 더 보기' : ''}
        `;
    }
}

/**
 * 필터링된 메모리 가져오기
 */
function getFilteredMemories() {
    // 현재 필터 상태 수집
    const filters = {
        person: currentFilter || 'all',
        search: document.getElementById('searchInput')?.value?.trim() || '',
        tags: window.selectedTags ? Array.from(window.selectedTags) : [],
        sortBy: 'date',
        sortOrder: 'desc'
    };
    
    // 캐싱이 활성화된 경우
    if (PERFORMANCE_FLAGS.FILTER_CACHE && window.filterCache) {
        return getCachedFilteredMemories(filters);
    }
    
    // 캐싱이 비활성화된 경우 직접 필터링
    return performDirectFiltering(filters);
}

/**
 * 직접 필터링 수행 (캐싱 없이)
 */
function performDirectFiltering(filters) {
    let filteredMemories = [...allMemories];
    
    // 1. 인물 필터
    if (filters.person !== 'all') {
        filteredMemories = filteredMemories.filter(memory => {
            if (filters.person === 'both') {
                const hasMinHo = memory.memory_people.some(mp => {
                    const person = peopleData[mp.person_id];
                    return person && person.name === '민호';
                });
                const hasMinA = memory.memory_people.some(mp => {
                    const person = peopleData[mp.person_id];
                    return person && person.name === '민아';
                });
                return hasMinHo && hasMinA;
            } else {
                return memory.memory_people.some(mp => {
                    const person = peopleData[mp.person_id];
                    return person && person.name.toLowerCase() === 
                        (filters.person === 'minho' ? '민호' : '민아');
                });
            }
        });
    }
    
    // 2. 검색어 필터
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredMemories = filteredMemories.filter(memory => {
            return memory.title?.toLowerCase().includes(searchTerm) ||
                   memory.description?.toLowerCase().includes(searchTerm) ||
                   memory.memory_tags?.some(tag => 
                       tag.tag_name.toLowerCase().includes(searchTerm)
                   );
        });
    }
    
    // 3. 태그 필터
    if (filters.tags && filters.tags.length > 0) {
        filteredMemories = filteredMemories.filter(memory => {
            const memoryTags = memory.memory_tags?.map(t => t.tag_name) || [];
            return filters.tags.every(tag => memoryTags.includes(tag));
        });
    }
    
    // 4. 정렬
    filteredMemories.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA; // 최신순
    });
    
    return filteredMemories;
}

/**
 * 성능 최적화 초기화
 */
function initializePerformanceOptimization() {
    // 원본 함수 백업
    if (typeof displayMemories === 'function') {
        originalDisplayMemories = displayMemories;
        // 전역 displayMemories를 최적화된 버전으로 교체
        window.displayMemories = optimizedDisplayMemories;
    }
    
    console.log('Performance optimization initialized', PERFORMANCE_FLAGS);
}

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePerformanceOptimization);
} else {
    initializePerformanceOptimization();
}