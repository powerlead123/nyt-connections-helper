@echo off
echo Pushing to GitHub repository...
git remote -v
echo.
echo Attempting to push to GitHub...
git push -u origin master
echo.
if %errorlevel% equ 0 (
    echo Success! Code pushed to GitHub.
    echo You can now set up Cloudflare Pages deployment.
) else (
    echo Failed to push. Please check your network connection.
    echo You may need to use a VPN or proxy to access GitHub.
)
pause