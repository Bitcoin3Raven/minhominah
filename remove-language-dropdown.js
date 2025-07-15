// 모든 HTML 파일에서 언어 드롭다운 제거하는 스크립트

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
        
        // 언어 드롭다운 섹션 제거 (데스크톱 네비게이션)
        const langDropdownRegex = /<!-- 언어 선택 -->[\s\S]*?<\/div>\s*(?=<!-- 로그인 버튼 -->|<button id="authButton")/g;
        
        if (langDropdownRegex.test(content)) {
            content = content.replace(langDropdownRegex, '');
            console.log(`✅ Removed language dropdown from desktop nav in ${file}`);
        }
        
        // 더 구체적인 패턴으로 시도
        const specificLangRegex = /<div class="relative" data-dropdown-trigger="langDropdown">[\s\S]*?<\/div>\s*<\/div>/g;
        
        if (specificLangRegex.test(content)) {
            content = content.replace(specificLangRegex, '');
            console.log(`✅ Removed language dropdown (specific pattern) from ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Language dropdown removal complete!');