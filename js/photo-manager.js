// photo-manager.js - 사진 관리 고급 기능

class PhotoManager {
    constructor() {
        this.selectedItems = new Set();
        this.bulkMode = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupBulkOperations();
        this.loadTrashCount();
    }

    setupEventListeners() {
        // 벌크 모드 토글
        const bulkToggle = document.getElementById('bulk-mode-toggle');
        if (bulkToggle) {
            bulkToggle.addEventListener('change', () => this.toggleBulkMode());
        }

        // 전체 선택
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAll());
        }

        // 선택 해제
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.deselectAll());
        }
    }

    setupBulkOperations() {
        // 벌크 작업 버튼들
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDelete());
        }

        const bulkTagBtn = document.getElementById('bulk-tag-btn');
        if (bulkTagBtn) {
            bulkTagBtn.addEventListener('click', () => this.bulkTag());
        }

        const bulkExportBtn = document.getElementById('bulk-export-btn');
        if (bulkExportBtn) {
            bulkExportBtn.addEventListener('click', () => this.bulkExport());
        }

        const bulkAlbumBtn = document.getElementById('bulk-album-btn');
        if (bulkAlbumBtn) {
            bulkAlbumBtn.addEventListener('click', () => this.bulkAddToAlbum());
        }
    }

    // 벌크 모드 토글
    toggleBulkMode() {
        this.bulkMode = !this.bulkMode;
        document.body.classList.toggle('bulk-mode', this.bulkMode);
        
        if (!this.bulkMode) {
            this.deselectAll();
        }

        // 모든 메모리 카드에 체크박스 추가/제거
        const memoryCards = document.querySelectorAll('.memory-card');
        memoryCards.forEach(card => {
            if (this.bulkMode) {
                this.addCheckbox(card);
            } else {
                this.removeCheckbox(card);
            }
        });

        this.updateBulkToolbar();
    }

    // 체크박스 추가
    addCheckbox(card) {
        if (card.querySelector('.bulk-checkbox')) return;

        const checkbox = document.createElement('div');
        checkbox.className = 'bulk-checkbox';
        checkbox.innerHTML = '<input type="checkbox" class="memory-checkbox">';
        card.appendChild(checkbox);

        const input = checkbox.querySelector('input');
        const memoryId = card.dataset.memoryId;

        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedItems.add(memoryId);
                card.classList.add('selected');
            } else {
                this.selectedItems.delete(memoryId);
                card.classList.remove('selected');
            }
            this.updateBulkToolbar();
        });
    }

    // 체크박스 제거
    removeCheckbox(card) {
        const checkbox = card.querySelector('.bulk-checkbox');
        if (checkbox) {
            checkbox.remove();
            card.classList.remove('selected');
        }
    }

    // 전체 선택
    selectAll() {
        const checkboxes = document.querySelectorAll('.memory-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const card = checkbox.closest('.memory-card');
            const memoryId = card.dataset.memoryId;
            this.selectedItems.add(memoryId);
            card.classList.add('selected');
        });
        this.updateBulkToolbar();
    }

    // 전체 해제
    deselectAll() {
        const checkboxes = document.querySelectorAll('.memory-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const card = checkbox.closest('.memory-card');
            card.classList.remove('selected');
        });
        this.selectedItems.clear();
        this.updateBulkToolbar();
    }

    // 벌크 툴바 업데이트
    updateBulkToolbar() {
        const toolbar = document.getElementById('bulk-toolbar');
        const selectedCount = document.getElementById('selected-count');
        
        if (toolbar) {
            toolbar.style.display = this.selectedItems.size > 0 ? 'flex' : 'none';
        }
        
        if (selectedCount) {
            selectedCount.textContent = this.selectedItems.size;
        }
    }

    // 벌크 삭제 (휴지통으로 이동)
    async bulkDelete() {
        if (this.selectedItems.size === 0) return;

        const confirmMsg = window.translations[currentLang].msg_confirm_bulk_delete.replace('{count}', this.selectedItems.size);
        if (!confirm(confirmMsg)) return;

        try {
            const promises = Array.from(this.selectedItems).map(memoryId => 
                this.moveToTrash(memoryId)
            );

            await Promise.all(promises);

            // 활동 로그 기록
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'delete',
                count: this.selectedItems.size,
                items: Array.from(this.selectedItems)
            });

            showNotification(window.translations[currentLang].msg_bulk_delete_success, 'success');
            this.deselectAll();
            loadMemories(); // 메모리 목록 새로고침
            this.loadTrashCount();
        } catch (error) {
            console.error('Bulk delete error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 휴지통으로 이동
    async moveToTrash(memoryId) {
        try {
            // 원본 데이터 가져오기
            const { data: memory, error: fetchError } = await supabase
                .from('memories')
                .select('*, media_files(*), memory_people(*), memory_tags(*)')
                .eq('id', memoryId)
                .single();

            if (fetchError) throw fetchError;

            // 휴지통에 저장
            const { error: trashError } = await supabase
                .from('trash')
                .insert({
                    original_table: 'memories',
                    original_id: memoryId,
                    original_data: memory,
                    deleted_by: (await supabase.auth.getUser()).data.user.id
                });

            if (trashError) throw trashError;

            // 원본 삭제
            const { error: deleteError } = await supabase
                .from('memories')
                .delete()
                .eq('id', memoryId);

            if (deleteError) throw deleteError;

        } catch (error) {
            console.error('Move to trash error:', error);
            throw error;
        }
    }

    // 벌크 태그 추가
    async bulkTag() {
        if (this.selectedItems.size === 0) return;

        const modal = this.createTagModal();
        document.body.appendChild(modal);
    }

    // 태그 모달 생성
    createTagModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${window.translations[currentLang].bulk_tag_title}</h3>
                <div class="form-group">
                    <label>${window.translations[currentLang].tag_input_label}</label>
                    <input type="text" id="bulk-tag-input" placeholder="${window.translations[currentLang].tag_placeholder}">
                    <small>${window.translations[currentLang].tag_help}</small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="replace-tags"> 
                        ${window.translations[currentLang].replace_existing_tags}
                    </label>
                </div>
                <div class="modal-buttons">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        ${window.translations[currentLang].btn_cancel}
                    </button>
                    <button class="btn-primary" onclick="photoManager.applyBulkTags()">
                        ${window.translations[currentLang].btn_apply}
                    </button>
                </div>
            </div>
        `;
        return modal;
    }

    // 벌크 태그 적용
    async applyBulkTags() {
        const tagInput = document.getElementById('bulk-tag-input').value;
        const replaceTags = document.getElementById('replace-tags').checked;
        
        if (!tagInput.trim()) return;

        const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);

        try {
            for (const memoryId of this.selectedItems) {
                if (replaceTags) {
                    // 기존 태그 삭제
                    await supabase
                        .from('memory_tags')
                        .delete()
                        .eq('memory_id', memoryId);
                }

                // 새 태그 추가
                for (const tagName of tags) {
                    // 태그가 없으면 생성
                    const { data: tag } = await supabase
                        .from('tags')
                        .upsert({ name: tagName })
                        .select()
                        .single();

                    // 메모리-태그 연결
                    await supabase
                        .from('memory_tags')
                        .upsert({
                            memory_id: memoryId,
                            tag_id: tag.id
                        });
                }
            }

            // 활동 로그
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'tag',
                count: this.selectedItems.size,
                tags: tags,
                replace: replaceTags
            });

            showNotification(window.translations[currentLang].msg_bulk_tag_success, 'success');
            document.querySelector('.modal-overlay').remove();
            this.deselectAll();
            loadMemories();
        } catch (error) {
            console.error('Bulk tag error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 벌크 내보내기
    async bulkExport() {
        if (this.selectedItems.size === 0) return;

        try {
            showNotification(window.translations[currentLang].msg_preparing_export, 'info');

            const memories = [];
            const mediaFiles = [];

            // 선택된 메모리 데이터 가져오기
            for (const memoryId of this.selectedItems) {
                const { data: memory } = await supabase
                    .from('memories')
                    .select('*, media_files(*), memory_people(people(*)), memory_tags(tags(*))')
                    .eq('id', memoryId)
                    .single();

                if (memory) {
                    memories.push(memory);
                    if (memory.media_files) {
                        mediaFiles.push(...memory.media_files);
                    }
                }
            }

            // ZIP 파일 생성
            const zip = new JSZip();

            // 메타데이터 JSON
            zip.file('memories.json', JSON.stringify(memories, null, 2));

            // 미디어 파일 다운로드 및 ZIP에 추가
            for (const file of mediaFiles) {
                try {
                    const { data } = supabase.storage
                        .from('media')
                        .getPublicUrl(file.file_path);

                    const response = await fetch(data.publicUrl);
                    const blob = await response.blob();
                    
                    const fileName = file.file_path.split('/').pop();
                    zip.file(`media/${fileName}`, blob);
                } catch (error) {
                    console.error('Failed to download file:', file.file_path);
                }
            }

            // ZIP 다운로드
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memories_export_${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);

            // 활동 로그
            await this.logActivity('bulk_action', 'memory', null, {
                action: 'export',
                count: this.selectedItems.size
            });

            showNotification(window.translations[currentLang].msg_export_success, 'success');
        } catch (error) {
            console.error('Bulk export error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범에 추가
    async bulkAddToAlbum() {
        if (this.selectedItems.size === 0) return;

        const modal = await this.createAlbumModal();
        document.body.appendChild(modal);
    }

    // 앨범 모달 생성
    async createAlbumModal() {
        // 앨범 목록 가져오기
        const { data: albums } = await supabase
            .from('albums')
            .select('*')
            .order('created_at', { ascending: false });

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${window.translations[currentLang].add_to_album_title}</h3>
                <div class="form-group">
                    <label>${window.translations[currentLang].select_album}</label>
                    <select id="album-select" class="form-control">
                        <option value="">${window.translations[currentLang].select_album_placeholder}</option>
                        ${albums.map(album => `
                            <option value="${album.id}">${album.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <button class="btn-link" onclick="photoManager.createNewAlbum()">
                        ${window.translations[currentLang].create_new_album}
                    </button>
                </div>
                <div class="modal-buttons">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        ${window.translations[currentLang].btn_cancel}
                    </button>
                    <button class="btn-primary" onclick="photoManager.addToAlbum()">
                        ${window.translations[currentLang].btn_add}
                    </button>
                </div>
            </div>
        `;
        return modal;
    }

    // 휴지통 카운트 로드
    async loadTrashCount() {
        try {
            const { count } = await supabase
                .from('trash')
                .select('*', { count: 'exact', head: true })
                .eq('deleted_by', (await supabase.auth.getUser()).data.user.id);

            const trashBadge = document.getElementById('trash-count');
            if (trashBadge && count > 0) {
                trashBadge.textContent = count;
                trashBadge.style.display = 'inline-block';
            } else if (trashBadge) {
                trashBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Load trash count error:', error);
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

    // 사진 회전
    async rotateImage(mediaFileId, degrees) {
        try {
            // 여기에 이미지 회전 로직 구현
            // Canvas API를 사용하여 이미지 회전 후 재업로드
            
            await this.logActivity('update', 'media_file', mediaFileId, {
                action: 'rotate',
                degrees: degrees
            });

            showNotification(window.translations[currentLang].msg_image_rotated, 'success');
        } catch (error) {
            console.error('Rotate image error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 워터마크 설정
    async setupWatermark() {
        const modal = await this.createWatermarkModal();
        document.body.appendChild(modal);
    }

    // 워터마크 모달 생성
    async createWatermarkModal() {
        const { data: settings } = await supabase
            .from('watermark_settings')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user.id)
            .single();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${window.translations[currentLang].watermark_settings}</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="watermark-enabled" ${settings?.enabled ? 'checked' : ''}>
                        ${window.translations[currentLang].enable_watermark}
                    </label>
                </div>
                <div class="form-group">
                    <label>${window.translations[currentLang].watermark_text}</label>
                    <input type="text" id="watermark-text" value="${settings?.text || ''}" 
                           placeholder="${window.translations[currentLang].watermark_placeholder}">
                </div>
                <div class="form-group">
                    <label>${window.translations[currentLang].watermark_position}</label>
                    <select id="watermark-position" class="form-control">
                        <option value="bottom-right" ${settings?.position === 'bottom-right' ? 'selected' : ''}>
                            ${window.translations[currentLang].bottom_right}
                        </option>
                        <option value="bottom-left" ${settings?.position === 'bottom-left' ? 'selected' : ''}>
                            ${window.translations[currentLang].bottom_left}
                        </option>
                        <option value="top-right" ${settings?.position === 'top-right' ? 'selected' : ''}>
                            ${window.translations[currentLang].top_right}
                        </option>
                        <option value="top-left" ${settings?.position === 'top-left' ? 'selected' : ''}>
                            ${window.translations[currentLang].top_left}
                        </option>
                        <option value="center" ${settings?.position === 'center' ? 'selected' : ''}>
                            ${window.translations[currentLang].center}
                        </option>
                    </select>
                </div>
                <div class="form-group">
                    <label>${window.translations[currentLang].watermark_opacity}</label>
                    <input type="range" id="watermark-opacity" min="0" max="100" 
                           value="${(settings?.opacity || 0.5) * 100}">
                    <span id="opacity-value">${(settings?.opacity || 0.5) * 100}%</span>
                </div>
                <div class="modal-buttons">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        ${window.translations[currentLang].btn_cancel}
                    </button>
                    <button class="btn-primary" onclick="photoManager.saveWatermarkSettings()">
                        ${window.translations[currentLang].btn_save}
                    </button>
                </div>
            </div>
        `;

        // 투명도 슬라이더 이벤트
        modal.querySelector('#watermark-opacity').addEventListener('input', (e) => {
            modal.querySelector('#opacity-value').textContent = e.target.value + '%';
        });

        return modal;
    }

    // 워터마크 설정 저장
    async saveWatermarkSettings() {
        try {
            const settings = {
                enabled: document.getElementById('watermark-enabled').checked,
                text: document.getElementById('watermark-text').value,
                position: document.getElementById('watermark-position').value,
                opacity: document.getElementById('watermark-opacity').value / 100,
                font_size: 16,
                color: '#ffffff'
            };

            const { data: { user } } = await supabase.auth.getUser();

            await supabase
                .from('watermark_settings')
                .upsert({
                    user_id: user.id,
                    ...settings
                });

            showNotification(window.translations[currentLang].msg_watermark_saved, 'success');
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Save watermark settings error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }
}

// 전역 인스턴스 생성
window.photoManager = new PhotoManager();
