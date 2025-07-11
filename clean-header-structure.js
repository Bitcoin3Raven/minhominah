// 헤더 내부의 잘못된 구조 정리

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
        
        // 헤더 내부의 잘못된 로그인 버튼과 오버레이 제거
        // 헤더 안에 있는 모바일 메뉴 관련 요소 제거
        const headerPattern = /(<\/div>\s*<\/div>\s*)\s*(<button onclick="showLoginForm\(\)"[^>]*>[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<!-- 모바일 메뉴 오버레이 -->[\s\S]*?<div id="menuOverlay"[^>]*><\/div>\s*)?(<\/header>)/g;
        
        if (headerPattern.test(content)) {
            content = content.replace(headerPattern, '$1\n    $3');
            console.log(`✅ Cleaned header structure in ${file}`);
        }
        
        // 중복된 오버레이 제거 (헤더 밖에 있는 것만 남기기)
        const duplicateOverlayPattern = /<!-- 모바일 메뉴 오버레이 -->[\s\S]*?<div id="menuOverlay"[^>]*><\/div>/g;
        const overlayCount = (content.match(duplicateOverlayPattern) || []).length;
        
        if (overlayCount > 1) {
            // 첫 번째 것은 남기고 나머지는 제거
            let count = 0;
            content = content.replace(duplicateOverlayPattern, (match) => {
                count++;
                return count > 1 ? '' : match;
            });
            console.log(`✅ Removed ${overlayCount - 1} duplicate overlay(s) in ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Header structure cleanup complete!');