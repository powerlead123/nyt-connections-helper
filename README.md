# NYT Connections 游戏辅助网站

## 项目介绍
这是一个专注于为 New York Times Connections 游戏提供辅助的网站。该网站每天会自动抓取当日的 NYT Connections 游戏题目，并提供 AI 辅助功能帮助用户解题。网站面向美国地区用户，通过 Google AdSense 进行变现。

## 核心功能
1. **每日自动抓取题目**：从 Mashable Games 栏目自动获取当日 NYT Connections 题目
2. **游戏复现**：将抓取的题目在网站上复现，供用户在线游玩
3. **AI 辅助提示**：用户游玩过程中，AI 会根据用户的每一步操作提供相应的提示和建议
4. **自动内容生成**：使用 AI 为每日题目自动生成相关文章，提升网站 SEO 表现

## 技术栈
- **纯前端技术**：HTML5, CSS3, 原生JavaScript（无框架）
- **托管平台**：Cloudflare Pages 或 GitHub Pages（纯静态部署）
- **数据抓取**：使用Cloudflare Workers或第三方服务
- **AI 集成**：通过第三方API（如OpenAI）

## 简化技术方案
为了降低复杂度，项目采用以下方案：
- 不使用任何npm包或后端服务器
- 使用纯静态HTML网页，可直接部署到任何静态服务器
- 数据抓取通过每日自动化任务生成JSON文件
- 可选使用Cloudflare Workers作为轻量级API层（无需Node.js）

## 页面结构
1. **首页 (index.html)**
   - 顶部导航栏（链接到历史题目和关于页面）
   - 今日游戏区域（上半部分）
   - AI 提示区域（下半部分）
   - 广告区域（侧边栏和页面底部）
   
2. **历史题目页面 (archive.html)**
   - 按日期组织的历史题目列表
   - 每个题目带有简短描述和难度等级
   
3. **关于页面 (about.html)**
   - 网站介绍
   - NYT Connections 游戏规则说明
   - 联系方式

## SEO 优化策略
- 针对关键词："NYT connections", "connections hints", "connections game help"
- 每日内容更新提高网站活跃度
- 语义化 HTML 结构，提升搜索引擎理解
- 移动端优化，确保良好的用户体验
- 页面加载速度优化

## 项目实施计划
1. 搭建基础网站框架和 UI 设计（纯HTML/CSS/JS）
2. 实现游戏核心功能
3. 集成第三方 AI API 实现辅助功能
4. 设置Cloudflare Workers或GitHub Actions实现自动抓取和内容生成
5. SEO 优化和广告位配置
6. 部署到静态网站托管服务（免费） 