const fs = require('fs');
const path = require('path');

// HTML 파일 목록
const htmlFiles = [
  'index.html',
  'add-memory.html',
  'share.html',
  'statistics.html',
  'photobook-creator.html',
  'growth.html',
  'family-settings.html',
  'backup.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Kakao SDK 스크립트 뒤에 kakao-config.js 추가
    const kakaoSDKPattern = /(<script src="https:\/\/t1\.kakaocdn\.net\/kakao_js_sdk[^>]*><\/script>)/g;
    
    if (kakaoSDKPattern.test(content) && !content.includes('kakao-config.js')) {
      content = content.replace(kakaoSDKPattern, '$1\n    <script src="js/kakao-config.js"></script>');
      
      // 기존의 Kakao.init 코드 제거
      const oldInitPattern = /<script>\s*\/\/\s*Kakao SDK[^<]*Kakao\.init[^<]*<\/script>/g;
      content = content.replace(oldInitPattern, '');
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Updated ${file}`);
    } else if (content.includes('kakao-config.js')) {
      console.log(`- ${file} already has kakao-config.js`);
    } else {
      console.log(`- ${file} doesn't have Kakao SDK`);
    }
  }
});

console.log('\nDone! Kakao SDK is now properly configured.');