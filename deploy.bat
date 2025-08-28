@echo off
echo 🚀 部署NYT Connections Helper到Cloudflare Pages...
echo.

echo 📋 检查必要文件...
if not exist "index.html" (
    echo ❌ 缺少index.html文件
    pause
    exit /b 1
)

if not exist "functions" (
    echo ❌ 缺少functions目录
    pause
    exit /b 1
)

echo ✅ 文件检查完成

echo.
echo 🔧 安装Wrangler CLI (如果需要)...
npm list -g wrangler >nul 2>&1
if errorlevel 1 (
    echo 正在安装Wrangler...
    npm install -g wrangler
) else (
    echo ✅ Wrangler已安装
)

echo.
echo 🔑 请确保已登录Cloudflare...
echo 如果未登录，请运行: wrangler login
echo.

pause

echo 🚀 开始部署...
wrangler pages deploy . --project-name nyt-connections-helper

echo.
echo ✅ 部署完成！
echo 🌐 你的网站将在几分钟内在以下地址可用:
echo https://nyt-connections-helper.pages.dev
echo.

pause