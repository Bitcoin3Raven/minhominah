@echo off
echo 민호민아 성장앨범 로컬 서버 시작 (Python 3)...
echo.
echo 서버가 시작되면 브라우저에서 http://localhost:8000 으로 접속하세요
echo.
echo 종료하려면 Ctrl+C를 누르세요
echo.
cd /d "%~dp0"
py -3 -m http.server 8000