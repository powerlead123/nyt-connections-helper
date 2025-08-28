# 🚀 Cloudflare Pages 部署指南

## 准备工作

### 1. 注册Cloudflare账户
- 访问 [cloudflare.com](https://cloudflare.com)
- 注册免费账户

### 2. 安装Wrangler CLI
```bash
npm install -g wrangler
```

### 3. 登录Cloudflare
```bash
wrangler login
```

## 部署步骤

### 方法一：通过GitHub自动部署（推荐）

1. **创建GitHub仓库**
   - 在GitHub上创建新仓库
   - 将代码推送到仓库

2. **连接Cloudflare Pages**
   - 登录Cloudflare Dashboard
   - 进入 Pages 部分
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 选择你的GitHub仓库

3. **配置构建设置**
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: /
   Root directory: /
   ```

4. **环境变量设置**
   - 在Pages项目设置中添加环境变量
   - 可选：设置KV存储用于缓存

### 方法二：直接部署

1. **使用Wrangler部署**
   ```bash
   wrangler pages deploy . --project-name nyt-connections-helper
   ```

2. **设置自定义域名（可选）**
   - 在Cloudflare Pages设置中添加自定义域名

## 配置KV存储（可选，用于缓存）

1. **创建KV命名空间**
   ```bash
   wrangler kv:namespace create "CONNECTIONS_KV"
   ```

2. **在wrangler.toml中配置**
   ```toml
   [[kv_namespaces]]
   binding = "CONNECTIONS_KV"
   id = "your-kv-namespace-id"
   ```

## 文件结构说明

```
├── functions/          # Cloudflare Pages Functions
│   └── api/
│       ├── today.js    # 获取今日谜题API
│       └── refresh.js  # 刷新数据API
├── articles/           # 文章目录
├── _headers           # HTTP头配置
├── _redirects         # 重定向配置
├── wrangler.toml      # Cloudflare配置
├── index.html         # 主页
├── script.js          # 前端JavaScript
└── package.json       # 项目配置
```

## 部署后访问

- 你的网站将在 `https://nyt-connections-helper.pages.dev` 可用
- 如果设置了自定义域名，也可以通过自定义域名访问

## 功能特性

✅ **全球CDN** - Cloudflare的全球网络加速
✅ **自动HTTPS** - 免费SSL证书
✅ **无服务器** - 按需执行，无需维护服务器
✅ **免费额度** - 每月100,000次请求免费
✅ **自动部署** - Git推送自动触发部署

## 注意事项

1. **API限制** - Cloudflare Pages Functions有执行时间限制
2. **存储** - 使用KV存储来缓存数据
3. **域名** - 可以使用免费的.pages.dev域名或自定义域名
4. **监控** - 在Cloudflare Dashboard中监控网站性能

## 故障排除

### 常见问题

1. **Functions不工作**
   - 检查functions目录结构
   - 确保导出正确的函数

2. **API调用失败**
   - 检查CORS设置
   - 验证API路径

3. **缓存问题**
   - 清除Cloudflare缓存
   - 检查KV存储配置

## 更新部署

- **GitHub方式**: 推送代码到main分支自动部署
- **直接方式**: 运行 `npm run deploy`

## 成本

- **免费额度**: 每月100,000次请求
- **超出后**: $0.50 per million requests
- **KV存储**: 前10GB免费

部署完成后，你的NYT Connections Helper将在全球范围内可用！🌍