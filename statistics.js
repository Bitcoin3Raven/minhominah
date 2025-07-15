// statistics.js - 고급 통계 차트
import { supabase } from './supabase-client.js';

class StatisticsManager {
    constructor() {
        this.charts = {};
        this.currentYear = new Date().getFullYear();
        this.selectedChild = 'all';
        this.initialize();
    }

    async initialize() {
        if (!await this.checkAuth()) return;
        
        this.setupEventListeners();
        await this.loadStatistics();
    }

    async checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // 년도 선택
        document.getElementById('yearSelect').addEventListener('change', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.loadStatistics();
        });

        // 아이 선택
        document.getElementById('childSelect').addEventListener('change', (e) => {
            this.selectedChild = e.target.value;
            this.loadStatistics();
        });

        // 탭 전환
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => {
                    b.classList.remove('active', 'bg-blue-500', 'text-white');
                    b.classList.add('bg-gray-200', 'text-gray-700');
                });
                button.classList.add('active', 'bg-blue-500', 'text-white');
                button.classList.remove('bg-gray-200', 'text-gray-700');
                
                const tab = button.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(`${tab}Tab`).classList.remove('hidden');
            });
        });
    }

    async loadStatistics() {
        try {
            // 추억 데이터 로드
            let query = supabase
                .from('memories')
                .select(`
                    *,
                    memory_people(people(*)),
                    memory_tags(tags(*))
                `)
                .gte('memory_date', `${this.currentYear}-01-01`)
                .lte('memory_date', `${this.currentYear}-12-31`);

            // 아이 필터링
            if (this.selectedChild !== 'all') {
                query = query.contains('memory_people', [{ person_id: this.selectedChild }]);
            }

            const { data: memories, error } = await query;
            if (error) throw error;

            // 통계 데이터 계산
            const stats = this.calculateStatistics(memories);
            
            // 차트 업데이트
            this.updateCharts(stats);
            
            // 요약 정보 업데이트
            this.updateSummary(stats);
            
        } catch (error) {
            console.error('통계 로드 오류:', error);
            this.showError('통계 데이터를 불러오는데 실패했습니다.');
        }
    }

    calculateStatistics(memories) {
        const stats = {
            monthlyCount: Array(12).fill(0),
            tagDistribution: {},
            mediaTypes: { image: 0, video: 0 },
            topLocations: {},
            growthMilestones: [],
            totalMemories: memories.length,
            averagePerMonth: 0
        };

        // 월별 추억 수 계산
        memories.forEach(memory => {
            const month = new Date(memory.memory_date).getMonth();
            stats.monthlyCount[month]++;

            // 태그 분포
            memory.memory_tags?.forEach(mt => {
                const tagName = mt.tags.name;
                stats.tagDistribution[tagName] = (stats.tagDistribution[tagName] || 0) + 1;
            });

            // 위치 통계
            if (memory.location) {
                stats.topLocations[memory.location] = (stats.topLocations[memory.location] || 0) + 1;
            }
        });

        stats.averagePerMonth = (stats.totalMemories / 12).toFixed(1);

        return stats;
    }

    updateCharts(stats) {
        // 월별 추억 차트
        this.updateMonthlyChart(stats.monthlyCount);
        
        // 태그 분포 차트
        this.updateTagChart(stats.tagDistribution);
        
        // 위치 통계 차트
        this.updateLocationChart(stats.topLocations);
        
        // 연간 비교 차트
        this.updateYearlyComparison();
    }

    updateMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                datasets: [{
                    label: '추억 수',
                    data: monthlyData,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `추억: ${context.parsed.y}개`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateTagChart(tagData) {
        const ctx = document.getElementById('tagChart').getContext('2d');
        
        if (this.charts.tag) {
            this.charts.tag.destroy();
        }

        const sortedTags = Object.entries(tagData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        this.charts.tag = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedTags.map(([tag]) => tag),
                datasets: [{
                    data: sortedTags.map(([,count]) => count),
                    backgroundColor: [
                        '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#6366F1',
                        '#EF4444', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 10,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    updateLocationChart(locationData) {
        const ctx = document.getElementById('locationChart').getContext('2d');
        
        if (this.charts.location) {
            this.charts.location.destroy();
        }

        const sortedLocations = Object.entries(locationData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        this.charts.location = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedLocations.map(([location]) => location),
                datasets: [{
                    label: '방문 횟수',
                    data: sortedLocations.map(([,count]) => count),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    async updateYearlyComparison() {
        try {
            const currentYear = this.currentYear;
            const years = [currentYear - 2, currentYear - 1, currentYear];
            const yearlyData = [];

            for (const year of years) {
                const { data, error } = await supabase
                    .from('memories')
                    .select('id', { count: 'exact' })
                    .gte('memory_date', `${year}-01-01`)
                    .lte('memory_date', `${year}-12-31`);
                
                if (!error) {
                    yearlyData.push(data.length);
                } else {
                    yearlyData.push(0);
                }
            }

            const ctx = document.getElementById('yearlyChart').getContext('2d');
            
            if (this.charts.yearly) {
                this.charts.yearly.destroy();
            }

            this.charts.yearly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: years.map(y => `${y}년`),
                    datasets: [{
                        label: '연간 추억 수',
                        data: yearlyData,
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(59, 130, 246, 0.8)'
                        ],
                        borderColor: [
                            'rgb(239, 68, 68)',
                            'rgb(245, 158, 11)',
                            'rgb(59, 130, 246)'
                        ],
                        borderWidth: 1
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
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('연간 비교 차트 오류:', error);
        }
    }

    updateSummary(stats) {
        // 요약 카드 업데이트
        document.getElementById('totalMemories').textContent = stats.totalMemories;
        document.getElementById('avgPerMonth').textContent = stats.averagePerMonth;
        
        // 가장 많은 태그
        const topTag = Object.entries(stats.tagDistribution)
            .sort(([,a], [,b]) => b - a)[0];
        document.getElementById('topTag').textContent = topTag ? topTag[0] : '없음';
        
        // 가장 많이 방문한 장소
        const topLocation = Object.entries(stats.topLocations)
            .sort(([,a], [,b]) => b - a)[0];
        document.getElementById('topLocation').textContent = topLocation ? topLocation[0] : '없음';
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => alertDiv.remove(), 3000);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new StatisticsManager();
});