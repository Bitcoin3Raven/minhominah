// activity-log.js - 활동 로그 관리

class ActivityLogger {
    constructor() {
        this.currentLogs = [];
        this.currentPage = 0;
        this.pageSize = 50;
        this.hasMore = false;
        this.filters = {
            action: 'all',
            resource: 'all',
            period: 'today',
            search: ''
        };
    }

    // 로그 로드
    async loadLogs(reset = true) {
        if (reset) {
            this.currentPage = 0;
            this.currentLogs = [];
        }

        const loadingSpinner = document.getElementById('loading-spinner');
        const tableBody = document.getElementById('log-table-body');
        const loadMoreBtn = document.getElementById('load-more-btn');

        loadingSpinner.style.display = 'block';

        try {
            let query = supabase
                .from('activity_logs')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false })
                .range(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize - 1);

            // 활동 필터
            if (this.filters.action !== 'all') {
                query = query.eq('action', this.filters.action);
            }

            // 리소스 필터
            if (this.filters.resource !== 'all') {
                query = query.eq('resource_type', this.filters.resource);
            }

            // 기간 필터
            const periodFilter = document.getElementById('log-period-filter').value;
            if (periodFilter !== 'all') {
                const now = new Date();
                let startDate;

                switch (periodFilter) {
                    case 'today':
                        startDate = new Date(now.setHours(0, 0, 0, 0));
                        break;
                    case 'week':
                        startDate = new Date(now.setDate(now.getDate() - 7));
                        break;
                    case 'month':
                        startDate = new Date(now.setMonth(now.getMonth() - 1));
                        break;
                }

                if (startDate) {
                    query = query.gte('created_at', startDate.toISOString());
                }
            }

            const { data: logs, error, count } = await query;

            if (error) throw error;

            this.currentLogs = reset ? logs : [...this.currentLogs, ...logs];
            this.hasMore = (this.currentPage + 1) * this.pageSize < count;

            loadingSpinner.style.display = 'none';

            if (reset) {
                tableBody.innerHTML = '';
            }

            // 검색 필터 적용
            let filteredLogs = this.currentLogs;
            if (this.filters.search) {
                filteredLogs = this.currentLogs.filter(log => {
                    return log.resource_title?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                           log.details?.toString().toLowerCase().includes(this.filters.search.toLowerCase());
                });
            }

            this.renderLogs(filteredLogs, reset);
            
            loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';

        } catch (error) {
            console.error('Load logs error:', error);
            loadingSpinner.style.display = 'none';
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 로그 렌더링
    renderLogs(logs, reset = false) {
        const tableBody = document.getElementById('log-table-body');
        
        if (reset) {
            tableBody.innerHTML = '';
        }

        logs.forEach(log => {
            const row = this.createLogRow(log);
            tableBody.appendChild(row);
        });

        if (logs.length === 0 && reset) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="empty-message">
                    ${window.translations[currentLang].no_logs_found}
                </td>
            `;
            tableBody.appendChild(emptyRow);
        }
    }

    // 로그 행 생성
    createLogRow(log) {
        const row = document.createElement('tr');
        
        // 시간 포맷
        const date = new Date(log.created_at);
        const timeStr = date.toLocaleString();

        // 활동 아이콘
        const actionIcons = {
            create: 'fa-plus-circle text-success',
            update: 'fa-edit text-info',
            delete: 'fa-trash text-danger',
            restore: 'fa-undo text-warning',
            bulk_action: 'fa-tasks text-primary',
            share: 'fa-share text-info',
            download: 'fa-download text-secondary'
        };

        // 리소스 아이콘
        const resourceIcons = {
            memory: 'fa-image',
            media_file: 'fa-file-image',
            tag: 'fa-tag',
            comment: 'fa-comment'
        };

        // 상세 내용 포맷
        let detailsHtml = '';
        if (log.details) {
            if (typeof log.details === 'object') {
                detailsHtml = this.formatDetails(log.details);
            } else {
                detailsHtml = log.details;
            }
        }

        row.innerHTML = `
            <td class="log-time">${timeStr}</td>
            <td class="log-user">${log.profiles?.full_name || 'Unknown'}</td>
            <td class="log-action">
                <i class="fas ${actionIcons[log.action] || 'fa-question'}"></i>
                <span>${window.translations[currentLang][`action_${log.action}`] || log.action}</span>
            </td>
            <td class="log-resource">
                <i class="fas ${resourceIcons[log.resource_type] || 'fa-file'}"></i>
                <span>${window.translations[currentLang][`resource_${log.resource_type}`] || log.resource_type}</span>
                ${log.resource_title ? `<br><small>${log.resource_title}</small>` : ''}
            </td>
            <td class="log-details">${detailsHtml}</td>
        `;

        return row;
    }

    // 상세 내용 포맷
    formatDetails(details) {
        let html = '<div class="log-details-content">';
        
        if (details.action) {
            html += `<div><strong>작업:</strong> ${details.action}</div>`;
        }
        
        if (details.count) {
            html += `<div><strong>개수:</strong> ${details.count}개</div>`;
        }
        
        if (details.tags) {
            html += `<div><strong>태그:</strong> ${details.tags.join(', ')}</div>`;
        }
        
        if (details.changes) {
            html += '<div><strong>변경사항:</strong></div>';
            html += '<ul class="changes-list">';
            for (const [field, value] of Object.entries(details.changes)) {
                html += `<li>${field}: ${value}</li>`;
            }
            html += '</ul>';
        }
        
        html += '</div>';
        return html;
    }

    // 통계 로드
    async loadStats() {
        try {
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const weekStart = new Date(now.setDate(now.getDate() - 7));

            // 오늘 활동
            const { count: todayCount } = await supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart.toISOString());

            document.getElementById('today-activities').textContent = todayCount || 0;

            // 이번 주 활동
            const { count: weekCount } = await supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekStart.toISOString());

            document.getElementById('week-activities').textContent = weekCount || 0;

            // 활성 사용자
            const { data: activeUsers } = await supabase
                .from('activity_logs')
                .select('user_id')
                .gte('created_at', weekStart.toISOString());

            const uniqueUsers = new Set(activeUsers?.map(log => log.user_id) || []);
            document.getElementById('active-users').textContent = uniqueUsers.size;

            // 총 업로드
            const { count: uploadCount } = await supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('action', 'create')
                .eq('resource_type', 'media_file');

            document.getElementById('total-uploads').textContent = uploadCount || 0;

        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    // 더 보기
    loadMore() {
        this.currentPage++;
        this.loadLogs(false);
    }

    // 검색
    searchLogs(query) {
        this.filters.search = query;
        this.renderLogs(this.currentLogs.filter(log => {
            return log.resource_title?.toLowerCase().includes(query.toLowerCase()) ||
                   log.details?.toString().toLowerCase().includes(query.toLowerCase());
        }), true);
    }

    // 로그 내보내기
    async exportLogs() {
        try {
            showNotification(window.translations[currentLang].msg_preparing_export, 'info');

            // 모든 로그 가져오기
            const { data: logs, error } = await supabase
                .from('activity_logs')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // CSV 생성
            const csv = this.generateCSV(logs);
            
            // 다운로드
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            showNotification(window.translations[currentLang].msg_export_success, 'success');

        } catch (error) {
            console.error('Export logs error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // CSV 생성
    generateCSV(logs) {
        const headers = ['시간', '사용자', '활동', '리소스 타입', '리소스 제목', '상세 내용'];
        const rows = logs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.profiles?.full_name || 'Unknown',
            log.action,
            log.resource_type,
            log.resource_title || '',
            JSON.stringify(log.details || {})
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // BOM 추가 (한글 깨짐 방지)
        return '\ufeff' + csvContent;
    }
}

// 전역 인스턴스 생성
window.activityLogger = new ActivityLogger();
