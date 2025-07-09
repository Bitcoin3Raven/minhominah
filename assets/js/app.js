/**
 * 민호민아 성장앨범 - 메인 JavaScript
 * Supabase 연동 및 기본 기능
 */

// 전역 변수
let supabaseClient = null;
let currentUser = null;

// Supabase 설정 (실제 키로 교체 필요)
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // 실제 Supabase URL로 변경
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // 실제 Anon Key로 변경
};

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('민호민아 성장앨범 로딩 중...');
    
    // Supabase 클라이언트 초기화
    initSupabase();
    
    // 인증 상태 확인
    checkAuthState();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 페이지별 초기화
    initCurrentPage();
    
    console.log('앱 초기화 완료!');
});

/**
 * Supabase 클라이언트 초기화
 */
function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            console.log('Supabase 클라이언트 초기화 완료');
        } else {
            console.warn('Supabase 라이브러리가 로드되지 않았습니다.');
        }
    } catch (error) {
        console.error('Supabase 초기화 오류:', error);
    }
}

/**
 * 인증 상태 확인
 */
async function checkAuthState() {
    if (!supabaseClient) return;
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            console.log('로그인 상태:', currentUser.email);
            updateUIForLoggedInUser();
        } else {
            console.log('로그아웃 상태');
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('인증 상태 확인 오류:', error);
    }
}

/**
 * 로그인된 사용자 UI 업데이트
 */
function updateUIForLoggedInUser() {
    // 로그인 버튼 숨기기
    const loginButtons = document.querySelectorAll('[id$="loginBtn"], [id$="LoginBtn"]');
    loginButtons.forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
    
    // 사용자 정보 표시
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = currentUser?.user_metadata?.full_name || currentUser?.email || '사용자';
    });
}

/**
 * 로그아웃된 사용자 UI 업데이트
 */
function updateUIForLoggedOutUser() {
    // 로그인 버튼 표시
    const loginButtons = document.querySelectorAll('[id$="loginBtn"], [id$="LoginBtn"]');
    loginButtons.forEach(btn => {
        if (btn) btn.style.display = 'block';
    });
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 로그인 버튼들
    const loginButtons = document.querySelectorAll('[id$="loginBtn"], [id$="LoginBtn"]');
    loginButtons.forEach(button => {
        button.addEventListener('click', showLoginModal);
    });
    
    // 파일 업로드 버튼
    const uploadButtons = document.querySelectorAll('.upload-btn');
    uploadButtons.forEach(button => {
        button.addEventListener('click', showUploadModal);
    });
    
    // 모달 닫기
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

/**
 * 페이지별 초기화
 */
function initCurrentPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'home';
    
    switch(page) {
        case 'home':
            initHomePage();
            break;
        case 'gallery':
            initGalleryPage();
            break;
        case 'timeline':
            initTimelinePage();
            break;
        case 'growth':
            initGrowthPage();
            break;
        default:
            console.log('기본 페이지 로딩');
    }
}

/**
 * 홈페이지 초기화
 */
function initHomePage() {
    console.log('홈페이지 초기화');
    
    // 통계 데이터 로드
    loadDashboardStats();
    
    // 최근 추억 로드
    loadRecentMemories();
    
    // 애니메이션 효과 적용
    applyFadeInAnimation();
}

/**
 * 갤러리페이지 초기화
 */
function initGalleryPage() {
    console.log('갤러리페이지 초기화');
    // 갤러리 관련 초기화 로직
}

/**
 * 타임라인페이지 초기화
 */
function initTimelinePage() {
    console.log('타임라인페이지 초기화');
    // 타임라인 관련 초기화 로직
}

/**
 * 성장기록페이지 초기화
 */
function initGrowthPage() {
    console.log('성장기록페이지 초기화');
    // 성장기록 관련 초기화 로직
}

/**
 * 대시보드 통계 로드
 */
async function loadDashboardStats() {
    if (!supabaseClient) {
        // Supabase 연결이 안된 경우 더미 데이터
        updateStatsUI({
            totalMemories: 42,
            totalMedia: 156,
            growthRecords: 24,
            daysTogether: '1,234일'
        });
        return;
    }
    
    try {
        // 실제 Supabase 쿼리 (연결 후 활성화)
        /*
        const { data: memories, error } = await supabaseClient
            .from('memories')
            .select('id');
            
        if (error) throw error;
        
        updateStatsUI({
            totalMemories: memories?.length || 0,
            // ... 다른 통계들
        });
        */
        
        // 임시 더미 데이터
        updateStatsUI({
            totalMemories: 42,
            totalMedia: 156,
            growthRecords: 24,
            daysTogether: '1,234일'
        });
        
    } catch (error) {
        console.error('통계 로드 오류:', error);
    }
}

