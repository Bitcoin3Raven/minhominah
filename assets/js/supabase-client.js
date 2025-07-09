// Supabase 클라이언트 초기화 및 헬퍼 함수들

// Supabase 인스턴스 (index.html에서 초기화됨)
let supabase = null;

// Supabase 초기화 대기
window.addEventListener('supabaseReady', () => {
    supabase = window.supabase;
    console.log('Supabase 클라이언트 준비 완료');
    
    // 세션 체크
    checkAuthStatus();
});

// 인증 상태 확인
async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        console.log('로그인 상태:', session.user.email);
        updateUIForLoggedIn(session.user);
    } else {
        console.log('로그아웃 상태');
        updateUIForLoggedOut();
    }
}

// 로그인 처리
async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('로그인 성공:', data.user.email);
        return { success: true, user: data.user };
    } catch (error) {
        console.error('로그인 오류:', error.message);
        return { success: false, error: error.message };
    }
}

// 회원가입 처리
async function handleSignUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        // 프로필 생성
        if (data.user) {
            await createUserProfile(data.user.id, fullName);
        }
        
        return { success: true, user: data.user };
    } catch (error) {
        console.error('회원가입 오류:', error.message);
        return { success: false, error: error.message };
    }
}

// 로그아웃
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('로그아웃 오류:', error.message);
    } else {
        console.log('로그아웃 성공');
        window.location.reload();
    }
}

// 사용자 프로필 생성
async function createUserProfile(userId, fullName) {
    const { error } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            full_name: fullName,
            role: 'viewer' // 기본값
        });
    
    if (error) {
        console.error('프로필 생성 오류:', error.message);
    }
}

// 최근 추억 불러오기
async function loadRecentMemories(limit = 6) {
    try {
        const { data, error } = await supabase
            .from('memories')
            .select(`
                *,
                media_files(*)
            `)
            .order('memory_date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('추억 로드 오류:', error.message);
        return [];
    }
}

// 통계 정보 불러오기
async function loadStatistics() {
    try {
        const stats = {
            photos: 0,
            videos: 0,
            memories: 0,
            tags: 0
        };
        
        // 사진/동영상 수
        const { data: mediaFiles } = await supabase
            .from('media_files')
            .select('file_type');
        
        if (mediaFiles) {
            stats.photos = mediaFiles.filter(f => f.file_type === 'image').length;
            stats.videos = mediaFiles.filter(f => f.file_type === 'video').length;
        }
        
        // 추억 수
        const { count: memoriesCount } = await supabase
            .from('memories')
            .select('*', { count: 'exact', head: true });
        stats.memories = memoriesCount || 0;
        
        // 태그 수
        const { count: tagsCount } = await supabase
            .from('tags')
            .select('*', { count: 'exact', head: true });
        stats.tags = tagsCount || 0;
        
        return stats;
    } catch (error) {
        console.error('통계 로드 오류:', error.message);
        return { photos: 0, videos: 0, memories: 0, tags: 0 };
    }
}

// UI 업데이트 함수들
function updateUIForLoggedIn(user) {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = '로그아웃';
        loginBtn.onclick = handleLogout;
    }
    
    // 사용자 정보 표시
    const userEmail = user.email;
    console.log('현재 사용자:', userEmail);
}

function updateUIForLoggedOut() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = '로그인';
        loginBtn.onclick = () => {
            document.getElementById('loginModal').classList.remove('hidden');
        };
    }
}

// 파일 업로드 헬퍼
async function uploadFile(file, bucket = 'media') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);
        
        if (error) throw error;
        
        return { success: true, path: data.path };
    } catch (error) {
        console.error('파일 업로드 오류:', error.message);
        return { success: false, error: error.message };
    }
}

// 실시간 구독 설정
function setupRealtimeSubscription(table, callback) {
    return supabase
        .channel(`${table}_channel`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: table },
            callback
        )
        .subscribe();
}
