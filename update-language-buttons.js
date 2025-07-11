// 모든 HTML 파일의 언어 버튼 레이아웃 개선

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

// 새로운 언어 버튼 섹션
const newLanguageSection = `                <div class="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
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
                </div>`;

// 각 파일 업데이트
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 기존 언어 섹션 찾기
        const langSectionRegex = /<div class="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">[\s\S]*?<div class="flex gap-2 px-3">[\s\S]*?<button onclick="changeLanguage\('en'\)"[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/g;
        
        if (langSectionRegex.test(content)) {
            content = content.replace(langSectionRegex, newLanguageSection);
            console.log(`✅ Updated language buttons in ${file}`);
        } else {
            console.log(`⚠️  Language section not found in ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Language buttons update complete!');