// 드롭다운 방식의 네비게이션 시스템
class DropdownNavigation {
    constructor() {
        this.isMenuOpen = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // 사용자 인증 상태 확인
        if (typeof supabaseClient !== 'undefined') {
            const { data: { user } } = await supabaseClient.auth.getUser();
            this.currentUser = user;
        }
    }

    getLanguageFlag() {
        const currentLang = localStorage.getItem('selectedLanguage') || 'ko';
        const flags = {
            ko: '🇰🇷',
            th: '🇹🇭',
            en: '🇺🇸'
        };
        return flags[currentLang] || '🌐';
    }

    getCurrentLangCode() {
        const currentLang = localStorage.getItem('selectedLanguage') || 'ko';
        const codes = {
            ko: 'KR',
            th: 'TH',
            en: 'US'
        };
        return codes[currentLang] || 'KR';
    }

    createHeader() {
        const header = document.createElement('header');
        header.className = 'fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/95 dark:bg-slate-900/95 shadow-md dark:shadow-slate-800/50';
        
        // 현재 페이지 확인
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        header.innerHTML = `
            <div class="container mx-auto px-4 py-4 flex justify-between items-center">
                <!-- 로고 -->
                <h1 class="text-xl font-bold text-gray-800 dark:text-slate-100">
                    <a href="index.html" class="hover:opacity-80 transition-opacity flex items-center">
                        <img src="assets/images/logo.png" alt="Logo" class="h-10 w-auto">
                    </a>
                </h1>
                
                <!-- 데스크톱 네비게이션 -->
                <nav class="hidden lg:flex items-center gap-2">
                    <a href="index.html" class="px-4 py-2 text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 ${currentPage === 'index.html' ? 'font-semibold bg-gray-100 dark:bg-slate-800' : ''}" data-lang-key="nav_home" title="홈">
                        <i class="fas fa-home mr-2"></i><span data-lang="nav_home">홈</span>
                    </a>
                    
                    <!-- 추억 드롭다운 -->
                    <div class="relative group">
                        <button class="px-4 py-2 text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1 ${(currentPage === 'growth.html' || currentPage === 'statistics.html') ? 'font-semibold bg-gray-100 dark:bg-slate-800' : ''}">
                            <i class="fas fa-images mr-2"></i>
                            <span data-lang="nav_memories">추억</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <a href="growth.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg ${currentPage === 'growth.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-chart-line mr-2"></i>
                                <span data-lang="nav_growth">성장 기록</span>
                            </a>
                            <a href="statistics.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-b-lg ${currentPage === 'statistics.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-chart-bar mr-2"></i>
                                <span data-lang="nav_statistics">통계</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- 가족 드롭다운 -->
                    <div class="relative group">
                        <button class="px-4 py-2 text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1 ${(currentPage === 'family-settings.html' || currentPage === 'family-invite.html') ? 'font-semibold bg-gray-100 dark:bg-slate-800' : ''}">
                            <i class="fas fa-users mr-2"></i>
                            <span data-lang="nav_family_menu">가족</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <a href="family-settings.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg ${currentPage === 'family-settings.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-cog mr-2"></i>
                                <span data-lang="nav_family">가족 설정</span>
                            </a>
                            <a href="family-invite.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-b-lg ${currentPage === 'family-invite.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-user-plus mr-2"></i>
                                <span data-lang="nav_invite">가족 초대</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- 도구 드롭다운 -->
                    <div class="relative group">
                        <button class="px-4 py-2 text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1 ${(currentPage === 'backup.html' || currentPage === 'photobook-creator.html' || currentPage === 'share.html') ? 'font-semibold bg-gray-100 dark:bg-slate-800' : ''}">
                            <i class="fas fa-tools mr-2"></i>
                            <span data-lang="nav_tools">도구</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <a href="backup.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg ${currentPage === 'backup.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-database mr-2"></i>
                                <span data-lang="nav_backup">백업</span>
                            </a>
                            <a href="photobook-creator.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 ${currentPage === 'photobook-creator.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-book mr-2"></i>
                                <span data-lang="nav_photobook">포토북</span>
                            </a>
                            <a href="share.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-b-lg ${currentPage === 'share.html' ? 'bg-gray-100 dark:bg-slate-700 font-semibold' : ''}">
                                <i class="fas fa-share-alt mr-2"></i>
                                <span data-lang="nav_share">공유</span>
                            </a>
                        </div>
                    </div>
                    
                    <a href="add-memory.html" class="ml-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all" data-lang-key="nav_add_memory" title="추억 추가">
                        <i class="fas fa-plus-circle mr-2"></i><span data-lang="nav_add_memory">추억 추가</span>
                    </a>
                </nav>
                
                <!-- 우측 액션 영역 -->
                <div class="flex items-center space-x-2">
                    <!-- 사용자 정보 / 로그인 버튼 -->
                    <div id="userSection" class="mr-2">
                        ${this.currentUser ? `
                            <div class="flex items-center space-x-2">
                                <span class="text-sm text-gray-600 dark:text-slate-300 hidden sm:inline">${this.currentUser.email}</span>
                                <button onclick="logout()" class="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                                    <i class="fas fa-sign-out-alt mr-1"></i>
                                    <span data-lang="auth_logout">로그아웃</span>
                                </button>
                            </div>
                        ` : `
                            <a href="login.html" class="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                                <i class="fas fa-sign-in-alt mr-1"></i>
                                <span data-lang="auth_login">로그인</span>
                            </a>
                        `}
                    </div>
                    
                    <!-- 언어 선택기 -->
                    <div class="relative">
                        <button id="langToggle" class="relative w-10 h-10 rounded-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md border border-gray-200 dark:border-slate-600 group">
                            <svg class="w-5 h-5 text-gray-600 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                            </svg>
                            <span class="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">${this.getCurrentLangCode()}</span>
                        </button>
                        
                        <div id="langDropdown" class="hidden absolute right-0 mt-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-600 z-50 overflow-hidden opacity-0 -translate-y-2 transition-all duration-200">
                            <div class="py-2">
                                <button class="lang-option w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 flex items-center justify-between group ${this.getCurrentLangCode() === 'KR' ? 'bg-gray-100 dark:bg-slate-700' : ''}" data-lang="ko">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                            <span class="text-sm font-bold text-gray-700 dark:text-slate-200">KR</span>
                                        </div>
                                        <span class="text-sm font-medium text-gray-700 dark:text-slate-200">한국어</span>
                                    </div>
                                    ${this.getCurrentLangCode() === 'KR' ? '<div class="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center"><i class="fas fa-check text-white text-xs"></i></div>' : ''}
                                </button>
                                <button class="lang-option w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 flex items-center justify-between group ${this.getCurrentLangCode() === 'TH' ? 'bg-gray-100 dark:bg-slate-700' : ''}" data-lang="th">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                            <span class="text-sm font-bold text-gray-700 dark:text-slate-200">TH</span>
                                        </div>
                                        <span class="text-sm font-medium text-gray-700 dark:text-slate-200">ไทย</span>
                                    </div>
                                    ${this.getCurrentLangCode() === 'TH' ? '<div class="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center"><i class="fas fa-check text-white text-xs"></i></div>' : ''}
                                </button>
                                <button class="lang-option w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 flex items-center justify-between group ${this.getCurrentLangCode() === 'US' ? 'bg-gray-100 dark:bg-slate-700' : ''}" data-lang="en">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                            <span class="text-sm font-bold text-gray-700 dark:text-slate-200">US</span>
                                        </div>
                                        <span class="text-sm font-medium text-gray-700 dark:text-slate-200">English</span>
                                    </div>
                                    ${this.getCurrentLangCode() === 'US' ? '<div class="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center"><i class="fas fa-check text-white text-xs"></i></div>' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 다크모드 토글 -->
                    <button id="themeToggle" class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md border border-gray-200 dark:border-slate-600 group">
                        <div class="relative">
                            <svg id="sunIcon" class="w-5 h-5 text-amber-500 transition-all duration-300 group-hover:rotate-180" fill="currentColor" viewBox="0 0 20 20" style="display: block;">
                                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
                            </svg>
                            <svg id="moonIcon" class="w-5 h-5 text-purple-500 transition-all duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20" style="display: none;">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                            </svg>
                        </div>
                    </button>
                    
                    <!-- 모바일 메뉴 토글 -->
                    <button id="mobileMenuToggle" class="lg:hidden w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path class="menu-icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            <path class="close-icon hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- 모바일 메뉴 -->
            <nav id="mobileMenu" class="lg:hidden hidden">
                <div class="container mx-auto px-4 pb-4">
                    <div class="space-y-2">
                        <a href="index.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                            <i class="fas fa-home mr-2"></i>
                            <span data-lang="nav_home">홈</span>
                        </a>
                        
                        <!-- 추억 섹션 -->
                        <div class="pl-4">
                            <div class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1" data-lang="nav_memories">추억</div>
                            <a href="growth.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-chart-line mr-2"></i>
                                <span data-lang="nav_growth">성장 기록</span>
                            </a>
                            <a href="statistics.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-chart-bar mr-2"></i>
                                <span data-lang="nav_statistics">통계</span>
                            </a>
                        </div>
                        
                        <!-- 가족 섹션 -->
                        <div class="pl-4">
                            <div class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1" data-lang="nav_family_menu">가족</div>
                            <a href="family-settings.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-cog mr-2"></i>
                                <span data-lang="nav_family">가족 설정</span>
                            </a>
                            <a href="family-invite.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-user-plus mr-2"></i>
                                <span data-lang="nav_invite">가족 초대</span>
                            </a>
                        </div>
                        
                        <!-- 도구 섹션 -->
                        <div class="pl-4">
                            <div class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1" data-lang="nav_tools">도구</div>
                            <a href="backup.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-database mr-2"></i>
                                <span data-lang="nav_backup">백업</span>
                            </a>
                            <a href="photobook-creator.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-book mr-2"></i>
                                <span data-lang="nav_photobook">포토북</span>
                            </a>
                            <a href="share.html" class="block px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <i class="fas fa-share-alt mr-2"></i>
                                <span data-lang="nav_share">공유</span>
                            </a>
                        </div>
                        
                        <div class="border-t border-gray-200 dark:border-slate-600 my-2"></div>
                        
                        <a href="add-memory.html" class="block px-4 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg font-semibold text-center">
                            <i class="fas fa-plus-circle mr-2"></i>
                            <span data-lang="nav_add_memory">추억 추가</span>
                        </a>
                    </div>
                </div>
            </nav>
        `;

        // 드롭다운 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .group:hover .group-hover\\:opacity-100 {
                opacity: 1;
            }
            .group:hover .group-hover\\:visible {
                visibility: visible;
            }
        `;
        document.head.appendChild(style);

        return header;
    }

    changeLanguage(lang) {
        // 언어 저장
        localStorage.setItem('selectedLanguage', lang);
        
        // 언어 코드 즉시 업데이트
        const langCodeSpan = document.querySelector('#langToggle span');
        if (langCodeSpan) {
            const codes = {
                ko: 'KR',
                th: 'TH',
                en: 'US'
            };
            langCodeSpan.textContent = codes[lang] || 'KR';
        }
        
        // 선택된 언어 버튼 활성화 상태 업데이트
        document.querySelectorAll('.lang-option').forEach(button => {
            const buttonLang = button.dataset.lang;
            const checkmark = button.querySelector('.fa-check');
            
            if (buttonLang === lang) {
                button.classList.add('bg-gray-100', 'dark:bg-slate-700');
                if (!checkmark) {
                    button.innerHTML += '<div class="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center"><i class="fas fa-check text-white text-xs"></i></div>';
                }
            } else {
                button.classList.remove('bg-gray-100', 'dark:bg-slate-700');
                const checkDiv = button.querySelector('.w-5.h-5.rounded-full');
                if (checkDiv) {
                    checkDiv.remove();
                }
            }
        });
        
        // language.js의 changeLanguage 함수 호출 (있으면)
        if (typeof languageManager !== 'undefined' && languageManager.changeLanguage) {
            languageManager.changeLanguage(lang);
        } else if (typeof window.changeLanguage === 'function') {
            window.changeLanguage(lang);
        } else {
            // 페이지 새로고침으로 언어 변경 적용
            location.reload();
        }
    }

    setupEventListeners() {
        // 모바일 메뉴 토글
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const menuIcon = mobileMenuToggle.querySelector('.menu-icon');
        const closeIcon = mobileMenuToggle.querySelector('.close-icon');

        mobileMenuToggle.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            
            if (this.isMenuOpen) {
                mobileMenu.classList.remove('hidden');
                menuIcon.classList.add('hidden');
                closeIcon.classList.remove('hidden');
            } else {
                mobileMenu.classList.add('hidden');
                menuIcon.classList.remove('hidden');
                closeIcon.classList.add('hidden');
            }
        });

        // 언어 선택기 이벤트
        const langToggle = document.getElementById('langToggle');
        const langDropdown = document.getElementById('langDropdown');
        
        if (langToggle) {
            langToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (langDropdown.classList.contains('hidden')) {
                    langDropdown.classList.remove('hidden');
                    setTimeout(() => {
                        langDropdown.classList.add('opacity-100', 'translate-y-0');
                        langDropdown.classList.remove('opacity-0', '-translate-y-2');
                    }, 10);
                } else {
                    langDropdown.classList.add('opacity-0', '-translate-y-2');
                    langDropdown.classList.remove('opacity-100', 'translate-y-0');
                    setTimeout(() => {
                        langDropdown.classList.add('hidden');
                    }, 200);
                }
            });
        }

        // 언어 옵션 클릭 이벤트
        document.querySelectorAll('.lang-option').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = button.dataset.lang;
                this.changeLanguage(lang);
                langDropdown.classList.add('hidden');
            });
        });

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', () => {
            if (langDropdown) {
                langDropdown.classList.add('hidden');
            }
        });

        // 다크모드 토글 (기존 기능 복구)
        this.initTheme();
    }

    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const htmlElement = document.documentElement;
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        // 저장된 테마 불러오기
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
        updateThemeIcon(savedTheme);
        
        // 테마 토글 이벤트
        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.classList.contains('dark');
            const newTheme = isDark ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
        
        function updateThemeIcon(theme) {
            if (theme === 'dark') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
    }
}

// 로그아웃 함수
async function logout() {
    if (typeof supabaseClient !== 'undefined') {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    }
}

// 전역 네비게이션 인스턴스
let dropdownNav;

// DOM이 로드되면 네비게이션 초기화
document.addEventListener('DOMContentLoaded', async () => {
    dropdownNav = new DropdownNavigation();
    await dropdownNav.init();
    
    // 기존 헤더 교체
    const existingHeader = document.querySelector('header');
    const newHeader = dropdownNav.createHeader();
    
    if (existingHeader) {
        existingHeader.replaceWith(newHeader);
    } else {
        document.body.insertBefore(newHeader, document.body.firstChild);
    }
    
    dropdownNav.setupEventListeners();
    
    // 언어 시스템이 있다면 초기화
    if (typeof initLanguage === 'function') {
        initLanguage();
    }
});