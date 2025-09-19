import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const BASE_URL = process.env.CLOUDFLARE_API_URL || 'https://nyt-connections-helper.pages.dev';
const DAYS_TO_GENERATE = 30; // 生成最近30天的文章

async function generateStaticArticles() {
  console.log('🚀 开始生成静态文章文件...');
  console.log(`📡 API地址: ${BASE_URL}`);
  
  // 1. 获取文章数据
  const articles = await fetchArticleData();
  console.log(`📚 成功获取 ${articles.length} 篇文章`);
  
  // 2. 创建articles目录
  const articlesDir = path.join(__dirname, 'articles');
  ensureDirectoryExists(articlesDir);
  
  // 3. 生成单篇文章静态文件
  await generateArticleFiles(articles, articlesDir);
  
  // 4. 生成文章列表页面
  await generateArticleIndex(articles, articlesDir);
  
  // 5. 生成sitemap.xml
  await generateSitemap(articles);
  
  console.log('🎉 静态文章生成完成!');
}

async function fetchArticleData() {
  const articles = [];
  const today = new Date();
  
  console.log('📥 开始获取文章数据...');
  
  for (let i = 0; i < DAYS_TO_GENERATE; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      console.log(`  🔍 尝试获取: ${dateStr}`);
      const response = await fetch(`${BASE_URL}/api/article/${dateStr}`, {
        timeout: 10000 // 10秒超时
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // 验证HTML内容
        if (html && html.includes('<html') && html.length > 1000) {
          articles.push({ 
            date: dateStr, 
            html: html,
            size: html.length
          });
          console.log(`  ✅ 成功: ${dateStr} (${Math.round(html.length/1024)}KB)`);
        } else {
          console.log(`  ⚠️ 内容无效: ${dateStr}`);
        }
      } else {
        console.log(`  ❌ HTTP ${response.status}: ${dateStr}`);
      }
    } catch (error) {
      console.log(`  ❌ 错误: ${dateStr} - ${error.message}`);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return articles;
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录: ${dir}`);
  }
}

async function generateArticleFiles(articles, articlesDir) {
  console.log('📄 生成单篇文章文件...');
  
  for (const article of articles) {
    const filePath = path.join(articlesDir, `${article.date}.html`);
    
    // 优化HTML内容
    const optimizedHtml = optimizeArticleHtml(article.html, article.date);
    
    fs.writeFileSync(filePath, optimizedHtml, 'utf8');
    console.log(`  ✅ 生成: ${article.date}.html (${Math.round(optimizedHtml.length/1024)}KB)`);
  }
}

function optimizeArticleHtml(html, date) {
  // 添加canonical URL和其他SEO优化
  const canonicalUrl = `https://nyt-connections-helper.pages.dev/articles/${date}.html`;
  
  // 在head标签中添加canonical链接
  const optimizedHtml = html.replace(
    '</head>',
    `  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="robots" content="index, follow">
</head>`
  );
  
  return optimizedHtml;
}

async function generateArticleIndex(articles, articlesDir) {
  console.log('📋 生成文章列表页面...');
  
  const indexHtml = createArticleIndexHtml(articles);
  const indexPath = path.join(articlesDir, 'index.html');
  
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log(`  ✅ 生成: index.html (${Math.round(indexHtml.length/1024)}KB)`);
}

function createArticleIndexHtml(articles) {
  // 按日期排序（最新的在前）
  const sortedArticles = articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const articleLinks = sortedArticles.map(article => {
    const date = new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const shortDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    return `
    <div class="article-item">
      <div class="article-date">${shortDate}</div>
      <div class="article-content">
        <h3><a href="${article.date}.html">NYT Connections ${formattedDate}</a></h3>
        <p>Complete solutions, hints, and strategies for today's puzzle. All four categories with detailed explanations.</p>
        <div class="article-meta">
          <span class="badge">Solutions</span>
          <span class="badge">Hints</span>
          <span class="badge">Strategies</span>
        </div>
      </div>
    </div>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections Solutions Archive - Complete Puzzle Answers & Hints</title>
    <meta name="description" content="Complete archive of NYT Connections puzzle solutions with detailed hints, strategies, and explanations for all categories. Updated daily with the latest puzzles.">
    <meta name="keywords" content="NYT Connections, New York Times Connections, puzzle solutions, word game answers, daily puzzle, hints, strategies">
    <link rel="canonical" href="https://nyt-connections-helper.pages.dev/articles/">
    <meta property="og:title" content="NYT Connections Solutions Archive">
    <meta property="og:description" content="Complete archive of NYT Connections puzzle solutions with hints and strategies.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://nyt-connections-helper.pages.dev/articles/">
    <meta name="robots" content="index, follow">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .article-item {
            display: flex;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .article-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .article-date {
            flex-shrink: 0;
            width: 80px;
            text-align: center;
            padding: 10px;
            background: #f1f3f4;
            border-radius: 8px;
            margin-right: 20px;
            font-weight: 600;
            color: #5f6368;
            font-size: 0.9em;
        }
        .article-content {
            flex: 1;
        }
        .article-content h3 {
            margin: 0 0 8px 0;
            font-size: 1.3em;
        }
        .article-content a {
            text-decoration: none;
            color: #1a73e8;
            font-weight: 600;
        }
        .article-content a:hover {
            text-decoration: underline;
        }
        .article-content p {
            color: #5f6368;
            margin-bottom: 12px;
            font-size: 0.95em;
        }
        .article-meta {
            display: flex;
            gap: 8px;
        }
        .badge {
            background: #e8f0fe;
            color: #1a73e8;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 500;
        }
        .nav-links {
            text-align: center;
            margin: 40px 0;
        }
        .nav-links a {
            display: inline-block;
            margin: 0 10px;
            padding: 12px 24px;
            background: #1a73e8;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.2s;
        }
        .nav-links a:hover {
            background: #1557b0;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            padding: 30px;
            color: #5f6368;
            font-size: 0.9em;
        }
        @media (max-width: 600px) {
            .article-item {
                flex-direction: column;
            }
            .article-date {
                width: auto;
                margin-right: 0;
                margin-bottom: 15px;
                text-align: left;
            }
            .header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧩 NYT Connections Solutions</h1>
            <p>Complete archive of puzzle solutions, hints, and strategies</p>
        </div>
        
        <div class="nav-links">
            <a href="../">🏠 Play Latest Puzzle</a>
            <a href="#latest">📚 Latest Solutions</a>
        </div>
        
        <div id="latest">
            <h2 style="margin-bottom: 30px; color: #333; font-size: 1.8em;">📋 All Solutions</h2>
            ${articleLinks}
        </div>
        
        <div class="footer">
            <p>This archive contains complete solutions for NYT Connections puzzles.</p>
            <p>Visit <a href="https://www.nytimes.com/games/connections" target="_blank" style="color: #1a73e8;">NYT Games</a> to play the official puzzle.</p>
        </div>
    </div>
</body>
</html>`;
}

async function generateSitemap(articles) {
  console.log('🗺️ 生成站点地图...');
  
  const sitemapContent = createSitemapXml(articles);
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log(`  ✅ 生成: sitemap.xml (${Math.round(sitemapContent.length/1024)}KB)`);
}

function createSitemapXml(articles) {
  const today = new Date().toISOString().split('T')[0];
  
  const articleUrls = articles.map(article => 
    `  <url>
    <loc>https://nyt-connections-helper.pages.dev/articles/${article.date}.html</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nyt-connections-helper.pages.dev/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nyt-connections-helper.pages.dev/articles/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${articleUrls}
</urlset>`;
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStaticArticles().catch(error => {
    console.error('❌ 生成静态文章失败:', error);
    process.exit(1);
  });
}

export { generateStaticArticles };