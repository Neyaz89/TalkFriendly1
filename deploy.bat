@echo off
echo ========================================
echo   TalkFriendly - Vercel Deployment
echo ========================================
echo.

echo [1/4] Checking for changes...
git status
echo.

echo [2/4] Adding all files...
git add .
echo.

echo [3/4] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update TalkFriendly

git commit -m "%commit_msg%"
echo.

echo [4/4] Pushing to GitHub...
git push
echo.

echo ========================================
echo   Deployment initiated!
echo   Check Vercel dashboard for status
echo ========================================
echo.
echo Your site will update in ~2 minutes
echo.
pause
