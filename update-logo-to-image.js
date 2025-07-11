// 모든 HTML 파일의 로고를 이미지로 변경

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

// 기존 로고 HTML
const oldLogoPattern = /<div class="flex items-center">\s*<a href="index\.html"[^>]*>[\s\S]*?<\/a>\s*<\/div>/g;

// 새로운 로고 HTML
const newLogoHTML = `<div class="flex items-center">
                    <a href="index.html" class="flex items-center hover:opacity-80 transition-opacity">
                        <img src="assets/images/logo.png" alt="민호민아 성장앨범" class="h-10 w-auto dark:brightness-90" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="text-lg font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent" style="display:none;" data-lang="site_title">민호민아</span>
                    </a>
                </div>`;

// 각 파일 업데이트
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 로고 부분 찾아서 교체
        if (oldLogoPattern.test(content)) {
            content = content.replace(oldLogoPattern, newLogoHTML);
            console.log(`✅ Updated logo in ${file}`);
        } else {
            console.log(`⚠️  Logo pattern not found in ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Logo update complete!');