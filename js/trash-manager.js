// trash-manager.js - 휴지통 관리

class TrashManager {
    constructor() {
        this.currentItems = [];
        this.selectedItem = null;
        this.filters = {
            type: 'all',
            date: 'all',
            search: ''
        };
    }

    // 휴지통 항목 로드
    async loadTrashItems() {
        const loadingSpinner = document.getElementById('loading-spinner');
        const trashGrid = document.getElementById('trash-items');
        const emptyState = document.getElementById('empty-state');

        loadingSpinner.style.display = 'block';
        trashGrid.innerHTML = '';
        emptyState.style.display = 'none';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            let query = supabase
                .from('trash')
                .select('*')
                .eq('deleted_by', user.id)
                .order('deleted_at', { ascending: false });

            // 타입 필터
            if (this.filters.type !== 'all') {
                query = query.eq('resource_type', this.filters.type);
            }

            // 날짜 필터
            const dateFilter = document.getElementById('trash-date-filter').value;
            if (dateFilter !== 'all') {
                const now = new Date();
                let startDate;

                switch (dateFilter) {
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
                    query = query.gte('deleted_at', startDate.toISOString());
                }
            }

            const { data: items, error } = await query;

            if (error) throw error;

            this.currentItems = items || [];

            // 검색 필터 적용
            if (this.filters.search) {
                this.currentItems = this.currentItems.filter(item => {
                    const data = item.original_data;
                    return data.title?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                           data.description?.toLowerCase().includes(this.filters.search.toLowerCase());
                });
            }

            loadingSpinner.style.display = 'none';

            if (this.currentItems.length === 0) {
                emptyState.style.display = 'flex';
            } else {
                this.renderTrashItems();
            }

        } catch (error) {
            console.error('Load trash items error:', error);
            loadingSpinner.style.display = 'none';
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 휴지통 항목 렌더링
    renderTrashItems() {
        const trashGrid = document.getElementById('trash-items');
        
        this.currentItems.forEach(item => {
            const card = this.createTrashCard(item);
            trashGrid.appendChild(card);
        });
    }

    // 휴지통 카드 생성
    createTrashCard(item) {
        const data = item.original_data;
        const card = document.createElement('div');
        card.className = 'trash-card';
        card.dataset.trashId = item.id;

        // 만료까지 남은 일수 계산
        const expiresAt = new Date(item.expires_at);
        const now = new Date();
        const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        // 썸네일 가져오기
        let thumbnail = '';
        if (data.media_files && data.media_files.length > 0) {
            const firstMedia = data.media_files[0];
            if (firstMedia.thumbnail_path) {
                const { data: url } = supabase.storage
                    .from('media')
                    .getPublicUrl(firstMedia.thumbnail_path);
                thumbnail = url.publicUrl;
            }
        }

        card.innerHTML = `
            <div class="trash-card-header">
                <div class="trash-type-badge">
                    <i class="fas ${item.original_table === 'memories' ? 'fa-image' : 'fa-file'}"></i>
                    <span>${item.original_table === 'memories' ? '추억' : '파일'}</span>
                </div>
                <div class="trash-days-left ${daysLeft <= 7 ? 'warning' : ''}">
                    <i class="fas fa-clock"></i>
                    <span>${daysLeft}일 후 삭제</span>
                </div>
            </div>
            
            ${thumbnail ? `
                <div class="trash-thumbnail">
                    <img src="${thumbnail}" alt="${data.title || 'Thumbnail'}">
                </div>
            ` : ''}
            
            <div class="trash-card-body">
                <h4 class="trash-title">${data.title || '제목 없음'}</h4>
                <p class="trash-description">${data.description || ''}</p>
                
                <div class="trash-meta">
                    <span class="trash-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(item.deleted_at).toLocaleDateString()}
                    </span>
                    ${data.location ? `
                        <span class="trash-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${data.location}
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div class="trash-card-actions">
                <button class="btn btn-sm btn-primary" onclick="trashManager.restoreItem('${item.id}')">
                    <i class="fas fa-undo"></i>
                    <span data-translate="btn_restore">복원</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="trashManager.permanentDelete('${item.id}')">
                    <i class="fas fa-trash"></i>
                    <span data-translate="btn_delete_permanent">영구 삭제</span>
                </button>
            </div>
        `;

        return card;
    }

    // 항목 복원
    async restoreItem(trashId) {
        this.selectedItem = trashId;
        document.getElementById('restore-modal').style.display = 'flex';
    }

    // 복원 확인
    async confirmRestore() {
        if (!this.selectedItem) return;

        try {
            // 휴지통 항목 가져오기
            const { data: trashItem, error: fetchError } = await supabase
                .from('trash')
                .select('*')
                .eq('id', this.selectedItem)
                .single();

            if (fetchError) throw fetchError;

            // 원본 테이블에 복원
            const { error: restoreError } = await supabase
                .from(trashItem.original_table)
                .insert(trashItem.original_data);

            if (restoreError) throw restoreError;

            // 휴지통에서 삭제
            const { error: deleteError } = await supabase
                .from('trash')
                .delete()
                .eq('id', this.selectedItem);

            if (deleteError) throw deleteError;

            // 활동 로그
            await this.logActivity('restore', trashItem.original_table, trashItem.original_id, {
                title: trashItem.original_data.title
            });

            showNotification(window.translations[currentLang].msg_restore_success, 'success');
            this.loadTrashItems();
            
            // 메인 페이지의 휴지통 카운트 업데이트
            if (window.photoManager) {
                window.photoManager.loadTrashCount();
            }

        } catch (error) {
            console.error('Restore item error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 영구 삭제
    async permanentDelete(trashId) {
        if (!confirm(window.translations[currentLang].msg_confirm_permanent_delete)) return;

        try {
            const { error } = await supabase
                .from('trash')
                .delete()
                .eq('id', trashId);

            if (error) throw error;

            // 활동 로그
            await this.logActivity('delete', 'trash', trashId, {
                action: 'permanent_delete'
            });

            showNotification(window.translations[currentLang].msg_permanent_delete_success, 'success');
            this.loadTrashItems();

        } catch (error) {
            console.error('Permanent delete error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 휴지통 비우기
    async emptyTrash() {
        if (!confirm(window.translations[currentLang].msg_confirm_empty_trash)) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('trash')
                .delete()
                .eq('deleted_by', user.id);

            if (error) throw error;

            // 활동 로그
            await this.logActivity('bulk_action', 'trash', null, {
                action: 'empty_trash'
            });

            showNotification(window.translations[currentLang].msg_trash_emptied, 'success');
            this.loadTrashItems();

        } catch (error) {
            console.error('Empty trash error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 검색
    searchTrash(query) {
        this.filters.search = query;
        this.loadTrashItems();
    }

    // 활동 로그 기록
    async logActivity(action, resourceType, resourceId, details = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            await supabase
                .from('activity_logs')
                .insert({
                    user_id: user.id,
                    action: action,
                    resource_type: resourceType,
                    resource_id: resourceId,
                    details: details,
                    user_agent: navigator.userAgent
                });
        } catch (error) {
            console.error('Log activity error:', error);
        }
    }
}

// 전역 인스턴스 생성
window.trashManager = new TrashManager();
