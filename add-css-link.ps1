# index.html 파일 읽기
$content = Get-Content -Path "index.html" -Raw -Encoding UTF8

# style-improved.css 다음에 image-fix.css 추가
$content = $content -replace '(<link rel="stylesheet" href="css/style-improved.css">)', '$1
    <link rel="stylesheet" href="css/image-fix.css">'

# 파일에 다시 쓰기
$content | Out-File -FilePath "index.html" -Encoding UTF8

Write-Host "image-fix.css 링크가 추가되었습니다."