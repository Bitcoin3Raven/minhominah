// 모든 HTML 파일에 navigation.css 추가하는 스크립트

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
        
        // navigation.css가 이미 있는지 확인
        if (!content.includes('navigation.css')) {
            // </head> 태그 앞에 navigation.css 추가
            const cssLink = '    <link rel="stylesheet" href="css/navigation.css">\n';
            
            // style.css 다음에 추가하거나, </head> 앞에 추가
            if (content.includes('css/style.css">')) {
                content = content.replace(
                    /<link rel="stylesheet" href="css\/style\.css">/,
                    '<link rel="stylesheet" href="css/style.css">\n' + cssLink
                );
            } else {
                content = content.replace('</head>', cssLink + '</head>');
            }
            
            console.log(`✅ Added navigation.css to ${file}`);
        } else {
            console.log(`⚠️  navigation.css already exists in ${file}`);
        }
        
        // 파일 저장
        fs.writeFileSync(filePath, content);
        
    } catch (error) {
        console.error(`❌ Error updating ${file}:`, error.message);
    }
});

console.log('\n✅ Navigation CSS update complete!');