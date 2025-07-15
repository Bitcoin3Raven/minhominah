// 인증 상태 관리
let currentUser = null;

// 페이지 로드 시 인증 상태 확인
async function checkAuthStatus() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        updateAuthUI(user);
        return user;
    } catch (error) {
        console.error('인증 상태 확인 실패:', error);
        updateAuthUI(null);
        return null;
    }
}

// 인증 상태에 따른 UI 업데이트
function updateAuthUI(user) {
    const authButton = document.querySelector('button[onclick="showLoginForm()"]');
    if (!authButton) return;

    if (user) {
        // 로그인 상태: 사용자 메뉴 표시
        const userMenu = createUserMenu(user);
        authButton.replaceWith(userMenu);
    } else {
        // 로그아웃 상태: 로그인 버튼 표시
        const loginButton = createLoginButton();
        const existingMenu = document.getElementById('userMenu');
        if (existingMenu) {
            existingMenu.replaceWith(loginButton);
        }
    }
}

// 사용자 메뉴 생성
function createUserMenu(user) {
    const menuContainer = document.createElement('div');
    menuContainer.className = 'relative';
    menuContainer.id = 'userMenu';
    
    // 사용자 이름 가져오기
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
    
    menuContainer.innerHTML = `
        <button onclick="toggleUserDropdown()" 
                class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition text-sm sm:text-base">
            <i class="fas fa-user-circle"></i>
            <span class="hidden sm:inline">${userName}</span>
            <i class="fas fa-chevron-down text-xs"></i>
        </button>
        <div id="userDropdown" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
            <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">${userName}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${user.email}</p>
            </div>
            <a href="family-settings.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i class="fas fa-cog mr-2"></i>
                <span data-lang="user_settings">설정</span>
            </a>
            <button onclick="handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i class="fas fa-sign-out-alt mr-2"></i>
                <span data-lang="auth_logout">로그아웃</span>
            </button>
        </div>
    `;
    
    return menuContainer;
}

// 로그인 버튼 생성
function createLoginButton() {
    const button = document.createElement('button');
    button.onclick = function() {
        if (typeof showLoginForm === 'function') {
            showLoginForm();
        } else {
            console.error('showLoginForm 함수가 정의되지 않았습니다.');
        }
    };
    button.className = 'px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm sm:text-base';
    button.innerHTML = '<i class="fas fa-user mr-1 sm:mr-2"></i><span class="hidden sm:inline" data-lang="auth_login">로그인</span>';
    return button;
}

// 사용자 드롭다운 토글
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        
        // 외부 클릭 시 드롭다운 닫기
        if (!dropdown.classList.contains('hidden')) {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest('#userMenu')) {
                    dropdown.classList.add('hidden');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }
    }
}

// 로그아웃 처리
async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        updateAuthUI(null);
        // 홈페이지로 리다이렉트
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = '/';
        } else {
            location.reload();
        }
    } catch (error) {
        console.error('로그아웃 실패:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// 인증 상태 변경 리스너
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    currentUser = session?.user || null;
    updateAuthUI(currentUser);
    
    // 로그인/로그아웃 이벤트에 따른 추가 처리
    if (event === 'SIGNED_IN') {
        // 데이터 새로고침 등
        if (typeof loadMemories === 'function') {
            loadMemories();
        }
    }
});

// 페이지 로드 시 인증 상태 확인
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    return currentUser;
}

// 로그인 필요 여부 확인
function requireAuth() {
    if (!currentUser) {
        if (typeof showLoginForm === 'function') {
            showLoginForm();
        } else {
            console.error('로그인이 필요하지만 showLoginForm 함수가 정의되지 않았습니다.');
        }
        return false;
    }
    return true;
}
