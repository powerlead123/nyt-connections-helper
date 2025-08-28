# Connections 智能助手

一个帮助用户解决 NYTimes Connections 谜题的智能网站，提供互动式提示系统和每日真实数据。

## 功能特色

- 🎯 **智能提示系统** - 主题提示、难度提示、单词提示
- 💬 **互动对话** - 模拟真实助手的对话体验
- 📊 **真实数据** - 每日自动获取最新的 Connections 谜题
- 🔄 **数据缓存** - 避免重复请求，提高加载速度
- 📱 **响应式设计** - 支持手机和桌面端

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问网站
打开浏览器访问 `http://localhost:3000`

## 开发模式

使用 nodemon 进行开发（文件变化时自动重启）：
```bash
npm run dev
```

## 数据获取策略

1. **主要方案**: 从 NYTimes 官网抓取最新数据
2. **备用方案**: 当主要方案失败时，使用预设的示例数据
3. **缓存机制**: 每日数据缓存，避免频繁请求

## API 接口

- `GET /api/today` - 获取今日谜题数据
- `POST /api/refresh` - 手动刷新数据

## 文件结构

```
├── index.html          # 前端页面
├── script.js           # 前端逻辑
├── server.js           # 后端服务器
├── package.json        # 项目配置
├── connections_cache.json  # 数据缓存文件（自动生成）
└── README.md           # 说明文档
```

## 技术栈

- **前端**: HTML5, CSS3 (Tailwind), JavaScript
- **后端**: Node.js, Express
- **数据获取**: Axios, Cheerio
- **缓存**: JSON 文件存储

## 部署建议

### Vercel 部署
1. 将代码推送到 GitHub
2. 连接 Vercel 账户
3. 配置构建命令: `npm install`
4. 配置启动命令: `npm start`

### Heroku 部署
1. 创建 Heroku 应用
2. 设置 Node.js buildpack
3. 推送代码到 Heroku

## 注意事项

- 数据抓取可能受到网站反爬虫机制影响
- 建议设置合理的请求间隔，避免被封IP
- 如果数据获取失败，会自动使用备用数据

## 后续优化

- [ ] 添加用户统计功能
- [ ] 支持历史谜题查询
- [ ] 添加社交分享功能
- [ ] 优化移动端体验
- [ ] 添加多语言支持