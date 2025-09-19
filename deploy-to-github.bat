@echo off
echo 🚀 开始部署到GitHub...
echo.

echo 📁 添加所有文件...
git add .
if %errorlevel% neq 0 (
    echo ❌ git add 失败
    pause
    exit /b 1
)

echo ✅ 文件添加成功

echo 💾 提交更改...
git commit -m "📚 Add static article access system and documentation

✅ New features:
- Static article access guide and testing
- Complete documentation for article system
- User access instructions and status reports
- Article generation optimization complete

📊 System status:
- 5 clean articles ready for access
- Multiple access methods configured
- SEO optimized static pages
- GitHub Actions workflow ready

🎯 Ready for deployment to Cloudflare Pages"

if %errorlevel% neq 0 (
    echo ❌ git commit 失败
    pause
    exit /b 1
)

echo ✅ 提交成功

echo 🌐 推送到GitHub...
git push origin master
if %errorlevel% neq 0 (
    echo ❌ git push 失败
    pause
    exit /b 1
)

echo ✅ 推送成功！

echo.
echo 🎉 部署完成！
echo 📊 下一步: 等待Cloudflare Pages自动部署
echo 🌐 部署完成后访问: https://nyt-connections-helper.pages.dev
echo.
pause