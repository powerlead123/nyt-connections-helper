#!/bin/bash

# 手动更新今日谜题的脚本

echo "🔄 开始手动抓取今日谜题..."

# 替换为你的实际网站URL
WEBSITE_URL="https://your-website.com"

echo "📡 调用refresh API..."

# 方法1: 使用refresh API（推荐）
curl -X POST "${WEBSITE_URL}/api/refresh" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s

echo ""
echo "✅ 刷新请求已发送"
echo "💡 请稍等片刻，然后刷新网站查看最新谜题"

# 可选：同时调用scheduled端点（需要密钥）
# echo "📡 调用scheduled端点..."
# curl -X POST "${WEBSITE_URL}/scheduled" \
#   -H "Content-Type: application/json" \
#   -d '{"action":"daily-update","secret":"your-secret-key"}' \
#   -w "\n状态码: %{http_code}\n" \
#   -s