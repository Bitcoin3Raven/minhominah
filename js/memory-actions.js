// Memory action functions (delete, edit, etc.)
const memoryActions = {
    // Delete a memory
    deleteMemory: async function(memoryId, memoryElement = null) {
        try {
            // Check permissions first
            const memory = await this.getMemoryById(memoryId);
            if (!memory) {
                throw new Error('메모리를 찾을 수 없습니다.');
            }
            
            if (!memoryPermissions.canDelete(memory)) {
                throw new Error('이 메모리를 삭제할 권한이 없습니다.');
            }
            
            // Show confirmation dialog
            const confirmed = await this.showDeleteConfirmation(memory);
            if (!confirmed) {
                return false;
            }
            
            // Delete from database
            const { error } = await supabase
                .from('memories')
                .delete()
                .eq('id', memoryId);
            
            if (error) {
                throw error;
            }
            
            // Remove from UI if element provided
            if (memoryElement) {
                memoryElement.style.transition = 'opacity 0.3s, transform 0.3s';
                memoryElement.style.opacity = '0';
                memoryElement.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    memoryElement.remove();
                    // Update memory count if it exists
                    const memoryCount = document.getElementById('memoryCount');
                    if (memoryCount) {
                        const currentCount = parseInt(memoryCount.textContent) || 0;
                        memoryCount.textContent = Math.max(0, currentCount - 1);
                    }
                }, 300);
            }
            
            // Close modal if open
            const modal = document.getElementById('memoryModal');
            if (modal && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
            
            // Show success message
            this.showMessage('메모리가 삭제되었습니다.', 'success');
            
            return true;
        } catch (error) {
            console.error('Delete memory error:', error);
            this.showMessage(error.message || '삭제 중 오류가 발생했습니다.', 'error');
            return false;
        }
    },
    
    // Get memory by ID
    getMemoryById: async function(memoryId) {
        try {
            const { data, error } = await supabase
                .from('memories')
                .select('*')
                .eq('id', memoryId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get memory error:', error);
            return null;
        }
    },
    
    // Show delete confirmation dialog
    showDeleteConfirmation: function(memory) {
        return new Promise((resolve) => {
            // Create confirmation modal
            const confirmModal = document.createElement('div');
            confirmModal.className = 'delete-confirm-modal';
            confirmModal.innerHTML = `
                <div class="delete-confirm-content">
                    <h3>메모리 삭제</h3>
                    <p>정말로 이 메모리를 삭제하시겠습니까?</p>
                    <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
                    <div class="delete-confirm-buttons">
                        <button class="btn-cancel">취소</button>
                        <button class="btn-delete">삭제</button>
                    </div>
                </div>
            `;
            
            // Add styles if not already added
            if (!document.getElementById('memory-actions-styles')) {
                const styles = document.createElement('style');
                styles.id = 'memory-actions-styles';
                styles.textContent = `
                    .delete-confirm-modal {
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
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    .delete-confirm-content {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        max-width: 400px;
                        text-align: center;
                        animation: slideIn 0.3s ease;
                    }
                    
                    @keyframes slideIn {
                        from { transform: translateY(-20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    
                    .delete-confirm-content h3 {
                        margin: 0 0 15px 0;
                        color: #333;
                    }
                    
                    .delete-confirm-content p {
                        margin: 10px 0;
                        color: #666;
                    }
                    
                    .delete-warning {
                        color: #dc3545 !important;
                        font-size: 14px;
                    }
                    
                    .delete-confirm-buttons {
                        margin-top: 25px;
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                    }
                    
                    .delete-confirm-buttons button {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        transition: all 0.2s;
                    }
                    
                    .btn-cancel {
                        background: #6c757d;
                        color: white;
                    }
                    
                    .btn-cancel:hover {
                        background: #5a6268;
                    }
                    
                    .btn-delete {
                        background: #dc3545;
                        color: white;
                    }
                    
                    .btn-delete:hover {
                        background: #c82333;
                    }
                    
                    .action-message {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 15px 20px;
                        border-radius: 5px;
                        color: white;
                        z-index: 10001;
                        animation: slideInRight 0.3s ease;
                    }
                    
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    
                    .action-message.success {
                        background: #28a745;
                    }
                    
                    .action-message.error {
                        background: #dc3545;
                    }
                    
                    .memory-action-btn {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.6);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        cursor: pointer;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        z-index: 10;
                    }
                    
                    .memory-card:hover .memory-action-btn {
                        display: flex;
                    }
                    
                    .memory-action-btn:hover {
                        background: rgba(220, 53, 69, 0.9);
                        transform: scale(1.1);
                    }
                    
                    .memory-action-menu {
                        position: absolute;
                        top: 50px;
                        right: 10px;
                        background: white;
                        border-radius: 5px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        display: none;
                        z-index: 100;
                    }
                    
                    .memory-action-menu.show {
                        display: block;
                    }
                    
                    .memory-action-menu button {
                        display: block;
                        width: 100%;
                        padding: 10px 20px;
                        border: none;
                        background: none;
                        text-align: left;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    
                    .memory-action-menu button:hover {
                        background: #f8f9fa;
                    }
                    
                    .memory-action-menu button.delete {
                        color: #dc3545;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(confirmModal);
            
            // Handle button clicks
            const cancelBtn = confirmModal.querySelector('.btn-cancel');
            const deleteBtn = confirmModal.querySelector('.btn-delete');
            
            const cleanup = () => {
                confirmModal.style.opacity = '0';
                setTimeout(() => {
                    confirmModal.remove();
                }, 200);
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };
            
            deleteBtn.onclick = () => {
                cleanup();
                resolve(true);
            };
            
            // Close on background click
            confirmModal.onclick = (e) => {
                if (e.target === confirmModal) {
                    cleanup();
                    resolve(false);
                }
            };
        });
    },
    
    // Show message to user
    showMessage: function(message, type = 'success') {
        // Remove existing message if any
        const existingMessage = document.querySelector('.action-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `action-message ${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                messageEl.remove();
            }, 300);
        }, 3000);
    },
    
    // Add delete button to memory card
    addDeleteButton: function(memoryCard, memory) {
        // Check permissions
        if (!memoryPermissions.canManage(memory)) {
            return;
        }
        
        // Check if buttons already exist
        if (memoryCard.querySelector('.memory-action-buttons')) {
            return;
        }
        
        // Create action buttons container
        const actionContainer = document.createElement('div');
        actionContainer.className = 'memory-action-buttons';
        actionContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: none;
            gap: 8px;
            z-index: 10;
        `;
        
        // Create edit button if user can edit
        if (memoryPermissions.canEdit(memory)) {
            const editBtn = document.createElement('button');
            editBtn.className = 'memory-action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = '수정';
            editBtn.style.cssText = `
                background: rgba(59, 130, 246, 0.9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            `;
            
            editBtn.onmouseover = () => {
                editBtn.style.transform = 'scale(1.1)';
                editBtn.style.background = 'rgba(59, 130, 246, 1)';
            };
            
            editBtn.onmouseout = () => {
                editBtn.style.transform = 'scale(1)';
                editBtn.style.background = 'rgba(59, 130, 246, 0.9)';
            };
            
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.editMemory(memory);
            };
            
            actionContainer.appendChild(editBtn);
        }
        
        // Create delete button if user can delete
        if (memoryPermissions.canDelete(memory)) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'memory-action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = '삭제';
            deleteBtn.style.cssText = `
                background: rgba(220, 53, 69, 0.9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            `;
            
            deleteBtn.onmouseover = () => {
                deleteBtn.style.transform = 'scale(1.1)';
                deleteBtn.style.background = 'rgba(220, 53, 69, 1)';
            };
            
            deleteBtn.onmouseout = () => {
                deleteBtn.style.transform = 'scale(1)';
                deleteBtn.style.background = 'rgba(220, 53, 69, 0.9)';
            };
            
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteMemory(memory.id, memoryCard.closest('.memory-item'));
            };
            
            actionContainer.appendChild(deleteBtn);
        }
        
        // Show buttons on hover
        memoryCard.style.position = 'relative';
        memoryCard.onmouseenter = () => {
            actionContainer.style.display = 'flex';
        };
        memoryCard.onmouseleave = () => {
            actionContainer.style.display = 'none';
        };
        
        memoryCard.appendChild(actionContainer);
    },
    
    // Edit memory function
    editMemory: async function(memory) {
        try {
            // Check permissions
            if (!memoryPermissions.canEdit(memory)) {
                throw new Error('이 메모리를 수정할 권한이 없습니다.');
            }
            
            // Show edit modal
            this.showEditModal(memory);
        } catch (error) {
            console.error('Edit memory error:', error);
            this.showMessage(error.message || '수정 중 오류가 발생했습니다.', 'error');
        }
    },
    
    // Show edit modal
    showEditModal: function(memory) {
        // Create edit modal if it doesn't exist
        let editModal = document.getElementById('editMemoryModal');
        if (!editModal) {
            editModal = document.createElement('div');
            editModal.id = 'editMemoryModal';
            editModal.className = 'edit-memory-modal';
            editModal.innerHTML = `
                <div class="edit-memory-content">
                    <div class="edit-memory-header">
                        <h2>메모리 수정</h2>
                        <button class="close-btn" onclick="memoryActions.closeEditModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="editMemoryForm" class="edit-memory-form">
                        <div class="form-group">
                            <label for="editTitle">제목</label>
                            <input type="text" id="editTitle" name="title" required 
                                   class="form-control" placeholder="메모리 제목을 입력하세요">
                        </div>
                        
                        <div class="form-group">
                            <label for="editDescription">설명</label>
                            <textarea id="editDescription" name="description" rows="4" 
                                      class="form-control" placeholder="메모리에 대한 설명을 입력하세요"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="editDate">날짜</label>
                            <input type="date" id="editDate" name="memory_date" required 
                                   class="form-control">
                        </div>
                        
                        <div class="form-group">
                            <label for="editLocation">위치</label>
                            <input type="text" id="editLocation" name="location" 
                                   class="form-control" placeholder="위치를 입력하세요 (선택사항)">
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="memoryActions.closeEditModal()">
                                취소
                            </button>
                            <button type="submit" class="btn-save">
                                <i class="fas fa-save"></i> 저장
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // Add styles
            const styles = `
                .edit-memory-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease;
                }
                
                .edit-memory-modal.show {
                    display: flex;
                }
                
                .edit-memory-content {
                    background: white;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideIn 0.3s ease;
                }
                
                .edit-memory-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .edit-memory-header h2 {
                    margin: 0;
                    font-size: 24px;
                    color: #1f2937;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b7280;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                
                .close-btn:hover {
                    color: #1f2937;
                }
                
                .edit-memory-form {
                    padding: 20px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .form-control {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                }
                
                .form-control:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                textarea.form-control {
                    resize: vertical;
                    min-height: 100px;
                }
                
                .form-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .btn-cancel, .btn-save {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-cancel {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .btn-cancel:hover {
                    background: #e5e7eb;
                }
                
                .btn-save {
                    background: #3b82f6;
                    color: white;
                }
                
                .btn-save:hover {
                    background: #2563eb;
                }
            `;
            
            // Add styles to document if not already added
            if (!document.getElementById('edit-modal-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'edit-modal-styles';
                styleSheet.textContent = styles;
                document.head.appendChild(styleSheet);
            }
            
            document.body.appendChild(editModal);
        }
        
        // Populate form with memory data
        document.getElementById('editTitle').value = memory.title || '';
        document.getElementById('editDescription').value = memory.description || '';
        document.getElementById('editDate').value = memory.memory_date ? memory.memory_date.split('T')[0] : '';
        document.getElementById('editLocation').value = memory.location || '';
        
        // Store memory ID for saving
        editModal.dataset.memoryId = memory.id;
        
        // Show modal
        editModal.classList.add('show');
        
        // Handle form submission
        const form = document.getElementById('editMemoryForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.saveMemoryEdits(memory.id, form);
        };
    },
    
    // Close edit modal
    closeEditModal: function() {
        const editModal = document.getElementById('editMemoryModal');
        if (editModal) {
            editModal.classList.remove('show');
        }
    },
    
    // Save memory edits
    saveMemoryEdits: async function(memoryId, form) {
        try {
            const formData = new FormData(form);
            const updates = {
                title: formData.get('title'),
                description: formData.get('description'),
                memory_date: formData.get('memory_date'),
                location: formData.get('location')
            };
            
            // Update in database
            const { error } = await supabase
                .from('memories')
                .update(updates)
                .eq('id', memoryId);
            
            if (error) {
                throw error;
            }
            
            // Update local data
            const memoryIndex = window.allMemories.findIndex(m => m.id === memoryId);
            if (memoryIndex !== -1) {
                window.allMemories[memoryIndex] = {
                    ...window.allMemories[memoryIndex],
                    ...updates
                };
            }
            
            // Close modal
            this.closeEditModal();
            
            // Refresh display
            if (window.displayMemories) {
                window.displayMemories();
            }
            
            // Update modal if it's open
            if (window.currentMemoryId === memoryId) {
                window.viewMemoryDetail(memoryId);
            }
            
            // Show success message
            this.showMessage('메모리가 성공적으로 수정되었습니다.', 'success');
            
            return true;
        } catch (error) {
            console.error('Save memory edits error:', error);
            this.showMessage(error.message || '저장 중 오류가 발생했습니다.', 'error');
            return false;
        }
    }
};

// Export for use in other files
window.memoryActions = memoryActions;