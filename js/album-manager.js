// album-manager.js - 앨범 관리

class AlbumManager {
    constructor() {
        this.currentAlbums = [];
        this.selectedAlbum = null;
        this.viewMode = 'grid'; // grid, list
    }

    // 앨범 목록 로드
    async loadAlbums() {
        const loadingSpinner = document.getElementById('loading-spinner');
        const albumsGrid = document.getElementById('albums-grid');
        const emptyState = document.getElementById('empty-state');

        loadingSpinner.style.display = 'block';
        albumsGrid.innerHTML = '';
        emptyState.style.display = 'none';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data: albums, error } = await supabase
                .from('albums')
                .select(`
                    *,
                    album_memories(count),
                    media_files!cover_image_id(thumbnail_path)
                `)
                .or(`created_by.eq.${user.id},is_public.eq.true`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.currentAlbums = albums || [];

            loadingSpinner.style.display = 'none';

            if (this.currentAlbums.length === 0) {
                emptyState.style.display = 'flex';
            } else {
                this.renderAlbums();
            }

        } catch (error) {
            console.error('Load albums error:', error);
            loadingSpinner.style.display = 'none';
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 렌더링
    renderAlbums() {
        const albumsGrid = document.getElementById('albums-grid');
        albumsGrid.className = `albums-${this.viewMode}`;
        
        this.currentAlbums.forEach(album => {
            const card = this.createAlbumCard(album);
            albumsGrid.appendChild(card);
        });
    }

    // 앨범 카드 생성
    createAlbumCard(album) {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.dataset.albumId = album.id;

        // 커버 이미지 URL
        let coverUrl = '/assets/images/default-album-cover.jpg';
        if (album.media_files?.thumbnail_path) {
            const { data } = supabase.storage
                .from('media')
                .getPublicUrl(album.media_files.thumbnail_path);
            coverUrl = data.publicUrl;
        }

        // 메모리 수
        const memoryCount = album.album_memories?.[0]?.count || 0;

        card.innerHTML = `
            <div class="album-cover">
                <img src="${coverUrl}" alt="${album.name}">
                ${album.password_hash ? '<i class="fas fa-lock album-lock-icon"></i>' : ''}
                ${album.is_public ? '<i class="fas fa-globe album-public-icon"></i>' : ''}
            </div>
            
            <div class="album-info">
                <h3 class="album-title">${album.name}</h3>
                ${album.description ? `<p class="album-description">${album.description}</p>` : ''}
                
                <div class="album-meta">
                    <span class="album-count">
                        <i class="fas fa-images"></i>
                        ${memoryCount} ${window.translations[currentLang].items}
                    </span>
                    <span class="album-views">
                        <i class="fas fa-eye"></i>
                        ${album.view_count}
                    </span>
                </div>
                
                <div class="album-actions">
                    <button class="btn btn-sm btn-primary" onclick="albumManager.viewAlbum('${album.id}')">
                        <i class="fas fa-folder-open"></i>
                        ${window.translations[currentLang].btn_view}
                    </button>
                    ${album.created_by === supabase.auth.getUser().then(u => u.data.user?.id) ? `
                        <button class="btn btn-sm btn-secondary" onclick="albumManager.editAlbum('${album.id}')">
                            <i class="fas fa-edit"></i>
                            ${window.translations[currentLang].btn_edit}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        return card;
    }

    // 앨범 생성
    async createAlbum(albumData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // 비밀번호 해시 처리
            let passwordHash = null;
            if (albumData.password) {
                // 실제로는 bcrypt 등을 사용해야 하지만, 여기서는 간단히 처리
                passwordHash = btoa(albumData.password);
            }

            const { data: album, error } = await supabase
                .from('albums')
                .insert({
                    name: albumData.name,
                    description: albumData.description,
                    is_public: albumData.isPublic,
                    password_hash: passwordHash,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // 활동 로그
            await this.logActivity('create', 'album', album.id, {
                name: album.name
            });

            showNotification('앨범이 생성되었습니다', 'success');
            this.loadAlbums();
            
            return album;

        } catch (error) {
            console.error('Create album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
            throw error;
        }
    }

    // 앨범 보기
    async viewAlbum(albumId) {
        try {
            // 비밀번호 보호된 앨범 확인
            const { data: album } = await supabase
                .from('albums')
                .select('*')
                .eq('id', albumId)
                .single();

            if (album.password_hash) {
                const password = prompt('비밀번호를 입력하세요:');
                if (!password || btoa(password) !== album.password_hash) {
                    showNotification('비밀번호가 올바르지 않습니다', 'error');
                    return;
                }
            }

            // 조회수 증가
            await supabase
                .from('albums')
                .update({ view_count: album.view_count + 1 })
                .eq('id', albumId);

            // 앨범 페이지로 이동
            window.location.href = `album-view.html?id=${albumId}`;

        } catch (error) {
            console.error('View album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 편집
    async editAlbum(albumId) {
        try {
            const { data: album, error } = await supabase
                .from('albums')
                .select('*')
                .eq('id', albumId)
                .single();

            if (error) throw error;

            // 편집 모달에 데이터 채우기
            document.getElementById('edit-album-id').value = album.id;
            document.getElementById('edit-album-name').value = album.name;
            document.getElementById('edit-album-description').value = album.description || '';
            document.getElementById('edit-album-public').checked = album.is_public;
            document.getElementById('edit-album-password').value = '';
            
            // 모달 표시
            document.getElementById('edit-album-modal').style.display = 'flex';

        } catch (error) {
            console.error('Edit album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 업데이트
    async updateAlbum() {
        const albumId = document.getElementById('edit-album-id').value;
        const updateData = {
            name: document.getElementById('edit-album-name').value,
            description: document.getElementById('edit-album-description').value,
            is_public: document.getElementById('edit-album-public').checked,
            updated_at: new Date().toISOString()
        };

        // 비밀번호 변경 시
        const newPassword = document.getElementById('edit-album-password').value;
        if (newPassword) {
            updateData.password_hash = btoa(newPassword);
        }

        try {
            const { error } = await supabase
                .from('albums')
                .update(updateData)
                .eq('id', albumId);

            if (error) throw error;

            // 활동 로그
            await this.logActivity('update', 'album', albumId, {
                changes: updateData
            });

            showNotification('앨범이 수정되었습니다', 'success');
            document.getElementById('edit-album-modal').style.display = 'none';
            this.loadAlbums();

        } catch (error) {
            console.error('Update album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 삭제
    async deleteAlbum(albumId) {
        if (!confirm('앨범을 삭제하시겠습니까? 앨범 내의 추억들은 삭제되지 않습니다.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('albums')
                .delete()
                .eq('id', albumId);

            if (error) throw error;

            // 활동 로그
            await this.logActivity('delete', 'album', albumId);

            showNotification('앨범이 삭제되었습니다', 'success');
            this.loadAlbums();

        } catch (error) {
            console.error('Delete album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범에 추억 추가
    async addMemoryToAlbum(albumId, memoryId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // 중복 확인
            const { data: existing } = await supabase
                .from('album_memories')
                .select('*')
                .eq('album_id', albumId)
                .eq('memory_id', memoryId)
                .single();

            if (existing) {
                showNotification('이미 앨범에 추가된 추억입니다', 'warning');
                return;
            }

            // 추가
            const { error } = await supabase
                .from('album_memories')
                .insert({
                    album_id: albumId,
                    memory_id: memoryId,
                    added_by: user.id
                });

            if (error) throw error;

            showNotification('앨범에 추가되었습니다', 'success');

        } catch (error) {
            console.error('Add to album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범에서 추억 제거
    async removeMemoryFromAlbum(albumId, memoryId) {
        try {
            const { error } = await supabase
                .from('album_memories')
                .delete()
                .eq('album_id', albumId)
                .eq('memory_id', memoryId);

            if (error) throw error;

            showNotification('앨범에서 제거되었습니다', 'success');

        } catch (error) {
            console.error('Remove from album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 커버 변경
    async updateAlbumCover(albumId, mediaFileId) {
        try {
            const { error } = await supabase
                .from('albums')
                .update({ 
                    cover_image_id: mediaFileId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', albumId);

            if (error) throw error;

            showNotification('앨범 커버가 변경되었습니다', 'success');
            this.loadAlbums();

        } catch (error) {
            console.error('Update album cover error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 공유
    async shareAlbum(albumId) {
        try {
            const shareUrl = `${window.location.origin}/album-view.html?id=${albumId}`;
            
            if (navigator.share) {
                await navigator.share({
                    title: '민호민아 성장앨범',
                    text: '앨범을 공유합니다',
                    url: shareUrl
                });
            } else {
                // 클립보드에 복사
                await navigator.clipboard.writeText(shareUrl);
                showNotification('링크가 복사되었습니다', 'success');
            }

            // 활동 로그
            await this.logActivity('share', 'album', albumId);

        } catch (error) {
            console.error('Share album error:', error);
            showNotification(window.translations[currentLang].msg_error, 'error');
        }
    }

    // 앨범 내보내기
    async exportAlbum(albumId) {
        try {
            showNotification(window.translations[currentLang].msg_preparing_export, 'info');
            
            // 앨범 정보와 추억들 가져오기
            const { data: album, error: albumError } = await supabase
                .from('albums')
                .select(`
                    *,
                    album_memories(
                        memories(
                            *,
                            media_files(*),
                            memory_people(people(*)),
                            memory_tags(tags(*))
                        )
                    )
                `)
                .eq('id', albumId)
                .single();

            if (albumError) throw albumError;

            // JSON 파일로 내보내기
            const exportData = {
                album: {
                    name: album.name,
                    description: album.description,
                    created_at: album.created_at
                },
                memories: album.album_memories.map(am => am.memories)
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `album_${album.name}_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            // 활동 로그
            await this.logActivity('download', 'album', albumId, {
                memory_count: album.album_memories.length
            });

            showNotification(window.translations[currentLang].msg_export_success, 'success');

        } catch (error) {
            console.error('Export album error:', error);
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

    // 뷰 모드 변경
    changeViewMode(mode) {
        this.viewMode = mode;
        const albumsGrid = document.getElementById('albums-grid');
        albumsGrid.innerHTML = '';
        this.renderAlbums();
    }
}

// 전역 인스턴스 생성
window.albumManager = new AlbumManager();
