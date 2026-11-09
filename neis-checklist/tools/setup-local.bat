@echo off
chcp 65001 > nul
setlocal
rem 1학기말 나이스 가이드를 내 컴퓨터로 받아 오기 (더블클릭)
set "DEST=%USERPROFILE%\Documents\neis-guide"
set "BRANCH=claude/festive-cerf-r2trmb"

where git > nul 2> nul
if errorlevel 1 (
  echo Git이 설치되어 있지 않아요. https://git-scm.com/download/win 에서 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if exist "%DEST%\.git" (
  echo 이미 받아 둔 폴더가 있어요. 최신으로 맞출게요.
  git -C "%DEST%" pull
) else (
  echo 저장소를 받는 중이에요...
  git clone -b %BRANCH% https://github.com/a51477859/starlight.git "%DEST%"
)

set "ZIP=%USERPROFILE%\Downloads\neis-refs.zip"
if exist "%ZIP%" (
  echo 원본 자료 neis-refs.zip을 푸는 중이에요...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force -LiteralPath '%ZIP%' -DestinationPath '%DEST%\neis-checklist'"
) else (
  echo 다운로드 폴더에 neis-refs.zip이 없어요. 받아 두고 다시 실행하면 자동으로 풀어 드려요.
)

start "" "%DEST%\neis-checklist"
start "" "%DEST%\neis-checklist\follow.html"
echo.
echo 끝났어요. 위 폴더에서 Claude Code를 열고 이렇게 보내세요:
echo   CLAUDE.md 읽고 다음 할 일 이어서 해 줘
pause