/**
 * 통계 UI 업데이트
 */
function updateStatsUI(stats) {
    const elements = {
        totalMemories: document.querySelector('[x-text="stats.totalMemories"]'),
        totalMedia: document.querySelector('[x-text="stats.totalMedia"]'),
        growthRecords: document.querySelector('[x-text="stats.growthRecords"]'),
        daysTogether: document.querySelector('[x-text="stats.daysTogether"]')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key];
        }
    });
}

/**
 * 최근 추억 로드
 */
async function loadRecentMemories() {
    if (!supabaseClient) {
        console.log('Supabase 미연결 - 최근 추억 로드 건너뜀');
        return;
    }
    
    try {
        // 실제 구현 시 활성화
        /*
        const { data: memories, error } = await supabaseClient
            .from('memories')
            .select(`
                *,
                media_files(*),
                memory_people(people(*))
            `)
            .order('memory_date', { ascending: false })
            .limit(6);
            
        if (error) throw error;
        
        renderRecentMemories(memories);
        */
        
        console.log('최근 추억 로드 완료');
    } catch (error) {
        console.error('최근 추억 로드 오류:', error);
    }
}

/**
 * 페이드인 애니메이션 적용
 */
function applyFadeInAnimation() {
    const elements = document.querySelectorAll('.card, .grid > div');
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * 로그인 모달 표시
 */
function showLoginModal() {
    console.log('로그인 모달 표시');
    
    if (!supabaseClient) {
        showNotification('Supabase 설정이 필요합니다.', 'error');
        return;
    }
    
    // Alpine.js를 통한 모달 표시
    const loginModal = document.querySelector('[x-data*="showLogin"]');
    if (loginModal) {
        loginModal._x_dataStack[0].showLogin = true;
    }
    
    // Supabase Auth UI 렌더링
    renderAuthUI();
}

/**
 * Supabase Auth UI 렌더링
 */
function renderAuthUI() {
    const container = document.getElementById('supabase-auth-container');
    if (!container || !supabaseClient) return;
    
    // 간단한 로그인 폼 (실제로는 Supabase Auth UI 사용)
    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="form-label">이메일</label>
                <input type="email" id="loginEmail" class="form-input" placeholder="이메일을 입력하세요">
            </div>
            <div>
                <label class="form-label">비밀번호</label>
                <input type="password" id="loginPassword" class="form-input" placeholder="비밀번호를 입력하세요">
            </div>
            <button onclick="handleLogin()" class="gradient-btn w-full">로그인</button>
            <p class="text-center text-sm text-gray-600">
                계정이 없으신가요? 
                <a href="#" onclick="showSignupForm()" class="text-pink-500 hover:text-pink-600">회원가입</a>
            </p>
        </div>
    `;
}

/**
 * 로그인 처리
 */
async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showNotification('이메일과 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showNotification('로그인 성공!', 'success');
        closeModal();
        location.reload(); // 페이지 새로고침
        
    } catch (error) {
        console.error('로그인 오류:', error);
        showNotification('로그인에 실패했습니다: ' + error.message, 'error');
    }
}

/**
 * 업로드 모달 표시
 */
function showUploadModal() {
    console.log('업로드 모달 표시');
    // 업로드 모달 구현
}

/**
 * 모달 닫기
 */
function closeModal() {
    const modals = document.querySelectorAll('[x-data*="showLogin"]');
    modals.forEach(modal => {
        if (modal._x_dataStack && modal._x_dataStack[0]) {
            modal._x_dataStack[0].showLogin = false;
        }
    });
}

/**
 * 알림 표시
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * 유틸리티 함수들
 */
const Utils = {
    // 날짜 포맷팅
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // 파일 크기 포맷팅
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 이미지 리사이징
    resizeImage: (file, maxWidth = 1920, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
};

// 전역 함수로 내보내기
window.MinhoMinah = {
    showLoginModal,
    showUploadModal,
    closeModal,
    handleLogin,
    showNotification,
    Utils
};