@echo off
echo ========================================
echo   Fixing Git Repository
echo   Removing .next folder from tracking
echo ========================================
echo.

echo [1/5] Removing .next from Git cache...
git rm -r --cached .next
echo.

echo [2/5] Adding updated .gitignore...
git add .gitignore
echo.

echo [3/5] Committing changes...
git commit -m "Fix: Remove .next folder from Git tracking"
echo.

echo [4/5] Pushing to GitHub...
git push
echo.

echo [5/5] Done!
echo.
echo ========================================
echo   Git repository fixed!
echo   Vercel will now build correctly
echo ========================================
echo.
echo Next steps:
echo 1. Go to Vercel dashboard
echo 2. Click "Redeploy" on your project
echo 3. It should build successfully now
echo.
pause
