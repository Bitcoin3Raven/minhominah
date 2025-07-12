/**
 * 성능 모니터링 도구
 * 렌더링, 필터링, 이미지 로딩 성능을 측정하고 분석
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            renderTime: [],
            filterTime: [],
            imageLoadTime: [],
            scrollEvents: [],
            cacheHits: 0,
            cacheMisses: 0,
            memoryCount: 0,
            sessionStart: Date.now()
        };
        
        this.maxMetricSize = 100; // 각 메트릭 최대 보관 개수
        this.displayElement = null;
        this.isEnabled = PERFORMANCE_FLAGS?.DEBUG_MODE || false;
    }
    
    /**
     * 렌더링 시간 측정
     */
    async measureRender(callback, label = 'render') {
        if (!this.isEnabled) {
            return await callback();
        }
        
        const start = performance.now();
        let result;
        
        try {
            result = await callback();
        } finally {
            const end = performance.now();
            const duration = end - start;
            
            this.addMetric('renderTime', {
                duration,
                label,
                timestamp: Date.now(),
                itemCount: window.memoryDataManager?.getStatus().displayed || 0
            });
            
            this.updateDisplay();
        }
        
        return result;
    }
    
    /**
     * 필터링 시간 측정
     */
    measureFilter(callback, filterType = 'unknown') {
        if (!this.isEnabled) {
            return callback();
        }
        
        const start = performance.now();
        let result;
        
        try {
            result = callback();
        } finally {
            const end = performance.now();
            const duration = end - start;
            
            this.addMetric('filterTime', {
                duration,
                filterType,
                timestamp: Date.now(),
                resultCount: Array.isArray(result) ? result.length : 0
            });
        }
        
        return result;
    }
    
    /**
     * 이미지 로드 시간 측정
     */
    trackImageLoad(imageUrl, loadTime) {
        if (!this.isEnabled) return;
        
        this.addMetric('imageLoadTime', {
            duration: loadTime,
            url: imageUrl,
            timestamp: Date.now()
        });
    }
    
    /**
     * 스크롤 이벤트 추적
     */
    trackScroll() {
        if (!this.isEnabled) return;
        
        this.addMetric('scrollEvents', {
            timestamp: Date.now(),
            scrollY: window.scrollY,
            viewportHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight
        });
    }
    
    /**
     * 캐시 히트/미스 추적
     */
    trackCacheHit(isHit) {
        if (!this.isEnabled) return;
        
        if (isHit) {
            this.metrics.cacheHits++;
        } else {
            this.metrics.cacheMisses++;
        }
    }
    
    /**
     * 메트릭 추가 (크기 제한 적용)
     */
    addMetric(type, data) {
        if (!this.metrics[type]) {
            this.metrics[type] = [];
        }
        
        this.metrics[type].push(data);
        
        // 크기 제한
        if (this.metrics[type].length > this.maxMetricSize) {
            this.metrics[type].shift();
        }
    }
    
    /**
     * 통계 계산
     */
    getStats() {
        const stats = {
            renderTime: this.calculateStats(this.metrics.renderTime.map(m => m.duration)),
            filterTime: this.calculateStats(this.metrics.filterTime.map(m => m.duration)),
            imageLoadTime: this.calculateStats(this.metrics.imageLoadTime.map(m => m.duration)),
            cacheHitRate: this.calculateCacheHitRate(),
            sessionDuration: (Date.now() - this.metrics.sessionStart) / 1000 / 60, // 분 단위
            totalScrollEvents: this.metrics.scrollEvents.length,
            memoryUsage: this.getMemoryUsage()
        };
        
        return stats;
    }
    
    /**
     * 배열 통계 계산
     */
    calculateStats(values) {
        if (values.length === 0) {
            return { avg: 0, min: 0, max: 0, median: 0, count: 0 };
        }
        
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        
        return {
            avg: sum / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: sorted[Math.floor(sorted.length / 2)],
            count: values.length
        };
    }
    
    /**
     * 캐시 히트율 계산
     */
    calculateCacheHitRate() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        if (total === 0) return 0;
        
        return (this.metrics.cacheHits / total * 100).toFixed(2);
    }
    
    /**
     * 메모리 사용량 추정
     */
    getMemoryUsage() {
        if (!performance.memory) {
            return 'N/A';
        }
        
        const used = performance.memory.usedJSHeapSize / 1048576; // MB
        const total = performance.memory.totalJSHeapSize / 1048576; // MB
        
        return {
            used: used.toFixed(2),
            total: total.toFixed(2),
            percentage: (used / total * 100).toFixed(2)
        };
    }
    
    /**
     * 성능 모니터 UI 생성
     */
    createDisplay() {
        if (this.displayElement) return;
        
        this.displayElement = document.createElement('div');
        this.displayElement.id = 'performance-monitor';
        this.displayElement.className = 'fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm';
        this.displayElement.style.display = this.isEnabled ? 'block' : 'none';
        
        document.body.appendChild(this.displayElement);
    }
    
    /**
     * 성능 정보 업데이트
     */
    updateDisplay() {
        if (!this.isEnabled || !this.displayElement) return;
        
        const stats = this.getStats();
        const status = window.memoryDataManager?.getStatus() || {};
        
        this.displayElement.innerHTML = `
            <div class="mb-2 font-bold">Performance Monitor</div>
            <div class="grid grid-cols-2 gap-2">
                <div>Render (avg):</div>
                <div>${stats.renderTime.avg.toFixed(2)}ms</div>
                
                <div>Filter (avg):</div>
                <div>${stats.filterTime.avg.toFixed(2)}ms</div>
                
                <div>Cache Hit Rate:</div>
                <div>${stats.cacheHitRate}%</div>
                
                <div>Items Displayed:</div>
                <div>${status.displayed || 0} / ${status.total || 0}</div>
                
                <div>Memory:</div>
                <div>${typeof stats.memoryUsage === 'object' ? 
                    `${stats.memoryUsage.used}MB (${stats.memoryUsage.percentage}%)` : 
                    'N/A'}</div>
                
                <div>Session:</div>
                <div>${stats.sessionDuration.toFixed(1)}min</div>
            </div>
            <button onclick="window.performanceMonitor.toggle()" 
                class="mt-2 text-xs underline hover:no-underline">
                Close
            </button>
        `;
    }
    
    /**
     * 모니터 표시/숨기기 토글
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (this.displayElement) {
            this.displayElement.style.display = this.isEnabled ? 'block' : 'none';
        }
        
        // 로컬 스토리지에 상태 저장
        localStorage.setItem('performanceMonitorEnabled', this.isEnabled);
    }
    
    /**
     * 상세 리포트 출력 (콘솔)
     */
    printDetailedReport() {
        const stats = this.getStats();
        
        console.group('Performance Report');
        
        console.log('=== Render Performance ===');
        console.table({
            'Average': `${stats.renderTime.avg.toFixed(2)}ms`,
            'Min': `${stats.renderTime.min.toFixed(2)}ms`,
            'Max': `${stats.renderTime.max.toFixed(2)}ms`,
            'Median': `${stats.renderTime.median.toFixed(2)}ms`,
            'Count': stats.renderTime.count
        });
        
        console.log('=== Filter Performance ===');
        console.table({
            'Average': `${stats.filterTime.avg.toFixed(2)}ms`,
            'Min': `${stats.filterTime.min.toFixed(2)}ms`,
            'Max': `${stats.filterTime.max.toFixed(2)}ms`,
            'Median': `${stats.filterTime.median.toFixed(2)}ms`,
            'Count': stats.filterTime.count
        });
        
        console.log('=== Cache Performance ===');
        console.table({
            'Hits': this.metrics.cacheHits,
            'Misses': this.metrics.cacheMisses,
            'Hit Rate': `${stats.cacheHitRate}%`
        });
        
        if (window.filterCache) {
            console.log('=== Cache Details ===');
            console.table(window.filterCache.getStats());
        }
        
        console.log('=== Memory Usage ===');
        if (typeof stats.memoryUsage === 'object') {
            console.table(stats.memoryUsage);
        } else {
            console.log('Memory API not available');
        }
        
        console.groupEnd();
    }
    
    /**
     * CSV 형식으로 데이터 내보내기
     */
    exportToCSV() {
        const stats = this.getStats();
        const timestamp = new Date().toISOString();
        
        const csvData = [
            ['Metric', 'Value', 'Timestamp'],
            ['Render Time Avg (ms)', stats.renderTime.avg.toFixed(2), timestamp],
            ['Filter Time Avg (ms)', stats.filterTime.avg.toFixed(2), timestamp],
            ['Cache Hit Rate (%)', stats.cacheHitRate, timestamp],
            ['Session Duration (min)', stats.sessionDuration.toFixed(1), timestamp],
            ['Total Scroll Events', stats.totalScrollEvents, timestamp]
        ];
        
        const csv = csvData.map(row => row.join(',')).join('\n');
        
        // 다운로드 링크 생성
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 전역 인스턴스 생성
window.performanceMonitor = new PerformanceMonitor();

// DOM 로드 시 UI 생성
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor.createDisplay();
    
    // 로컬 스토리지에서 상태 복원
    const savedState = localStorage.getItem('performanceMonitorEnabled');
    if (savedState === 'true') {
        window.performanceMonitor.isEnabled = true;
        if (window.performanceMonitor.displayElement) {
            window.performanceMonitor.displayElement.style.display = 'block';
        }
    }
});

// 개발자 콘솔 명령어 노출
if (PERFORMANCE_FLAGS?.DEBUG_MODE) {
    window.perfReport = () => window.performanceMonitor.printDetailedReport();
    window.perfExport = () => window.performanceMonitor.exportToCSV();
    console.log('Performance monitoring commands available: perfReport(), perfExport()');
}