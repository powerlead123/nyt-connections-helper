import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 - 优化为只扫描最近5天
const BASE_URL = process.env.CLOUDFLARE_API_URL || 'https://nyt-connections-helper.pages.dev';
const DAYS_TO_SCAN = 5; // 只扫描最近5天，大幅减少API请求
const FORCE_REGENERATE = process.env.FORCE_REGENERATE === 'true';

async function generateStaticArticlesFinal() {
  console.log('🚀 开始高效生成静态文章文件...');
  console.log(`📡 API地址: ${BASE_URL}`);
  console.log(`📅 扫描范围: 最近${DAYS_TO_SCAN}天`);
  console.log(`🔄 强制重新生成: ${FORCE_REGENERATE ? '是' : '否'}`);
  
  // 1. 检查现有文件
  const articlesDir = path.join(__dirname, 'articles');
  ensureDirectoryExists(articlesDir);
  const existingFiles = getExistingArticles(articlesDir);
  console.log(`📁 现有文章: ${existingFiles.size} 篇`);
  
  // 2. 获取需要处理的文章数据（只扫描最近5天）
  const articles = await fetchRecentArticles(existingFiles);
  console.log(`📚 需要处理: ${articles.length} 篇文章`);
  
  if (articles.length === 0 && !FORCE_REGENERATE) {
    console.log('✅ 没有新文章需要生成');
    // 仍然更新索引页面，确保文章列表是最新的
    await updateIndexAndSitemap(articlesDir);
    console.log('🎉 快速更新完成!');
    return;
  }
  
  // 3. 生成新的文章文件
  if (articles.length > 0) {
    await generateArticleFiles(articles, articlesDir);
  }
  
  // 4. 更新文章列表页面和sitemap
  await updateIndexAndSitemap(articlesDir);
  
  // 5. 更新主页的文章链接
  await updateHomepageLinks(articlesDir);
  
  console.log('🎉 高效静态文章生成完成!');
  
  // 5. 显示统计信息
  showStatistics(articles, existingFiles);
}

function getExistingArticles(articlesDir) {
  const existingFiles = new Set();
  
  if (!fs.existsSync(articlesDir)) {
    return existingFiles;
  }
  
  const files = fs.readdirSync(articlesDir);
  files.forEach(file => {
    if (file.match(/^\d{4}-\d{2}-\d{2}\.html$/)) {
      const date = file.replace('.html', '');
      existingFiles.add(date);
    }
  });
  
  console.log(`  📊 已存在文章: ${existingFiles.size} 篇`);
  return existingFiles;
}

