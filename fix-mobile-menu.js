// 모든 HTML 파일의 모바일 메뉴 구조 수정

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

// 각 파일 업데이트
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 잘못된 헤더 구조 수정
        // 모바일 메뉴를 헤더 밖으로 이동
        content = content.replace(
            /(<\/div>\s*<\/div>\s*)(<\/header>)\s*(<!-- 모바일 메뉴 오버레이 -->[\s\S]*?<div id="menuOverlay"[^>]*><\/div>)/g,
            '$1$3\n    $2'
        );
        
        // 모바일 메뉴가 헤더 안에 있는 경우 수정
        if (content.includes('</div>\n    </header>') && content.includes('<!-- 모바일 메뉴 오버레이 -->')) {
            // 헤더 닫기 태그 위치 찾기
            const headerCloseIndex = content.indexOf('</header>');
            const mobileMenuIndex = content.lastIndexOf('<!-- 모바일 메뉴 -->', headerCloseIndex);
            
            if (mobileMenuIndex > -1 && mobileMenuIndex < headerCloseIndex) {
                // 모바일 메뉴 섹션 추출
                const mobileMenuMatch = content.match(/(<!-- 모바일 메뉴 -->[\s\S]*?<\/div>\s*<\/div>)/);
                if (mobileMenuMatch) {
                    const mobileMenuContent = mobileMenuMatch[1];
                    
                    // 모바일 메뉴 제거
                    content = content.replace(mobileMenuContent, '');
                    
                    // 헤더 닫기 직후에 모바일 메뉴 추가
                    content = content.replace('</header>', '</header>\n    \n    ' + mobileMenuContent);
                }
            }
        }
        
        console.log(`✅ Fixed mobile menu structure in ${file}`);
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Mobile menu fix complete!');