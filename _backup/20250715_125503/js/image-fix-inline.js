// 완전히 새로운 접근 - 인라인 스타일로 이미지 강제 표시
(function() {
    console.log('=== 새로운 이미지 수정 방식 시작 ===');
    
    // createMemoryCard 함수를 덮어쓰기
    const originalCreateMemoryCard = window.createMemoryCard;
    
    window.createMemoryCard = function(memory) {
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
        const imageUrl = hasMedia ? getMediaUrl(memory.media_files[0]) : '';
        
        // 인라인 스타일을 직접 적용한 새로운 템플릿
        return `
            <div class="memory-item" data-aos="fade-up">
                <div class="memory-card modern-card" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div class="image-wrapper" style="position: relative; width: 100%; height: 200px; overflow: hidden; background: #f0f0f0;">
                        ${hasMedia ? 
                            `<img src="${imageUrl}" 
                                 alt="${memory.title}" 
                                 style="width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; top: 0; left: 0; opacity: 1; visibility: visible;"
                                 onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;color:#999;font-size:2rem;\\'>📷</div>';">` : 
                            '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;color:#999;font-size:2rem;">📷</div>'
                        }
                        <div class="overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%); opacity: 0; transition: opacity 0.3s; pointer-events: none;">
                            <div style="position: absolute; bottom: 10px; right: 10px; display: flex; gap: 10px;">
                                <button class="action-btn like-btn ${isLiked(memory.id) ? 'active' : ''}" 
                                        onclick="toggleLike('${memory.id}', event)" 
                                        title="좋아요"
                                        style="pointer-events: auto; width: 40px; height: 40px; background: rgba(255,255,255,0.9); border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" fill="${isLiked(memory.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span class="like-count">${getLikeCount(memory.id)}</span>
                                </button>
                                <button class="action-btn" onclick="viewMemoryDetail('${memory.id}')" title="자세히 보기"
                                        style="pointer-events: auto; width: 40px; height: 40px; background: rgba(255,255,255,0.9); border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 10s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-content" style="padding: 15px;">
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
    };
    
    // 호버 효과를 JavaScript로 처리
    document.addEventListener('mouseover', function(e) {
        const card = e.target.closest('.memory-card');
        if (card) {
            const overlay = card.querySelector('.overlay');
            if (overlay) {
                overlay.style.opacity = '1';
            }
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const card = e.target.closest('.memory-card');
        if (card && !card.contains(e.relatedTarget)) {
            const overlay = card.querySelector('.overlay');
            if (overlay) {
                overlay.style.opacity = '0';
            }
        }
    });
    
    // 기존 메모리 다시 표시
    if (typeof displayMemories === 'function') {
        console.log('메모리 다시 표시 중...');
        displayMemories();
    }
    
    console.log('=== 새로운 이미지 수정 방식 적용 완료 ===');
})();
