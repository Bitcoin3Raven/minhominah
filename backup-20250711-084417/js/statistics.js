// 통계 대시보드 관리
class StatisticsManager {
    constructor() {
        this.charts = {};
        this.data = {
            memories: [],
            mediaFiles: [],
            tags: [],
            people: [],
            growthRecords: []
        };
        this.init();
    }

    async init() {
        // 로딩 표시
        this.showLoading();
        
        // 데이터 로드
        await this.loadAllData();
        
        // 통계 계산
        this.calculateStatistics();
        
        // 차트 렌더링
        this.renderAllCharts();
        
        // 로딩 숨기기
        this.hideLoading();
    }

    // 모든 데이터 로드
    async loadAllData() {
        try {
            // 추억 데이터
            const { data: memories } = await supabaseClient
                .from('memories')
                .select(`
                    *,
                    memory_people(people(*)),
                    memory_tags(tags(*)),
                    media_files(*)
                `)
                .order('memory_date', { ascending: false });

            this.data.memories = memories || [];

            // 태그 통계
            const { data: tags } = await supabaseClient
                .from('memory_tags')
                .select('tags(*)');

            this.data.tags = tags || [];

            // 인물 정보
            const { data: people } = await supabaseClient
                .from('people')
                .select('*');

            this.data.people = people || [];

        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    }

    // 통계 계산
    calculateStatistics() {
        // 총 추억 수
        document.getElementById('totalMemories').textContent = this.data.memories.length;

        // 이번 달 추억
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyCount = this.data.memories.filter(m => {
            const date = new Date(m.memory_date);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        }).length;
        document.getElementById('monthlyMemories').textContent = monthlyCount;

        // 미디어 타입별 카운트
        let photoCount = 0;
        let videoCount = 0;
        
        this.data.memories.forEach(memory => {
            if (memory.media_files) {
                memory.media_files.forEach(file => {
                    if (file.file_type === 'image') photoCount++;
                    else if (file.file_type === 'video') videoCount++;
                });
            }
        });

        document.getElementById('totalPhotos').textContent = photoCount;
        document.getElementById('totalVideos').textContent = videoCount;

        // 추가 통계
        this.calculateAdditionalStats();
    }

    // 추가 통계 계산
    calculateAdditionalStats() {
        // 월별 통계
        const monthlyData = this.getMonthlyData();
        
        // 가장 활발한 달
        let maxMonth = '';
        let maxCount = 0;
        Object.entries(monthlyData).forEach(([month, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxMonth = month;
            }
        });
        
        if (maxMonth) {
            const [year, month] = maxMonth.split('-');
            document.getElementById('mostActiveMonth').textContent = 
                `${year}년 ${parseInt(month)}월 (${maxCount}개)`;
        }

        // 평균 월별 추억
        const totalMonths = Object.keys(monthlyData).length;
        const avgMonthly = totalMonths > 0 ? 
            Math.round(this.data.memories.length / totalMonths) : 0;
        document.getElementById('avgMonthlyMemories').textContent = avgMonthly;

        // 가장 인기 있는 태그
        const tagCounts = {};
        this.data.tags.forEach(item => {
            if (item.tags) {
                const tagName = item.tags.name;
                tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
            }
        });

        const sortedTags = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a);
        
        if (sortedTags.length > 0) {
            document.getElementById('mostPopularTag').textContent = 
                `#${sortedTags[0][0]} (${sortedTags[0][1]}회)`;
        }
    }

