// 메모리 수정/삭제 기능
async function editMemory(memoryId) {
    const memory = allMemories.find(m => m.id === memoryId);
    if (!memory) return;

    // 권한 체크
    if (!permissionManager.canEdit(memory)) {
        alert('이 추억을 수정할 권한이 없습니다.');
        return;
    }

    // add-memory.html로 이동하며 편집 모드로 설정
    localStorage.setItem('editingMemory', JSON.stringify(memory));
    window.location.href = 'add-memory.html?edit=' + memoryId;
}

async function deleteMemory(memoryId) {
    const memory = allMemories.find(m => m.id === memoryId);
    if (!memory) return;

    // 권한 체크
    if (!permissionManager.canDelete(memory)) {
        alert('이 추억을 삭제할 권한이 없습니다.');
        return;
    }

    // 삭제 확인
    const currentLang = localStorage.getItem('language') || 'ko';
    const confirmMessage = currentLang === 'ko' 
        ? '정말로 이 추억을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
        : 'Are you sure you want to delete this memory?\nThis action cannot be undone.';

    if (!confirm(confirmMessage)) return;

    try {
        // 1. 미디어 파일 삭제
        if (memory.media_files && memory.media_files.length > 0) {
            const filePromises = memory.media_files.map(file => 
                supabaseClient.storage.from('media').remove([file.file_path])
            );
            await Promise.all(filePromises);
        }

        // 2. 메모리 삭제 (관련 테이블은 CASCADE로 자동 삭제)
        const { error } = await supabaseClient
            .from('memories')
            .delete()
            .eq('id', memoryId);

        if (error) throw error;

        // 3. UI 업데이트
        allMemories = allMemories.filter(m => m.id !== memoryId);
        displayMemories();

        // 성공 메시지
        const successMessage = currentLang === 'ko' 
            ? '추억이 성공적으로 삭제되었습니다.'
            : 'Memory deleted successfully.';
        alert(successMessage);

    } catch (error) {
        console.error('삭제 실패:', error);
        const errorMessage = currentLang === 'ko'
            ? '삭제 중 오류가 발생했습니다.'
            : 'An error occurred while deleting.';
        alert(errorMessage);
    }
}

// createMemoryCard 함수 수정 - 권한에 따른 버튼 추가
function createMemoryCardWithPermissions(memory) {
    const date = new Date(memory.memory_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const people = memory.memory_people.map(mp => {
        const person = peopleData[mp.person_id];
        return person ? person.name : '';
    }).filter(name => name).join(', ');
    
    const hasMedia = memory.media_files && memory.media_files.length > 0;
    
    // 권한에 따른 수정/삭제 버튼 생성
    let actionButtons = `
        <button class="action-btn like-btn ${isLiked(memory.id) ? 'active' : ''}" 
                onclick="toggleLike('${memory.id}', event)" 
                title="좋아요">
            <svg width="20" height="20" fill="${isLiked(memory.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="like-count">${getLikeCount(memory.id)}</span>
        </button>
        <button class="action-btn" onclick="viewMemoryDetail('${memory.id}')" title="자세히 보기">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 10s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        </button>
    `;

    // 수정 권한이 있으면 수정 버튼 추가
    if (permissionManager && permissionManager.canEdit(memory)) {
        actionButtons += `
            <button class="action-btn edit-btn" onclick="editMemory('${memory.id}')" title="수정">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            </button>
        `;
    }

    // 삭제 권한이 있으면 삭제 버튼 추가
    if (permissionManager && permissionManager.canDelete(memory)) {
        actionButtons += `
            <button class="action-btn delete-btn" onclick="deleteMemory('${memory.id}')" title="삭제">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
    }

    actionButtons += `
        <button class="action-btn share-btn" title="공유">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
        </button>
    `;
    
    return `
        <div class="memory-item" data-aos="fade-up" data-memory-id="${memory.id}">
            <div class="memory-card modern-card">
                <div class="image-wrapper">
                    ${hasMedia ? 
                        `<img src="${getMediaUrl(memory.media_files[0])}" 
                             alt="${memory.title}" 
                             class="memory-image"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27200%27 viewBox=%270 0 400 200%27%3E%3Crect width=%27400%27 height=%27200%27 fill=%27%23f3f4f6%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27Arial%27 font-size=%2714%27 fill=%27%239ca3af%27%3E이미지 로드 실패%3C/text%3E%3C/svg%3E'">` : 
                        '<div class="no-image-placeholder flex items-center justify-center h-full bg-gray-100">📷</div>'
                    }
                    <div class="overlay">
                        ${actionButtons}
                    </div>
                </div>
                <div class="card-content">
                    <div class="date-badge">${date}</div>
                    <h3 class="memory-title">${memory.title}</h3>
                    <p class="memory-desc">${memory.description || ''}</p>
                    <div class="tags">
                        ${people.split(', ').map(name => `<span class="tag">${name}</span>`).join('')}
                        ${memory.location ? `<span class="tag">📍 ${memory.location}</span>` : ''}
                        ${memory.memory_tags ? memory.memory_tags.map(mt => 
                            `<span class="tag" style="background-color: ${mt.tags.color}20; color: ${mt.tags.color}">
                                <i class="fas fa-tag text-xs mr-1"></i>${mt.tags.name}
                            </span>`
                        ).join('') : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}
