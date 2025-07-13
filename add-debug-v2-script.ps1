# index.html 파일 읽기
$content = Get-Content -Path "index.html" -Raw -Encoding UTF8

# image-debug.js 다음에 image-debug-v2.js 추가
$content = $content -replace '(<script src="js/image-debug.js"></script>)', '$1
    <script src="js/image-debug-v2.js"></script>'

# 파일에 다시 쓰기
$content | Out-File -FilePath "index.html" -Encoding UTF8

Write-Host "image-debug-v2.js 스크립트가 추가되었습니다."