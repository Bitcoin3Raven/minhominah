// 모든 HTML 파일의 구조를 올바르게 수정

const fs = require('fs');
const path = require('path');

// HTML 파일 목록
const htmlFiles = [
    'index.html',
    'add-memory.html',
    'growth.html',
    'statistics.html',
    'family-settings.html',
    'backup.html',
    'photobook-creator.html',
    'share.html',
    'join-family.html'
];

// 올바른 구조의 헤더와 모바일 메뉴
const correctStructure = `    </header>
    
    <!-- 모바일 메뉴 -->
    <div id="mobileMenu" class="mobile-menu md:hidden">
        <div class="px-4 py-6 space-y-2">
            <a href="index.html" class="mobile-menu-item ACTIVE_CLASS">
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
                <div class="grid grid-cols-3 gap-2 px-3">
                    <button onclick="changeLanguage('ko')" class="lang-btn">
                        <span class="block text-lg">🇰🇷</span>
                        <span class="block text-xs mt-1">한국어</span>
                    </button>
                    <button onclick="changeLanguage('th')" class="lang-btn">
                        <span class="block text-lg">🇹🇭</span>
                        <span class="block text-xs mt-1">ไทย</span>
                    </button>
                    <button onclick="changeLanguage('en')" class="lang-btn">
                        <span class="block text-lg">🇺🇸</span>
                        <span class="block text-xs mt-1">English</span>
                    </button>
                </div>
            </div>
            
            <button onclick="showLoginForm()" class="mobile-menu-item w-full">
                <i class="fas fa-user"></i>
                <span data-lang="auth_login">로그인</span>
            </button>
        </div>
    </div>
    
    <!-- 모바일 메뉴 오버레이 -->
    <div id="menuOverlay" class="menu-overlay md:hidden"></div>`;

// 각 파일 업데이트
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 헤더 닫는 태그부터 다음 섹션까지의 내용을 찾아서 교체
        const pattern = /<\/header>[\s\S]*?(?=<!-- 개선된 히어로 섹션|<!-- 히어로 섹션|<!-- Hero Section|<!-- 메인|<main|<section)/;
        
        if (pattern.test(content)) {
            // 현재 페이지에 맞는 active 클래스 설정
            let activeClass = '';
            if (file === 'index.html') activeClass = 'active';
            
            const newStructure = correctStructure.replace('ACTIVE_CLASS', activeClass);
            content = content.replace(pattern, newStructure + '\n    ');
            
            console.log(`✅ Fixed structure in ${file}`);
        } else {
            console.log(`⚠️  Pattern not found in ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ HTML structure fix complete!');