async function fetchRecentArticles(existingFiles) {
  const articles = [];
  const today = new Date();
  
  console.log(`📥 智能获取最近${DAYS_TO_SCAN}天的文章数据...`);
  
  for (let i = 0; i < DAYS_TO_SCAN; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 检查是否需要处理这个日期
    const shouldProcess = FORCE_REGENERATE || !existingFiles.has(dateStr);
    
    if (!shouldProcess) {
      console.log(`  ⏭️ 跳过: ${dateStr} (已存在)`);
      continue;
    }
    
    try {
      console.log(`  🔍 获取: ${dateStr}`);
      const response = await fetch(`${BASE_URL}/api/article/${dateStr}`, {
        timeout: 10000
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // 验证HTML内容
        if (html && html.includes('<html') && html.length > 1000) {
          articles.push({ 
            date: dateStr, 
            html: html,
            size: html.length,
            isNew: !existingFiles.has(dateStr)
          });
          console.log(`  ✅ ${existingFiles.has(dateStr) ? '更新' : '新增'}: ${dateStr} (${Math.round(html.length/1024)}KB)`);
        } else {
          console.log(`  ⚠️ 内容无效: ${dateStr}`);
        }
      } else {
        console.log(`  ❌ HTTP ${response.status}: ${dateStr}`);
      }
    } catch (error) {
      console.log(`  ❌ 错误: ${dateStr} - ${error.message}`);
    }
    
    // 减少请求间隔，因为只有5个请求
    await new Promise(resolve => setTimeout(resolve, 300));
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
  console.log('📄 生成文章文件...');
  
  for (const article of articles) {
    const filePath = path.join(articlesDir, `${article.date}.html`);
    
    // 优化HTML内容
    const optimizedHtml = optimizeArticleHtml(article.html, article.date);
    
    fs.writeFileSync(filePath, optimizedHtml, 'utf8');
    const status = article.isNew ? '新增' : '更新';
    console.log(`  ✅ ${status}: ${article.date}.html (${Math.round(optimizedHtml.length/1024)}KB)`);
  }
}

function optimizeArticleHtml(html, date) {
  const canonicalUrl = `https://nyt-connections-helper.pages.dev/articles/${date}.html`;
  
  const optimizedHtml = html.replace(
    '</head>',
    `  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="robots" content="index, follow">
  <meta name="article:published_time" content="${date}T12:00:00Z">
</head>`
  );
  
  return optimizedHtml;
}

async function updateIndexAndSitemap(articlesDir) {
  console.log('📋 更新索引页面和站点地图...');
  
  // 获取所有文章文件
  const allArticles = getAllArticles(articlesDir);
  
  // 生成文章列表页面
  await generateArticleIndex(allArticles, articlesDir);
  
  // 生成sitemap.xml
  await generateSitemap(allArticles);
}

function getAllArticles(articlesDir) {
  const articles = [];
  
  if (!fs.existsSync(articlesDir)) {
    return articles;
  }
  
  const files = fs.readdirSync(articlesDir);
  files.forEach(file => {
    if (file.match(/^\d{4}-\d{2}-\d{2}\.html$/)) {
      const date = file.replace('.html', '');
      const filePath = path.join(articlesDir, file);
      const stats = fs.statSync(filePath);
      
      articles.push({
        date: date,
        size: stats.size,
        mtime: stats.mtime
      });
    }
  });
  
  // 按日期排序（最新的在前）
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return articles;
}

async function generateArticleIndex(articles, articlesDir) {
  const indexHtml = createArticleIndexHtml(articles);
  const indexPath = path.join(articlesDir, 'index.html');
  
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log(`  ✅ 更新: index.html (${Math.round(indexHtml.length/1024)}KB, ${articles.length}篇文章)`);
}

function createArticleIndexHtml(articles) {
  const articleLinks = articles.map(article => {
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
    
    // 判断是否是最近的文章
    const daysDiff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    const isRecent = daysDiff <= 3;
    const recentBadge = isRecent ? '<span class="badge recent">New</span>' : '';
    
    return `
    <div class="article-item ${isRecent ? 'recent-article' : ''}">
      <div class="article-date">${shortDate}</div>
      <div class="article-content">
        <h3><a href="${article.date}.html">NYT Connections ${formattedDate}</a></h3>
        <p>Complete solutions, hints, and strategies for today's puzzle. All four categories with detailed explanations.</p>
        <div class="article-meta">
          ${recentBadge}
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
        .stats {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            color: white;
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
        .recent-article {
            border-left: 4px solid #4CAF50;
            background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
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
        .recent-article .article-date {
            background: #e8f5e8;
            color: #2e7d32;
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
            flex-wrap: wrap;
        }
        .badge {
            background: #e8f0fe;
            color: #1a73e8;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 500;
        }
        .badge.recent {
            background: #4CAF50;
            color: white;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
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
            <div class="stats">
                📚 ${articles.length} articles available • 🔄 Updated daily
            </div>
        </div>
        
        <div class="nav-links">
            <a href="../">🏠 Play Latest Puzzle</a>
            <a href="#latest">📚 Latest Solutions</a>
        </div>
        
        <div id="latest">
            <h2 style="margin-bottom: 30px; color: #333; font-size: 1.8em;">📋 All Solutions (${articles.length} articles)</h2>
            ${articleLinks}
        </div>
        
        <div class="footer">
            <p>This archive contains complete solutions for NYT Connections puzzles.</p>
            <p>Visit <a href="https://www.nytimes.com/games/connections" target="_blank" style="color: #1a73e8;">NYT Games</a> to play the official puzzle.</p>
            <p style="margin-top: 10px; font-size: 0.8em; color: #999;">
                🚀 Powered by intelligent static generation • Only scans recent 5 days for efficiency
            </p>
        </div>
    </div>
</body>
</html>`;
}

async function generateSitemap(articles) {
  console.log('🗺️ 更新站点地图...');
  
  const sitemapContent = createSitemapXml(articles);
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log(`  ✅ 更新: sitemap.xml (${Math.round(sitemapContent.length/1024)}KB, ${articles.length}篇文章)`);
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

function showStatistics(newArticles, existingFiles) {
  console.log('\n📊 执行统计');
  console.log('='.repeat(40));
  console.log(`📅 扫描范围: 最近${DAYS_TO_SCAN}天`);
  console.log(`📚 现有文章: ${existingFiles.size} 篇`);
  console.log(`✨ 新增文章: ${newArticles.filter(a => a.isNew).length} 篇`);
  console.log(`🔄 更新文章: ${newArticles.filter(a => !a.isNew).length} 篇`);
  console.log(`🌐 API请求: ${DAYS_TO_SCAN} 个 (相比30个减少${Math.round((30-DAYS_TO_SCAN)/30*100)}%)`);
  
  const totalSize = newArticles.reduce((sum, article) => sum + article.size, 0);
  if (totalSize > 0) {
    console.log(`💾 处理数据: ${Math.round(totalSize/1024)}KB`);
  }
  
  console.log('🎯 策略优势: 静态文章累积，只处理最新内容');
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
  generateStaticArticlesFinal().catch(error => {
    console.error('❌ 生成静态文章失败:', error);
    process.exit(1);
  });
}

export { generateStaticArticlesFinal };

// 更新主页的文章链接
async function updateHomepageLinks(articlesDir) {
  console.log('🔗 更新主页文章链接...');
  
  try {
    const indexPath = path.join(__dirname, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.log('⚠️  主页文件不存在，跳过更新');
      return;
    }
    
    // 获取最新的文章日期
    const existingFiles = getExistingArticles(articlesDir);
    const sortedDates = Array.from(existingFiles).sort().reverse();
    
    if (sortedDates.length < 2) {
      console.log('⚠️  文章数量不足，跳过主页更新');
      return;
    }
    
    const latestDate = sortedDates[0];      // 最新文章
    const yesterdayDate = sortedDates[1];   // 昨天文章
    
    console.log(`  📅 最新文章: ${latestDate}`);
    console.log(`  📅 昨天文章: ${yesterdayDate}`);
    
    // 读取主页内容
    let homepageContent = fs.readFileSync(indexPath, 'utf8');
    
    // 更新 "📚 Read Complete Solution Guide" 链接
    homepageContent = homepageContent.replace(
      /href="\/articles\/\d{4}-\d{2}-\d{2}\.html"([^>]*>[\s\S]*?📚 Read Complete Solution Guide)/,
      `href="/articles/${latestDate}.html"$1`
    );
    
    // 更新 "📄 Latest Solution" 链接
    homepageContent = homepageContent.replace(
      /href="\/articles\/\d{4}-\d{2}-\d{2}\.html"([^>]*>[\s\S]*?📄 Latest Solution)/,
      `href="/articles/${latestDate}.html"$1`
    );
    
    // 更新 "📅 Yesterday's" 链接
    homepageContent = homepageContent.replace(
      /href="\/articles\/\d{4}-\d{2}-\d{2}\.html"([^>]*>[\s\S]*?📅 Yesterday's)/,
      `href="/articles/${yesterdayDate}.html"$1`
    );
    
    // 写回文件
    fs.writeFileSync(indexPath, homepageContent, 'utf8');
    
    console.log('  ✅ 主页链接更新完成');
    console.log(`    📚 Complete Solution Guide → ${latestDate}`);
    console.log(`    📄 Latest Solution → ${latestDate}`);
    console.log(`    📅 Yesterday's → ${yesterdayDate}`);
    
  } catch (error) {
    console.error('❌ 更新主页链接失败:', error.message);
  }
}