    // 월별 데이터 집계
    getMonthlyData() {
        const monthlyData = {};
        
        this.data.memories.forEach(memory => {
            const date = new Date(memory.memory_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = (monthlyData[key] || 0) + 1;
        });

        return monthlyData;
    }

    // 모든 차트 렌더링
    renderAllCharts() {
        this.renderMonthlyTrendChart();
        this.renderPersonDistributionChart();
        this.renderYearlyChart();
        this.renderTagChart();
        this.renderWeekdayChart();
        this.renderMediaTypeChart();
    }

    // 월별 트렌드 차트
    renderMonthlyTrendChart() {
        const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
        const monthlyData = this.getMonthlyData();
        
        // 최근 12개월 데이터
        const labels = [];
        const data = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
            
            labels.push(monthName);
            data.push(monthlyData[key] || 0);
        }

        this.charts.monthlyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '추억 수',
                    data: data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 인물별 분포 차트
    renderPersonDistributionChart() {
        const ctx = document.getElementById('personDistributionChart').getContext('2d');
        
        // 인물별 추억 수 계산
        let minhoCount = 0;
        let minaCount = 0;
        let bothCount = 0;

        this.data.memories.forEach(memory => {
            const people = memory.memory_people?.map(mp => mp.people?.name) || [];
            if (people.includes('민호') && people.includes('민아')) {
                bothCount++;
            } else if (people.includes('민호')) {
                minhoCount++;
            } else if (people.includes('민아')) {
                minaCount++;
            }
        });

        this.charts.personDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['민호', '민아', '민호와 민아'],
                datasets: [{
                    data: [minhoCount, minaCount, bothCount],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(147, 51, 234, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: this.isDarkMode() ? '#1f2937' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            color: this.getTextColor()
                        }
                    }
                }
            }
        });
    }

    // 연도별 차트
    renderYearlyChart() {
        const ctx = document.getElementById('yearlyChart').getContext('2d');
        
        // 연도별 데이터 집계
        const yearlyData = {};
        this.data.memories.forEach(memory => {
            const year = new Date(memory.memory_date).getFullYear();
            yearlyData[year] = (yearlyData[year] || 0) + 1;
        });

        const years = Object.keys(yearlyData).sort();
        const data = years.map(year => yearlyData[year]);

        this.charts.yearly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: '추억 수',
                    data: data,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: this.getTextColor()
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        ticks: {
                            color: this.getTextColor()
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 태그 차트
    renderTagChart() {
        const ctx = document.getElementById('tagChart').getContext('2d');
        
        // 태그별 카운트
        const tagCounts = {};
        this.data.tags.forEach(item => {
            if (item.tags) {
                const tagName = item.tags.name;
                tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
            }
        });

        // 상위 10개 태그
        const sortedTags = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const labels = sortedTags.map(([tag]) => `#${tag}`);
        const data = sortedTags.map(([, count]) => count);

        this.charts.tags = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    label: '사용 횟수',
                    data: data,
                    backgroundColor: 'rgba(251, 146, 60, 0.8)',
                    borderColor: 'rgb(251, 146, 60)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: this.getTextColor()
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    y: {
                        ticks: {
                            color: this.getTextColor()
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 요일별 차트
    renderWeekdayChart() {
        const ctx = document.getElementById('weekdayChart').getContext('2d');
        
        // 요일별 데이터 집계
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekdayData = new Array(7).fill(0);
        
        this.data.memories.forEach(memory => {
            const day = new Date(memory.created_at).getDay();
            weekdayData[day]++;
        });

        this.charts.weekday = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: weekdays,
                datasets: [{
                    label: '추억 등록 수',
                    data: weekdayData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(99, 102, 241)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: this.getTextColor()
                        },
                        grid: {
                            color: this.getGridColor()
                        },
                        pointLabels: {
                            color: this.getTextColor()
                        }
                    }
                }
            }
        });
    }

    // 미디어 타입 차트
    renderMediaTypeChart() {
        const ctx = document.getElementById('mediaTypeChart').getContext('2d');
        
        // 미디어 타입별 카운트
        let photoCount = 0;
        let videoCount = 0;
        let noMediaCount = 0;
        
        this.data.memories.forEach(memory => {
            if (!memory.media_files || memory.media_files.length === 0) {
                noMediaCount++;
            } else {
                let hasPhoto = false;
                let hasVideo = false;
                
                memory.media_files.forEach(file => {
                    if (file.file_type === 'image') hasPhoto = true;
                    else if (file.file_type === 'video') hasVideo = true;
                });
                
                if (hasPhoto && !hasVideo) photoCount++;
                else if (!hasPhoto && hasVideo) videoCount++;
                else if (hasPhoto && hasVideo) {
                    photoCount++;
                    videoCount++;
                }
            }
        });

        this.charts.mediaType = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['사진', '동영상', '미디어 없음'],
                datasets: [{
                    data: [photoCount, videoCount, noMediaCount],
                    backgroundColor: [
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(156, 163, 175, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: this.isDarkMode() ? '#1f2937' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            color: this.getTextColor()
                        }
                    }
                }
            }
        });
    }

    // 다크모드 확인
    isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }

    // 텍스트 색상
    getTextColor() {
        return this.isDarkMode() ? '#e5e7eb' : '#374151';
    }

    // 그리드 색상
    getGridColor() {
        return this.isDarkMode() ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)';
    }

    // 로딩 표시
    showLoading() {
        // 차트 컨테이너에 스켈레톤 표시
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="skeleton w-full h-full rounded-lg"></div>';
        });
        
        // 통계 숫자 스켈레톤
        document.querySelectorAll('.stat-number').forEach(el => {
            el.innerHTML = '<div class="skeleton w-16 h-8 rounded"></div>';
        });
    }

    // 로딩 숨기기
    hideLoading() {
        // 스켈레톤 제거는 차트가 렌더링되면서 자동으로 됨
    }

    // 차트 업데이트 (다크모드 전환 시)
    updateChartsTheme() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                // 텍스트 색상 업데이트
                if (chart.options.scales) {
                    Object.values(chart.options.scales).forEach(scale => {
                        if (scale.ticks) scale.ticks.color = this.getTextColor();
                        if (scale.grid) scale.grid.color = this.getGridColor();
                        if (scale.pointLabels) scale.pointLabels.color = this.getTextColor();
                    });
                }
                
                // 범례 색상 업데이트
                if (chart.options.plugins?.legend?.labels) {
                    chart.options.plugins.legend.labels.color = this.getTextColor();
                }
                
                // 도넛/파이 차트 테두리 색상
                if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
                    chart.data.datasets[0].borderColor = this.isDarkMode() ? '#1f2937' : '#ffffff';
                }
                
                chart.update();
            }
        });
    }

    // 데이터 새로고침
    async refresh() {
        // 차트 제거
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
        
        // 재초기화
        await this.init();
    }
}

// 전역 인스턴스
let statisticsManager;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    statisticsManager = new StatisticsManager();
    
    // 다크모드 전환 감지
    const observer = new MutationObserver(() => {
        if (statisticsManager) {
            statisticsManager.updateChartsTheme();
        }
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
});

// 카운트 애니메이션
function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const value = Math.floor(start + range * progress);
        element.textContent = value;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}