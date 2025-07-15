// bulk-operations.js - 일괄 작업 관리

class BulkOperations {
    constructor() {
        this.selectedItems = new Set();
        this.bulkMode = false;
        this.currentOperation = null;
    }

    // 일괄 모드 토글
    toggleBulkMode() {
        this.bulkMode = !this.bulkMode;
        const bulkControls = document.getElementById('bulk-controls');
        const bulkModeBtn = document.getElementById('bulk-mode-btn');
        
        if (this.bulkMode) {
            bulkControls.style.display = 'flex';
            bulkModeBtn.classList.add('active');
            this.showCheckboxes();
            this.updateSelectedCount();
        } else {
            bulkControls.style.display = 'none';
            bulkModeBtn.classList.remove('active');
            this.hideCheckboxes();
            this.clearSelection();
        }
    }

    // 체크박스 표시
    showCheckboxes() {
        document.querySelectorAll('.memory-card').forEach(card => {
            const checkbox = document.createElement('div');
            checkbox.className = 'bulk-checkbox';
            checkbox.innerHTML = '<input type="checkbox" class="bulk-select-item">';
            checkbox.addEventListener('change', (e) => {
                const memoryId = card.dataset.memoryId;
                if (e.target.checked) {
                    this.selectedItems.add(memoryId);
                    card.classList.add('bulk-selected');
                } else {
                    this.selectedItems.delete(memoryId);
                    card.classList.remove('bulk-selected');
                }
                this.updateSelectedCount();
            });
            card.appendChild(checkbox);
        });
    }

    // 체크박스 숨기기
    hideCheckboxes() {
        document.querySelectorAll('.bulk-checkbox').forEach(checkbox => {
            checkbox.remove();
        });
        document.querySelectorAll('.bulk-selected').forEach(card => {
            card.classList.remove('bulk-selected');
        });
    }

