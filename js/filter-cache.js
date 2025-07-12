/**
 * 필터 캐시 시스템
 * LRU (Least Recently Used) 캐시를 사용한 필터 결과 캐싱
 */
class FilterCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }
    
    /**
     * 캐시 키 생성
     * 필터 조합을 고유한 문자열로 변환
     */
    generateKey(filters) {
        const normalized = {
            person: filters.person || 'all',
            search: (filters.search || '').toLowerCase().trim(),
            tags: (filters.tags || []).slice().sort(),
            sortBy: filters.sortBy || 'date',
            sortOrder: filters.sortOrder || 'desc'
        };
        
        return JSON.stringify(normalized);
    }
    
    /**
     * 캐시 조회
     */
    get(filters) {
        const key = this.generateKey(filters);
        const cached = this.cache.get(key);
        
        if (cached) {
            // LRU: 최근 사용 항목을 맨 뒤로 이동
            this.cache.delete(key);
            this.cache.set(key, cached);
            this.hits++;
            
            // 성능 모니터에 캐시 히트 기록
            window.performanceMonitor?.trackCacheHit(true);
            
            if (window.PERFORMANCE_FLAGS?.DEBUG_MODE) {
                console.log('Cache hit:', {
                    key,
                    hitRate: this.getHitRate()
                });
            }
            
            // 깊은 복사하여 반환 (원본 보호)
            return cached.map(item => ({...item}));
        }
        
        this.misses++;
        window.performanceMonitor?.trackCacheHit(false);
        return null;
    }
    
    /**
     * 캐시 저장
     */
    set(filters, results) {
        const key = this.generateKey(filters);
        
        // 크기 제한 확인
        if (this.cache.size >= this.maxSize) {
            // 가장 오래된 항목 제거 (LRU)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            
            if (window.PERFORMANCE_FLAGS?.DEBUG_MODE) {
                console.log('Cache eviction:', firstKey);
            }
        }
        
        // 결과 저장 (깊은 복사)
        this.cache.set(key, results.map(item => ({...item})));
        
        if (window.PERFORMANCE_FLAGS?.DEBUG_MODE) {
            console.log('Cache set:', {
                key,
                size: results.length,
                cacheSize: this.cache.size
            });
        }
    }
    
    /**
     * 캐시 무효화
     */
    invalidate(pattern = null) {
        if (!pattern) {
            // 전체 캐시 클리어
            this.cache.clear();
            console.log('Cache cleared');
        } else {
            // 패턴 매칭으로 특정 캐시 항목 제거
            const keysToDelete = [];
            
            for (const key of this.cache.keys()) {
                const filters = JSON.parse(key);
                
                // 패턴에 따른 무효화 로직
                if (pattern.person && filters.person === pattern.person) {
                    keysToDelete.push(key);
                } else if (pattern.tag && filters.tags.includes(pattern.tag)) {
                    keysToDelete.push(key);
                } else if (pattern.search && filters.search.includes(pattern.search)) {
                    keysToDelete.push(key);
                }
            }
            
            keysToDelete.forEach(key => this.cache.delete(key));
            
            if (keysToDelete.length > 0) {
                console.log(`Cache invalidated: ${keysToDelete.length} entries`);
            }
        }
    }
    
    /**
     * 캐시 통계
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            total: total,
            hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * 캐시 히트율 반환
     */
    getHitRate() {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%';
    }
    
    /**
     * 캐시 크기 반환 (바이트 추정)
     */
    getEstimatedSize() {
        let totalSize = 0;
        
        for (const [key, value] of this.cache.entries()) {
            // 키 크기
            totalSize += key.length * 2; // UTF-16 인코딩
            
            // 값 크기 (대략적인 추정)
            totalSize += JSON.stringify(value).length * 2;
        }
        
        return totalSize;
    }
    
    /**
     * 캐시 정리 (메모리 관리)
     */
    cleanup(targetSize = null) {
        if (targetSize === null) {
            targetSize = Math.floor(this.maxSize * 0.8);
        }
        
        while (this.cache.size > targetSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        console.log(`Cache cleaned up: ${this.cache.size} entries remaining`);
    }
}

// 전역 필터 캐시 인스턴스
window.filterCache = new FilterCache(50);

/**
 * 캐시된 필터링 함수
 */
function getCachedFilteredMemories(filters) {
    // 캐시 확인
    let cached = window.filterCache.get(filters);
    
    if (cached) {
        return cached;
    }
    
    // 캐시 미스: 실제 필터링 수행
    const filtered = performFiltering(filters);
    
    // 결과 캐싱
    window.filterCache.set(filters, filtered);
    
    return filtered;
}

/**
 * 실제 필터링 로직
 */
function performFiltering(filters) {
    let filteredMemories = [...allMemories];
    
    // 인물 필터
    if (filters.person && filters.person !== 'all') {
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
    
    // 검색어 필터
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
    
    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
        filteredMemories = filteredMemories.filter(memory => {
            const memoryTags = memory.memory_tags?.map(t => t.tag_name) || [];
            return filters.tags.every(tag => memoryTags.includes(tag));
        });
    }
    
    // 정렬
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    
    filteredMemories.sort((a, b) => {
        let compareValue = 0;
        
        switch (sortBy) {
            case 'date':
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                compareValue = dateB - dateA;
                break;
            case 'title':
                compareValue = (a.title || '').localeCompare(b.title || '');
                break;
            case 'likes':
                compareValue = (b.likes_count || 0) - (a.likes_count || 0);
                break;
            default:
                compareValue = 0;
        }
        
        return sortOrder === 'asc' ? -compareValue : compareValue;
    });
    
    return filteredMemories;
}

/**
 * 캐시 통계 표시 (개발 모드)
 */
function showCacheStats() {
    const stats = window.filterCache.getStats();
    console.table(stats);
    
    const sizeInKB = (window.filterCache.getEstimatedSize() / 1024).toFixed(2);
    console.log(`Estimated cache size: ${sizeInKB} KB`);
}

// 개발 모드에서 전역 함수로 노출
if (window.PERFORMANCE_FLAGS?.DEBUG_MODE) {
    window.showCacheStats = showCacheStats;
}