// Bulk actions for memory management
const bulkActions = {
    // Selection state
    selectedMemories: new Set(),
    isSelectionMode: false,
    
    // Toggle selection mode
    toggleSelectionMode: function() {
        this.isSelectionMode = !this.isSelectionMode;
        const container = document.getElementById('memoriesContainer');
        
        if (this.isSelectionMode) {
            // Enter selection mode
            container.classList.add('selection-mode');
            this.showSelectionUI();
            this.addCheckboxesToCards();
            this.showBulkActionBar();
        } else {
            // Exit selection mode
            container.classList.remove('selection-mode');
            this.hideSelectionUI();
            this.removeCheckboxesFromCards();
            this.hideBulkActionBar();
            this.clearSelection();
        }
        
        // Update button state
        const toggleBtn = document.getElementById('selectionModeBtn');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.isSelectionMode);
            toggleBtn.innerHTML = this.isSelectionMode ? 
                '<i class="fas fa-times"></i> 선택 취소' : 
                '<i class="fas fa-check-square"></i> 선택 모드';
        }
    },
    
    // Show selection UI elements
    showSelectionUI: function() {
        // Add selection mode indicator
        const indicator = document.createElement('div');
        indicator.id = 'selectionModeIndicator';
        indicator.className = 'selection-mode-indicator';
        indicator.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>선택 모드: 삭제하거나 수정할 항목을 선택하세요</span>
        `;
        
        const container = document.querySelector('.gallery-container');
        if (container && !document.getElementById('selectionModeIndicator')) {
            container.insertBefore(indicator, container.firstChild);
        }
    },
    
    // Hide selection UI elements
    hideSelectionUI: function() {
        const indicator = document.getElementById('selectionModeIndicator');
        if (indicator) {
            indicator.remove();
        }
    },
    
    // Add checkboxes to memory cards
    addCheckboxesToCards: function() {
        const memoryCards = document.querySelectorAll('.memory-card');
        
        memoryCards.forEach((card, index) => {
            const memory = window.filteredMemories ? window.filteredMemories[index] : null;
            if (!memory) return;
            
            // Check if user has permission to manage this memory
            if (!memoryPermissions.canManage(memory)) return;
            
            // Check if checkbox already exists
            if (card.querySelector('.selection-checkbox')) return;
            
            // Create checkbox container
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'selection-checkbox-container';
            checkboxContainer.innerHTML = `
                <input type="checkbox" 
                       class="selection-checkbox" 
                       data-memory-id="${memory.id}"
                       ${this.selectedMemories.has(memory.id) ? 'checked' : ''}>
                <label class="checkbox-label"></label>
            `;
            
            // Add click handler
            const checkbox = checkboxContainer.querySelector('.selection-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleMemorySelection(memory.id, e.target.checked);
            });
            
            // Prevent card click when clicking checkbox area
            checkboxContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            card.appendChild(checkboxContainer);
        });
    },
    
    // Remove checkboxes from memory cards
    removeCheckboxesFromCards: function() {
        const checkboxContainers = document.querySelectorAll('.selection-checkbox-container');
        checkboxContainers.forEach(container => container.remove());
    },
    
    // Toggle memory selection
    toggleMemorySelection: function(memoryId, isSelected) {
        if (isSelected) {
            this.selectedMemories.add(memoryId);
        } else {
            this.selectedMemories.delete(memoryId);
        }
        
        this.updateSelectionCounter();
        this.updateBulkActionButtons();
    },
    
    // Select all visible memories
    selectAll: function() {
        const checkboxes = document.querySelectorAll('.selection-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedMemories.add(checkbox.dataset.memoryId);
        });
        
        this.updateSelectionCounter();
        this.updateBulkActionButtons();
    },
    
    // Clear selection
    clearSelection: function() {
        this.selectedMemories.clear();
        const checkboxes = document.querySelectorAll('.selection-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateSelectionCounter();
        this.updateBulkActionButtons();
    },
    
    // Update selection counter
    updateSelectionCounter: function() {
        const counter = document.getElementById('selectionCounter');
        if (counter) {
            counter.textContent = `${this.selectedMemories.size}개 선택됨`;
        }
    },
    
    // Show bulk action bar
    showBulkActionBar: function() {
        let actionBar = document.getElementById('bulkActionBar');
        if (!actionBar) {
            actionBar = document.createElement('div');
            actionBar.id = 'bulkActionBar';
            actionBar.className = 'bulk-action-bar';
            actionBar.innerHTML = `
                <div class="bulk-action-content">
                    <div class="selection-info">
                        <button class="btn-select-all" onclick="bulkActions.selectAll()">
                            <i class="fas fa-check-double"></i> 전체 선택
                        </button>
                        <button class="btn-clear-selection" onclick="bulkActions.clearSelection()">
                            <i class="fas fa-times"></i> 선택 해제
                        </button>
                        <span id="selectionCounter" class="selection-counter">0개 선택됨</span>
                    </div>
                    <div class="bulk-actions">
                        <button class="btn-bulk-edit" onclick="bulkActions.bulkEdit()" disabled>
                            <i class="fas fa-edit"></i> 일괄 수정
                        </button>
                        <button class="btn-bulk-delete" onclick="bulkActions.bulkDelete()" disabled>
                            <i class="fas fa-trash"></i> 일괄 삭제
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(actionBar);
        }
        
        actionBar.classList.add('show');
    },
    
    // Hide bulk action bar
    hideBulkActionBar: function() {
        const actionBar = document.getElementById('bulkActionBar');
        if (actionBar) {
            actionBar.classList.remove('show');
        }
    },
    
    // Update bulk action buttons state
    updateBulkActionButtons: function() {
        const editBtn = document.querySelector('.btn-bulk-edit');
        const deleteBtn = document.querySelector('.btn-bulk-delete');
        
        if (editBtn) {
            editBtn.disabled = this.selectedMemories.size === 0;
        }
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedMemories.size === 0;
        }
    },
    
    // Bulk delete
    bulkDelete: async function() {
        if (this.selectedMemories.size === 0) return;
        
        const count = this.selectedMemories.size;
        const confirmed = await this.showBulkDeleteConfirmation(count);
        
        if (!confirmed) return;
        
        // Show progress
        const progressModal = this.showProgressModal('삭제 중...', count);
        let completed = 0;
        let failed = 0;
        
        // Delete memories one by one
        for (const memoryId of this.selectedMemories) {
            try {
                const { error } = await supabase
                    .from('memories')
                    .delete()
                    .eq('id', memoryId);
                
                if (error) throw error;
                
                completed++;
                this.updateProgress(progressModal, completed, count);
                
                // Remove from UI
                const card = document.querySelector(`[data-memory-id="${memoryId}"]`)?.closest('.memory-item');
                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => card.remove(), 300);
                }
            } catch (error) {
                console.error(`Failed to delete memory ${memoryId}:`, error);
                failed++;
            }
        }
        
        // Close progress modal
        setTimeout(() => {
            this.closeProgressModal(progressModal);
            
            // Show result
            if (failed === 0) {
                memoryActions.showMessage(`${completed}개의 메모리가 삭제되었습니다.`, 'success');
            } else {
                memoryActions.showMessage(`${completed}개 삭제 완료, ${failed}개 실패`, 'error');
            }
            
            // Exit selection mode
            this.toggleSelectionMode();
            
            // Refresh display
            if (window.displayMemories) {
                window.displayMemories();
            }
        }, 500);
    },
    
    // Bulk edit
    bulkEdit: function() {
        if (this.selectedMemories.size === 0) return;
        
        this.showBulkEditModal();
    },
    
    // Show bulk delete confirmation
    showBulkDeleteConfirmation: function(count) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'bulk-delete-confirm-modal';
            modal.innerHTML = `
                <div class="bulk-delete-confirm-content">
                    <h3>대량 삭제 확인</h3>
                    <p><strong>${count}개</strong>의 메모리를 삭제하시겠습니까?</p>
                    <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
                    <div class="delete-confirm-buttons">
                        <button class="btn-cancel">취소</button>
                        <button class="btn-delete">삭제</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const cleanup = () => {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 200);
            };
            
            modal.querySelector('.btn-cancel').onclick = () => {
                cleanup();
                resolve(false);
            };
            
            modal.querySelector('.btn-delete').onclick = () => {
                cleanup();
                resolve(true);
            };
        });
    },
    
    // Show bulk edit modal
    showBulkEditModal: function() {
        const modal = document.createElement('div');
        modal.className = 'bulk-edit-modal';
        modal.innerHTML = `
            <div class="bulk-edit-content">
                <div class="bulk-edit-header">
                    <h2>${this.selectedMemories.size}개 항목 일괄 수정</h2>
                    <button class="close-btn" onclick="bulkActions.closeBulkEditModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="bulkEditForm" class="bulk-edit-form">
                    <p class="bulk-edit-info">
                        <i class="fas fa-info-circle"></i>
                        체크된 항목만 선택된 메모리에 적용됩니다.
                    </p>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="applyDate" class="apply-checkbox">
                            날짜 변경
                        </label>
                        <input type="date" name="memory_date" class="form-control" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="applyLocation" class="apply-checkbox">
                            위치 변경
                        </label>
                        <input type="text" name="location" class="form-control" 
                               placeholder="위치를 입력하세요" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="applyAddTags" class="apply-checkbox">
                            태그 추가
                        </label>
                        <input type="text" name="addTags" class="form-control" 
                               placeholder="추가할 태그 (쉼표로 구분)" disabled>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="bulkActions.closeBulkEditModal()">
                            취소
                        </button>
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> 일괄 적용
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle checkbox changes
        modal.querySelectorAll('.apply-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const input = e.target.closest('.form-group').querySelector('.form-control');
                input.disabled = !e.target.checked;
                if (e.target.checked) {
                    input.focus();
                }
            });
        });
        
        // Handle form submission
        const form = modal.querySelector('#bulkEditForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.applyBulkEdits(form);
        });
    },
    
    // Close bulk edit modal
    closeBulkEditModal: function() {
        const modal = document.querySelector('.bulk-edit-modal');
        if (modal) {
            modal.remove();
        }
    },
    
    // Apply bulk edits
    applyBulkEdits: async function(form) {
        const formData = new FormData(form);
        const updates = {};
        
        // Check which fields to update
        if (formData.get('applyDate')) {
            updates.memory_date = formData.get('memory_date');
        }
        if (formData.get('applyLocation')) {
            updates.location = formData.get('location');
        }
        
        if (Object.keys(updates).length === 0 && !formData.get('applyAddTags')) {
            memoryActions.showMessage('적용할 변경사항을 선택하세요.', 'error');
            return;
        }
        
        // Show progress
        const count = this.selectedMemories.size;
        const progressModal = this.showProgressModal('수정 중...', count);
        let completed = 0;
        let failed = 0;
        
        // Update memories one by one
        for (const memoryId of this.selectedMemories) {
            try {
                // Apply field updates if any
                if (Object.keys(updates).length > 0) {
                    const { error } = await supabase
                        .from('memories')
                        .update(updates)
                        .eq('id', memoryId);
                    
                    if (error) throw error;
                }
                
                // Add tags if specified
                if (formData.get('applyAddTags')) {
                    const tagsToAdd = formData.get('addTags').split(',').map(t => t.trim()).filter(t => t);
                    // Tag addition logic would go here
                }
                
                completed++;
                this.updateProgress(progressModal, completed, count);
            } catch (error) {
                console.error(`Failed to update memory ${memoryId}:`, error);
                failed++;
            }
        }
        
        // Close modals and show result
        setTimeout(() => {
            this.closeProgressModal(progressModal);
            this.closeBulkEditModal();
            
            if (failed === 0) {
                memoryActions.showMessage(`${completed}개의 메모리가 수정되었습니다.`, 'success');
            } else {
                memoryActions.showMessage(`${completed}개 수정 완료, ${failed}개 실패`, 'error');
            }
            
            // Exit selection mode and refresh
            this.toggleSelectionMode();
            if (window.displayMemories) {
                window.displayMemories();
            }
        }, 500);
    },
    
    // Show progress modal
    showProgressModal: function(title, total) {
        const modal = document.createElement('div');
        modal.className = 'progress-modal';
        modal.innerHTML = `
            <div class="progress-content">
                <h3>${title}</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <p class="progress-text">0 / ${total}</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },
    
    // Update progress
    updateProgress: function(modal, current, total) {
        const progressBar = modal.querySelector('.progress-bar');
        const progressText = modal.querySelector('.progress-text');
        
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${current} / ${total}`;
    },
    
    // Close progress modal
    closeProgressModal: function(modal) {
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        }
    }
};

