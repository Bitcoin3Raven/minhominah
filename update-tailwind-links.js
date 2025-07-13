const fs = require('fs');
const path = require('path');

// HTML 파일 찾기
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
    
    // Tailwind CDN 스크립트 찾기 및 교체
    const tailwindCDNPattern = /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>[\s\S]*?tailwind\.config[\s\S]*?<\/script>/g;
    
    if (tailwindCDNPattern.test(content)) {
      // Tailwind CDN을 로컬 CSS 파일로 교체
      content = content.replace(tailwindCDNPattern, '<link rel="stylesheet" href="css/tailwind.css">');
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Updated ${file}`);
    } else {
      console.log(`- ${file} doesn't have Tailwind CDN`);
    }
  }
});

console.log('\nDone! Now run "npm run build-css" to generate the CSS file.');