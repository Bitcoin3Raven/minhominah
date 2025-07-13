# index.html 파일 읽기
$content = Get-Content -Path "index.html" -Raw -Encoding UTF8

# 두 번째 getMediaUrl 함수를 찾아서 주석 처리
$pattern = '(?ms)(// 미디어 URL 가져오기\s*\r?\n\s*function getMediaUrl\(mediaFile\) \{[^}]+\})'
$replacement = @'
        // 미디어 URL 가져오기 - 중복 함수 제거 (위의 1411번 줄에 이미 정의됨)
        /* 중복된 getMediaUrl 함수 제거됨 */
'@

# 치환 수행
$newContent = $content -replace $pattern, $replacement

# 파일에 다시 쓰기
$newContent | Out-File -FilePath "index.html" -Encoding UTF8

Write-Host "중복된 getMediaUrl 함수가 제거되었습니다."