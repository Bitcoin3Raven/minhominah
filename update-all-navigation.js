// 모든 HTML 파일에 동일한 네비게이션 적용을 위한 스크립트

const fs = require('fs');
const path = require('path');

// 새로운 네비게이션 HTML
const newNavigation = `    <!-- 헤더 영역 -->
    <header class="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 shadow-md transition-transform duration-300">
        <div class="container mx-auto px-4 py-3">
            <div class="flex justify-between items-center">
                <!-- 로고 -->
                <div class="flex items-center">
                    <a href="index.html" class="flex items-center hover:opacity-80 transition-opacity">
                        <img src="assets/images/minho-avatar.png" alt="민호" class="w-8 h-8 rounded-full mr-1" onerror="this.style.display='none'">
                        <img src="assets/images/mina-avatar.png" alt="민아" class="w-8 h-8 rounded-full" onerror="this.style.display='none'">
                        <span class="ml-2 text-lg font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent" data-lang="site_title">민호민아</span>
                    </a>
                </div>
                
                <!-- 데스크톱 네비게이션 -->
                <nav class="hidden md:flex items-center space-x-1 lg:space-x-4">
                    <a href="index.html" class="nav-item">
                        <i class="fas fa-home"></i>
                        <span data-lang="nav_home">홈</span>
                    </a>
                    
                    <!-- 주요 메뉴 드롭다운 -->
                    <div class="relative" data-dropdown-trigger="mainDropdown">
                        <button class="nav-item flex items-center">
                            <i class="fas fa-th"></i>
                            <span data-lang="nav_main_menu">주요 메뉴</span>
                            <i class="fas fa-chevron-down ml-1 text-xs"></i>
                        </button>
                        <div id="mainDropdown" class="dropdown-menu">
                            <a href="add-memory.html" class="dropdown-item">
                                <i class="fas fa-plus-circle text-green-500"></i>
                                <span data-lang="nav_add_memory">추억 추가</span>
                            </a>
                            <a href="growth.html" class="dropdown-item">
                                <i class="fas fa-chart-line text-blue-500"></i>
                                <span data-lang="nav_growth">성장 기록</span>
                            </a>
                            <a href="statistics.html" class="dropdown-item">
                                <i class="fas fa-chart-bar text-purple-500"></i>
                                <span data-lang="nav_statistics">통계</span>
                            </a>
                            <a href="photobook-creator.html" class="dropdown-item">
                                <i class="fas fa-book text-orange-500"></i>
                                <span data-lang="nav_photobook">포토북 만들기</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- 기족 메뉴 드롭다운 -->
                    <div class="relative" data-dropdown-trigger="familyDropdown">
                        <button class="nav-item flex items-center">
                            <i class="fas fa-users"></i>
                            <span data-lang="nav_family">가족</span>
                            <i class="fas fa-chevron-down ml-1 text-xs"></i>
                        </button>
                        <div id="familyDropdown" class="dropdown-menu">
                            <a href="family-settings.html" class="dropdown-item">
                                <i class="fas fa-cog text-gray-500"></i>
                                <span data-lang="nav_family_settings">가족 설정</span>
                            </a>
                            <a href="share.html" class="dropdown-item">
                                <i class="fas fa-share-alt text-blue-500"></i>
                                <span data-lang="nav_share">공유</span>
                            </a>
                            <a href="backup.html" class="dropdown-item">
                                <i class="fas fa-database text-green-500"></i>
                                <span data-lang="nav_backup">백업</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- 추억 추가 버튼 -->
                    <a href="add-memory.html" class="px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105">
                        <i class="fas fa-plus-circle mr-2"></i>
                        <span data-lang="nav_add_memory">추억 추가</span>
                    </a>
                    
                    <!-- 언어 선택 -->
                    <div class="relative" data-dropdown-trigger="langDropdown">
                        <button class="nav-item flex items-center">
                            <i class="fas fa-globe"></i>
                            <span class="ml-1">한국어</span>
                        </button>
                        <div id="langDropdown" class="dropdown-menu">
                            <button onclick="changeLanguage('ko')" class="dropdown-item">
                                <span class="text-lg mr-2">🇰🇷</span>
                                <span>한국어</span>
                            </button>
                            <button onclick="changeLanguage('th')" class="dropdown-item">
                                <span class="text-lg mr-2">🇹🇭</span>
                                <span>ไทย</span>
                            </button>
                            <button onclick="changeLanguage('en')" class="dropdown-item">
                                <span class="text-lg mr-2">🇺🇸</span>
                                <span>English</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- 로그인 버튼 -->
                    <button id="authButton" onclick="showLoginForm()" class="nav-item">
                        <i class="fas fa-user"></i>
                        <span data-lang="auth_login">로그인</span>
                    </button>
                    
                    <!-- 다크모드 토글 -->
                    <button id="themeToggle" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center">
                        <svg id="sunIcon" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
                        </svg>
                        <svg id="moonIcon" class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20" style="display: none;">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                        </svg>
                    </button>
                </nav>
                
                <!-- 모바일 메뉴 버튼 -->
                <button id="menuToggle" class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- 모바일 메뉴 -->
        <div id="mobileMenu" class="mobile-menu md:hidden">
            <div class="px-4 py-6 space-y-2">
                <a href="index.html" class="mobile-menu-item">
                    <i class="fas fa-home"></i>
                    <span data-lang="nav_home">홈</span>
                </a>
                <a href="add-memory.html" class="mobile-menu-item">
                    <i class="fas fa-plus-circle"></i>
                    <span data-lang="nav_add_memory">추억 추가</span>
                </a>
                <a href="growth.html" class="mobile-menu-item">
                    <i class="fas fa-chart-line"></i>
                    <span data-lang="nav_growth">성장 기록</span>
                </a>
                <a href="statistics.html" class="mobile-menu-item">
                    <i class="fas fa-chart-bar"></i>
                    <span data-lang="nav_statistics">통계</span>
                </a>
                <a href="photobook-creator.html" class="mobile-menu-item">
                    <i class="fas fa-book"></i>
                    <span data-lang="nav_photobook">포토북 만들기</span>
                </a>
                <a href="family-settings.html" class="mobile-menu-item">
                    <i class="fas fa-users"></i>
                    <span data-lang="nav_family_settings">가족 설정</span>
                </a>
                <a href="share.html" class="mobile-menu-item">
                    <i class="fas fa-share-alt"></i>
                    <span data-lang="nav_share">공유</span>
                </a>
                <a href="backup.html" class="mobile-menu-item">
                    <i class="fas fa-database"></i>
                    <span data-lang="nav_backup">백업</span>
                </a>
                
                <div class="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div class="text-sm text-gray-500 dark:text-gray-400 px-3 mb-2" data-lang="language">언어</div>
                    <div class="flex gap-2 px-3">
                        <button onclick="changeLanguage('ko')" class="lang-btn">🇰🇷 한국어</button>
                        <button onclick="changeLanguage('th')" class="lang-btn">🇹🇭 ไทย</button>
                        <button onclick="changeLanguage('en')" class="lang-btn">🇺🇸 English</button>
                    </div>
                </div>
                
                <button onclick="showLoginForm()" class="mobile-menu-item w-full">
                    <i class="fas fa-user"></i>
                    <span data-lang="auth_login">로그인</span>
                </button>
            </div>
        </div>
    </header>
    
    <!-- 모바일 메뉴 오버레이 -->
    <div id="menuOverlay" class="menu-overlay md:hidden"></div>`;

// HTML 파일 목록
const htmlFiles = [
    'add-memory.html',
    'growth.html',
    'statistics.html',
    'family-settings.html',
    'backup.html',
    'photobook-creator.html',
    'share.html',
    'join-family.html'
];

// 각 파일 업데이트
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 기존 헤더 찾기 (다양한 패턴 대응)
        const headerRegex = /<header[^>]*>[\s\S]*?<\/header>\s*(?:<!--\s*모바일 메뉴 오버레이\s*-->\s*<div[^>]*id="menuOverlay"[^>]*>[\s\S]*?<\/div>)?/gi;
        
        if (headerRegex.test(content)) {
            content = content.replace(headerRegex, newNavigation);
            console.log(`✅ Updated navigation in ${file}`);
        } else {
            console.log(`⚠️  No header found in ${file}`);
        }
        
        // navigation-responsive.js 스크립트 추가 (없으면)
        if (!content.includes('navigation-responsive.js')) {
            content = content.replace('</head>', '    <script src="js/navigation-responsive.js"></script>\n</head>');
            console.log(`✅ Added navigation-responsive.js to ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Navigation update complete!');