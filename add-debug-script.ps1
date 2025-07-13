# index.html 파일 읽기
$content = Get-Content -Path "index.html" -Raw -Encoding UTF8

# </body> 태그 바로 앞에 스크립트 추가
$content = $content -replace '(</body>)', '    <script src="js/image-debug.js"></script>
$1'

# 파일에 다시 쓰기
$content | Out-File -FilePath "index.html" -Encoding UTF8

Write-Host "image-debug.js 스크립트가 추가되었습니다."