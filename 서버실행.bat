@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   민호민아 성장앨범 로컬 서버
echo ========================================
echo.
echo 서버 시작 중...
echo.
cd /d "%~dp0"

:: Python 3 시도
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python으로 서버를 시작합니다...
    echo.
    echo 브라우저에서 다음 주소로 접속하세요:
    echo.
    echo   http://localhost:8000
    echo.
    echo 종료하려면 Ctrl+C를 누르세요
    echo.
    python -m http.server 8000
) else (
    :: Python이 없으면 py 명령 시도
    py --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Python으로 서버를 시작합니다...
        echo.
        echo 브라우저에서 다음 주소로 접속하세요:
        echo.
        echo   http://localhost:8000
        echo.
        echo 종료하려면 Ctrl+C를 누르세요
        echo.
        py -m http.server 8000
    ) else (
        echo Python이 설치되어 있지 않습니다.
        echo https://www.python.org/downloads/ 에서 Python을 설치해주세요.
        echo.
        pause
    )
)