    // 전체 선택
    selectAll() {
        document.querySelectorAll('.memory-card').forEach(card => {
            const memoryId = card.dataset.memoryId;
            const checkbox = card.querySelector('.bulk-select-item');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                this.selectedItems.add(memoryId);
                card.classList.add('bulk-selected');
            }
        });
        this.updateSelectedCount();
    }

    // 전체 선택 해제
    deselectAll() {
        this.clearSelection();
        document.querySelectorAll('.bulk-select-item').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.querySelectorAll('.bulk-selected').forEach(card => {
            card.classList.remove('bulk-selected');
        });
        this.updateSelectedCount();
    }

    // 선택 초기화
    clearSelection() {
        this.selectedItems.clear();
    }

    // 선택된 개수 업데이트
    updateSelectedCount() {
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = `${this.selectedItems.size}${window.translations[currentLang].selected_items}`;
        }
        
        // 버튼 활성화/비활성화
        const bulkActionButtons = document.querySelectorAll('.bulk-action-btn');
        bulkActionButtons.forEach(btn => {
            btn.disabled = this.selectedItems.size === 0;
        });
    }

    // 일괄 삭제
    async bulkDelete() {
        if (this.selectedItems.size === 0) {
            showNotification(window.translations[currentLang].msg_no_items_selected, 'warning');
            return;
        }

        const confirmMsg = window.translations[currentLang].msg_confirm_bulk_delete
            .replace('{count}', this.selectedItems.size);
        
        if (!confirm(confirmMsg)) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const selectedArray = Array.from(this.selectedItems);
            
            // 일괄 작업 기록 생성
            const { data: bulkOp, error: bulkError } = await supabase
                .from('bulk_operations')
                .insert({
                    operation_type: 'delete',
                    affected_items: selectedArray,
                    performed_by: user.id,
                    status: 'processing'
                })
                .select()
                .single();

            if (bulkError) throw bulkError;

            // 각 항목을 휴지통으로 이동
            const results = await Promise.all(
                selectedArray.map(async (memoryId) => {
                    try {
                        // 원본 데이터 가져오기
                        const { data: memory, error: fetchError } = await supabase
                            .from('memories')
                            .select('*')
                            .eq('id', memoryId)
                            .single();

                        if (fetchError) throw fetchError;

                        // 휴지통에 추가
                        const { error: trashError } = await supabase
                            .from('trash')
                            .insert({
                                resource_type: 'memory',
                                resource_id: memoryId,
                                original_data: memory,
                                deleted_by: user.id
                            });

                        if (trashError) throw trashError;

                        // 원본 삭제
                        const { error: deleteError } = await supabase
                            .from('memories')
                            .delete()
                            .eq('id', memoryId);

                        if (deleteError) throw deleteError;

                        return { success: true, memoryId };
                    } catch (error) {
                        console.error(`Error deleting memory ${memoryId}:`, error);
                        return { success: false, memoryId, error };
                    }
                })
            );

            // 결과 집계
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            // 일괄 작업 상태 업데이트
            await supabase
                .from('bulk_operations')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    error_message: failCount > 0 ? `${failCount} items failed` : null
                })
                .eq('id', bulkOp.id);

            // 활동 로그
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'bulk_delete',
                count: selectedArray.length,
                success_count: successCount,
                fail_count: failCount
            });

            showNotification(window.translations[currentLang].msg_bulk_delete_success, 'success');
            
            // UI 업데이트
            this.toggleBulkMode();
            if (window.memoryManager) {
                window.memoryManager.loadMemories();
            }

        } catch (error) {
            console.error('Bulk delete error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 일괄 태그 추가
    async bulkAddTags() {
        if (this.selectedItems.size === 0) {
            showNotification(window.translations[currentLang].msg_no_items_selected, 'warning');
            return;
        }

        // 태그 추가 모달 표시
        document.getElementById('bulk-tag-modal').style.display = 'flex';
    }

    // 태그 적용
    async applyBulkTags() {
        const tagInput = document.getElementById('bulk-tag-input').value;
        const replaceTags = document.getElementById('replace-tags').checked;

        if (!tagInput.trim()) {
            showNotification('태그를 입력해주세요', 'warning');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
            const selectedArray = Array.from(this.selectedItems);

            // 일괄 작업 기록 생성
            const { data: bulkOp, error: bulkError } = await supabase
                .from('bulk_operations')
                .insert({
                    operation_type: 'tag',
                    affected_items: selectedArray,
                    performed_by: user.id,
                    status: 'processing',
                    details: { tags, replace: replaceTags }
                })
                .select()
                .single();

            if (bulkError) throw bulkError;

            // 각 항목에 태그 추가
            const results = await Promise.all(
                selectedArray.map(async (memoryId) => {
                    try {
                        // 기존 태그 처리
                        if (replaceTags) {
                            await supabase
                                .from('memory_tags')
                                .delete()
                                .eq('memory_id', memoryId);
                        }

                        // 새 태그 추가
                        for (const tagName of tags) {
                            // 태그가 없으면 생성
                            let { data: tag } = await supabase
                                .from('tags')
                                .select('id')
                                .eq('name', tagName)
                                .single();

                            if (!tag) {
                                const { data: newTag, error } = await supabase
                                    .from('tags')
                                    .insert({ name: tagName })
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                tag = newTag;
                            }

                            // 태그 연결
                            await supabase
                                .from('memory_tags')
                                .insert({
                                    memory_id: memoryId,
                                    tag_id: tag.id
                                });
                        }

                        return { success: true, memoryId };
                    } catch (error) {
                        console.error(`Error tagging memory ${memoryId}:`, error);
                        return { success: false, memoryId, error };
                    }
                })
            );

            // 일괄 작업 상태 업데이트
            const successCount = results.filter(r => r.success).length;
            await supabase
                .from('bulk_operations')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', bulkOp.id);

            // 활동 로그
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'bulk_tag',
                count: selectedArray.length,
                tags: tags,
                success_count: successCount
            });

            showNotification(window.translations[currentLang].msg_bulk_tag_success, 'success');
            
            // 모달 닫기 및 UI 업데이트
            document.getElementById('bulk-tag-modal').style.display = 'none';
            document.getElementById('bulk-tag-input').value = '';
            document.getElementById('replace-tags').checked = false;
            
            this.toggleBulkMode();
            if (window.memoryManager) {
                window.memoryManager.loadMemories();
            }

        } catch (error) {
            console.error('Bulk tag error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 일괄 내보내기
    async bulkExport() {
        if (this.selectedItems.size === 0) {
            showNotification(window.translations[currentLang].msg_no_items_selected, 'warning');
            return;
        }

        try {
            showNotification(window.translations[currentLang].msg_preparing_export, 'info');
            
            const selectedArray = Array.from(this.selectedItems);
            const exportData = [];

            // 선택된 항목들의 데이터 수집
            for (const memoryId of selectedArray) {
                const { data: memory, error } = await supabase
                    .from('memories')
                    .select(`
                        *,
                        media_files(*),
                        memory_people(people(*)),
                        memory_tags(tags(*))
                    `)
                    .eq('id', memoryId)
                    .single();

                if (!error && memory) {
                    exportData.push(memory);
                }
            }

            // JSON 파일로 내보내기
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `memories_export_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            // 활동 로그
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'bulk_export',
                count: exportData.length
            });

            showNotification(window.translations[currentLang].msg_export_success, 'success');

        } catch (error) {
            console.error('Bulk export error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 일괄 앨범 추가
    async bulkAddToAlbum() {
        if (this.selectedItems.size === 0) {
            showNotification(window.translations[currentLang].msg_no_items_selected, 'warning');
            return;
        }

        // 앨범 선택 모달 표시
        await this.loadAlbums();
        document.getElementById('bulk-album-modal').style.display = 'flex';
    }

    // 앨범 목록 로드
    async loadAlbums() {
        try {
            const { data: albums, error } = await supabase
                .from('albums')
                .select('*')
                .order('name');

            if (error) throw error;

            const albumSelect = document.getElementById('album-select');
            albumSelect.innerHTML = '<option value="">선택하세요</option>';
            
            albums.forEach(album => {
                const option = document.createElement('option');
                option.value = album.id;
                option.textContent = album.name;
                albumSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Load albums error:', error);
        }
    }

    // 앨범에 추가
    async addToAlbum() {
        const albumId = document.getElementById('album-select').value;
        if (!albumId) {
            showNotification('앨범을 선택해주세요', 'warning');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const selectedArray = Array.from(this.selectedItems);

            // 각 항목을 앨범에 추가
            const promises = selectedArray.map(memoryId => 
                supabase
                    .from('album_memories')
                    .insert({
                        album_id: albumId,
                        memory_id: memoryId,
                        added_by: user.id
                    })
            );

            await Promise.all(promises);

            // 활동 로그
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'bulk_album_add',
                count: selectedArray.length,
                album_id: albumId
            });

            showNotification('앨범에 추가되었습니다', 'success');
            
            // 모달 닫기
            document.getElementById('bulk-album-modal').style.display = 'none';
            this.toggleBulkMode();

        } catch (error) {
            console.error('Add to album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
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
window.bulkOperations = new BulkOperations();
