// 활동 로그 관리 시스템
class ActivityLogManager {
    constructor() {
        this.logs = [];
        this.filters = {
            user: null,
            action: null,
            dateFrom: null,
            dateTo: null
        };
    }

    // 활동 로그 기록
    async log(action, resourceType, resourceId, resourceTitle, changes = null) {
        try {
            const user = (await supabaseClient.auth.getUser()).data.user;
            if (!user) return;

            const logEntry = {
                user_id: user.id,
                action: action,
                resource_type: resourceType,
                resource_id: resourceId,
                resource_title: resourceTitle,
                changes: changes,
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent
            };

            const { error } = await supabaseClient
                .from('activity_logs')
                .insert(logEntry);

            if (error) throw error;

            console.log(`Activity logged: ${action} on ${resourceType}`);
        } catch (error) {
            console.error('활동 로그 기록 실패:', error);
        }
    }

    // 클라이언트 IP 가져오기
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return null;
        }
    }

    // 활동 로그 조회
    async fetchLogs(filters = {}) {
        try {
            let query = supabaseClient
                .from('activity_logs')
                .select(`
                    *,
                    profiles!activity_logs_user_id_fkey(username, full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            // 필터 적용
            if (filters.user) {
                query = query.eq('user_id', filters.user);
            }
            if (filters.action) {
                query = query.eq('action', filters.action);
            }
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }

            const { data, error } = await query;

            if (error) throw error;

            this.logs = data || [];
            return this.logs;
        } catch (error) {
            console.error('활동 로그 조회 실패:', error);
            return [];
        }
    }

    // 활동 요약 통계
    async getActivityStats(period = '7d') {
        try {
            const dateFilter = this.getDateFilter(period);
            
            const { data, error } = await supabaseClient
                .from('activity_logs')
                .select('action')
                .gte('created_at', dateFilter);

            if (error) throw error;

            // 액션별 집계
            const stats = data.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {});

            return stats;
        } catch (error) {
            console.error('활동 통계 조회 실패:', error);
            return {};
        }
    }

    // 기간별 날짜 필터
    getDateFilter(period) {
        const now = new Date();
        switch (period) {
            case '24h':
                return new Date(now - 24 * 60 * 60 * 1000).toISOString();
            case '7d':
                return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
            case '30d':
                return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
            default:
                return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        }
    }

    // 활동 로그 UI 렌더링
    renderActivityLogUI() {
        const currentLang = localStorage.getItem('language') || 'ko';
        const langData = window[currentLang] || window.ko;

        return `
            <div class="activity-log-container p-6">
                <h2 class="text-2xl font-bold mb-6">${langData.activity_log_title || '활동 로그'}</h2>
                
                <!-- 필터 섹션 -->
                <div class="filter-section bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select id="actionFilter" onchange="activityLogManager.applyFilters()" 
                                class="form-select rounded-lg">
                            <option value="">${langData.all_actions || '모든 활동'}</option>
                            <option value="create">생성</option>
                            <option value="update">수정</option>
                            <option value="delete">삭제</option>
                            <option value="restore">복원</option>
                            <option value="share">공유</option>
                        </select>
                        
                        <input type="date" id="dateFromFilter" 
                               onchange="activityLogManager.applyFilters()"
                               class="form-input rounded-lg">
                        
                        <input type="date" id="dateToFilter" 
                               onchange="activityLogManager.applyFilters()"
                               class="form-input rounded-lg">
                        
                        <button onclick="activityLogManager.exportLogs()" 
                                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            <i class="fas fa-download mr-2"></i>
                            ${langData.export_logs || '내보내기'}
                        </button>
                    </div>
                </div>
                
                <!-- 통계 카드 -->
                <div class="stats-grid grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    ${this.renderStatCards()}
                </div>
                
                <!-- 로그 테이블 -->
                <div class="overflow-x-auto">
                    <table class="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-left">${langData.date || '날짜'}</th>
                                <th class="px-4 py-3 text-left">${langData.user || '사용자'}</th>
                                <th class="px-4 py-3 text-left">${langData.action || '활동'}</th>
                                <th class="px-4 py-3 text-left">${langData.resource || '대상'}</th>
                                <th class="px-4 py-3 text-left">${langData.details || '상세'}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${this.logs.map(log => this.renderLogRow(log)).join('')}
                        </tbody>
                    </table>
                </div>
                
                ${this.logs.length === 0 ? `
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-history text-4xl mb-4"></i>
                        <p>${langData.no_logs || '활동 로그가 없습니다.'}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 통계 카드 렌더링
    renderStatCards() {
        const stats = {
            create: 0,
            update: 0,
            delete: 0,
            restore: 0,
            share: 0
        };

        // 최근 7일 통계 계산
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.logs.forEach(log => {
            if (new Date(log.created_at) > sevenDaysAgo) {
                stats[log.action] = (stats[log.action] || 0) + 1;
            }
        });

        const cards = [
            { icon: 'fa-plus', color: 'green', label: '생성', value: stats.create },
            { icon: 'fa-edit', color: 'blue', label: '수정', value: stats.update },
            { icon: 'fa-trash', color: 'red', label: '삭제', value: stats.delete },
            { icon: 'fa-undo', color: 'yellow', label: '복원', value: stats.restore },
            { icon: 'fa-share', color: 'purple', label: '공유', value: stats.share }
        ];

        return cards.map(card => `
            <div class="stat-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <i class="fas ${card.icon} text-${card.color}-500 text-2xl"></i>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${card.label}</p>
                    </div>
                    <div class="text-2xl font-bold">${card.value}</div>
                </div>
            </div>
        `).join('');
    }

    // 로그 행 렌더링
    renderLogRow(log) {
        const date = new Date(log.created_at).toLocaleString();
        const userName = log.profiles?.full_name || log.profiles?.username || 'Unknown';
        const actionIcon = this.getActionIcon(log.action);
        const actionColor = this.getActionColor(log.action);

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-3 text-sm">${date}</td>
                <td class="px-4 py-3 text-sm">${userName}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs 
                                 bg-${actionColor}-100 text-${actionColor}-800">
                        <i class="fas ${actionIcon} mr-1"></i>
                        ${log.action}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm">${log.resource_title || '-'}</td>
                <td class="px-4 py-3 text-sm">
                    ${log.changes ? `
                        <button onclick="activityLogManager.showDetails('${log.id}')" 
                                class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }

    // 액션별 아이콘
    getActionIcon(action) {
        const icons = {
            create: 'fa-plus-circle',
            update: 'fa-edit',
            delete: 'fa-trash',
            restore: 'fa-undo',
            share: 'fa-share',
            bulk_delete: 'fa-trash-alt'
        };
        return icons[action] || 'fa-circle';
    }

    // 액션별 색상
    getActionColor(action) {
        const colors = {
            create: 'green',
            update: 'blue',
            delete: 'red',
            restore: 'yellow',
            share: 'purple',
            bulk_delete: 'red'
        };
        return colors[action] || 'gray';
    }

    // 필터 적용
    async applyFilters() {
        const filters = {
            action: document.getElementById('actionFilter')?.value,
            dateFrom: document.getElementById('dateFromFilter')?.value,
            dateTo: document.getElementById('dateToFilter')?.value
        };

        await this.fetchLogs(filters);
        this.updateUI();
    }

    // 로그 내보내기
    async exportLogs() {
        try {
            const csvContent = this.convertToCSV(this.logs);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('로그 내보내기 실패:', error);
        }
    }

    // CSV 변환
    convertToCSV(logs) {
        const headers = ['날짜', '사용자', '활동', '대상', 'IP주소', '브라우저'];
        const rows = logs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.profiles?.full_name || log.profiles?.username || 'Unknown',
            log.action,
            log.resource_title || '-',
            log.ip_address || '-',
            log.user_agent?.split(' ')[0] || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // BOM 추가 (Excel에서 한글 깨짐 방지)
        return '\uFEFF' + csvContent;
    }

    // 상세 정보 표시
    showDetails(logId) {
        const log = this.logs.find(l => l.id === logId);
        if (!log || !log.changes) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">변경 사항 상세</h3>
                <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96">
${JSON.stringify(log.changes, null, 2)}
                </pre>
                <button onclick="this.closest('.fixed').remove()" 
                        class="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    닫기
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // UI 업데이트
    updateUI() {
        const container = document.getElementById('activityLogContainer');
        if (container) {
            container.innerHTML = this.renderActivityLogUI();
        }
    }
}

// 전역 인스턴스 생성
const activityLogManager = new ActivityLogManager();