// Add styles for bulk actions
const bulkActionStyles = `
    .selection-mode .memory-card {
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .selection-mode .memory-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    
    .selection-checkbox-container {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 20;
        background: white;
        border-radius: 4px;
        padding: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .selection-checkbox {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    
    .selection-mode-indicator {
        background: #3b82f6;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .bulk-action-bar {
        position: fixed;
        bottom: -100px;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        transition: bottom 0.3s ease;
        border-top: 2px solid #e5e7eb;
    }
    
    .bulk-action-bar.show {
        bottom: 0;
    }
    
    .bulk-action-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }
    
    .selection-info {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .selection-info button {
        padding: 8px 15px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .selection-info button:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
    }
    
    .selection-counter {
        font-weight: 600;
        color: #374151;
        padding: 8px 15px;
        background: #f3f4f6;
        border-radius: 6px;
    }
    
    .bulk-actions {
        display: flex;
        gap: 10px;
    }
    
    .bulk-actions button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .btn-bulk-edit {
        background: #3b82f6;
        color: white;
    }
    
    .btn-bulk-edit:hover:not(:disabled) {
        background: #2563eb;
    }
    
    .btn-bulk-delete {
        background: #dc2626;
        color: white;
    }
    
    .btn-bulk-delete:hover:not(:disabled) {
        background: #b91c1c;
    }
    
    .bulk-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .bulk-delete-confirm-modal,
    .bulk-edit-modal,
    .progress-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    }
    
    .bulk-delete-confirm-content,
    .bulk-edit-content,
    .progress-content {
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        animation: slideIn 0.3s ease;
    }
    
    .bulk-edit-content {
        max-width: 600px;
    }
    
    .bulk-edit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .bulk-edit-header h2 {
        margin: 0;
        color: #1f2937;
    }
    
    .bulk-edit-info {
        background: #eff6ff;
        padding: 12px 15px;
        border-radius: 6px;
        margin-bottom: 20px;
        color: #1e40af;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .bulk-edit-form .form-group {
        margin-bottom: 20px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }
    
    .bulk-edit-form label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        font-weight: 500;
        color: #374151;
    }
    
    .apply-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
    
    .bulk-edit-form .form-control {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 15px;
        transition: all 0.2s;
    }
    
    .bulk-edit-form .form-control:disabled {
        background: #e5e7eb;
        cursor: not-allowed;
    }
    
    .bulk-edit-form .form-control:not(:disabled):focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .progress-bar-container {
        width: 100%;
        height: 20px;
        background: #e5e7eb;
        border-radius: 10px;
        overflow: hidden;
        margin: 20px 0;
    }
    
    .progress-bar {
        height: 100%;
        background: #3b82f6;
        transition: width 0.3s ease;
    }
    
    .progress-text {
        text-align: center;
        color: #6b7280;
        font-size: 14px;
    }
    
    #selectionModeBtn.active {
        background: #dc2626;
        color: white;
    }
    
    #selectionModeBtn.active:hover {
        background: #b91c1c;
    }
`;

// Add styles to document
if (!document.getElementById('bulk-action-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'bulk-action-styles';
    styleSheet.textContent = bulkActionStyles;
    document.head.appendChild(styleSheet);
}

// Export for use
window.bulkActions = bulkActions;