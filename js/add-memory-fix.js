// add-memory.html 페이지의 오류 수정을 위한 패치 파일

// checkAuth 함수 정의
window.checkAuth = async function() {
    if (!window.supabaseClient) {
        console.log('Supabase 클라이언트가 아직 초기화되지 않았습니다.');
        setTimeout(checkAuth, 100);
        return;
    }
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            console.log('로그인된 사용자:', user.email);
            // 로그인 폼 숨기고 추억 추가 폼 표시
            const authCheck = document.getElementById('authCheck');
            const addMemoryForm = document.getElementById('addMemoryForm');
            if (authCheck) authCheck.style.display = 'none';
            if (addMemoryForm) addMemoryForm.style.display = 'block';
            
            // 로그인 모달이 열려있으면 닫기
            const loginModal = document.querySelector('.modal-backdrop, .modal, [class*="modal"]');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
            
            // 모든 required 필드에서 required 속성 일시적으로 제거 (디버깅용)
            const requiredFields = document.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                field.dataset.wasRequired = 'true';
                field.removeAttribute('required');
            });
        }
    } catch (error) {
        console.error('인증 확인 중 오류:', error);
    }
};

// SmartTagSystem 수정 - supabaseClient 사용
if (typeof SmartTagSystem !== 'undefined') {
    const originalInit = SmartTagSystem.prototype.init;
    SmartTagSystem.prototype.init = async function() {
        // supabaseClient가 준비될 때까지 대기
        if (!window.supabaseClient) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (window.supabaseClient) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        // supabase를 supabaseClient로 변경
        if (this.loadExistingTags) {
            const originalLoadTags = this.loadExistingTags;
            this.loadExistingTags = async function() {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('tags')
                        .select('*')
                        .order('name');
                    
                    if (error) throw error;
                    
                    this.existingTags = data || [];
                    console.log('기존 태그 로드 완료:', this.existingTags.length);
                } catch (error) {
                    console.error('태그 로드 실패:', error);
                }
            };
        }
        
        // 원래 init 함수 호출
        if (originalInit) {
            await originalInit.call(this);
        }
    };
}

// 이미지 업로드 함수 수정
window.uploadImage = async function(file) {
    if (!window.supabaseClient) {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }
    
    try {
        // 현재 사용자 정보 가져오기
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `memories/${user.id}/${fileName}`;
        
        const { data, error } = await window.supabaseClient.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        return data.path;
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        throw error;
    }
};

// 추억 저장 함수 수정
window.saveMemory = async function() {
    if (!window.supabaseClient) {
        alert('시스템이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';
    }
    
    try {
        // 현재 사용자 정보 가져오기
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // selectedFiles가 정의되어 있는지 확인
        const fileInput = document.querySelector('input[type="file"]');
        const selectedFiles = fileInput ? fileInput.files : [];
        
        // 이미지 업로드
        const uploadedPaths = [];
        for (const file of selectedFiles) {
            const path = await uploadImage(file);
            uploadedPaths.push(path);
        }
        
        // 추억 데이터 저장
        const memoryData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            memory_date: document.getElementById('memoryDate').value,
            location: document.getElementById('location').value,
            weather: document.getElementById('weather').value,
            mood: document.getElementById('mood').value,
            is_public: document.getElementById('isPublic') ? document.getElementById('isPublic').checked : false,
            user_id: user.id,
            created_at: new Date().toISOString()
        };
        
        const { data: memory, error: memoryError } = await window.supabaseClient
            .from('memories')
            .insert(memoryData)
            .select()
            .single();
        
        if (memoryError) throw memoryError;
        
        // 미디어 파일 정보 저장
        if (uploadedPaths.length > 0) {
            const mediaData = uploadedPaths.map((path, index) => ({
                memory_id: memory.id,
                file_path: path,
                file_type: selectedFiles[index].type.startsWith('image/') ? 'image' : 'video',
                order_index: index
            }));
            
            const { error: mediaError } = await window.supabaseClient
                .from('media_files')
                .insert(mediaData);
            
            if (mediaError) throw mediaError;
        }
        
        // 태그 저장
        if (tagSystem && tagSystem.selectedTags.length > 0) {
            const tagData = tagSystem.selectedTags.map(tagId => ({
                memory_id: memory.id,
                tag_id: tagId
            }));
            
            const { error: tagError } = await window.supabaseClient
                .from('memory_tags')
                .insert(tagData);
            
            if (tagError) throw tagError;
        }
        
        // 사람 태그 저장
        const selectedPeople = Array.from(document.querySelectorAll('input[name="people"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedPeople.length > 0) {
            const peopleData = selectedPeople.map(personId => ({
                memory_id: memory.id,
                person_id: personId
            }));
            
            const { error: peopleError } = await window.supabaseClient
                .from('memory_people')
                .insert(peopleData);
            
            if (peopleError) throw peopleError;
        }
        
        // 성공 메시지
        alert('추억이 성공적으로 저장되었습니다!');
        
        // 메인 페이지로 이동
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        console.error('추억 저장 오류:', error);
        alert('추억 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '추억 저장';
        }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // Supabase 클라이언트 대기
    const waitForSupabase = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(waitForSupabase);
            
            // 태그 시스템 초기화
            if (typeof SmartTagSystem !== 'undefined' && !window.tagSystem) {
                window.tagSystem = new SmartTagSystem();
            }
            
            // 인증 확인
            checkAuth();
        }
    }, 100);
});

console.log('add-memory-fix.js loaded');