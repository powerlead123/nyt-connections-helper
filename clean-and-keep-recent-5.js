import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanAndKeepRecent5() {
  console.log('🧹 清理历史文章，只保留最近5篇正确数据');
  console.log('⏰', new Date().toLocaleString());
  console.log('='.repeat(60));
  
  try {
    const articlesDir = path.join(__dirname, 'articles');
    
    if (!fs.existsSync(articlesDir)) {
      console.log('❌ articles目录不存在');
      return;
    }
    
    // 1. 获取所有文章文件
    const files = fs.readdirSync(articlesDir);
    const articleFiles = files.filter(file => file.match(/^\d{4}-\d{2}-\d{2}\.html$/));
    
    console.log(`📁 发现 ${articleFiles.length} 篇文章`);
    
    if (articleFiles.length === 0) {
      console.log('✅ 没有文章需要清理');
      return;
    }
    
    // 2. 按日期排序（最新的在前）
    const sortedFiles = articleFiles.sort((a, b) => {
      const dateA = a.replace('.html', '');
      const dateB = b.replace('.html', '');
      return new Date(dateB) - new Date(dateA);
    });
    
    console.log('\n📋 当前文章列表（按日期排序）:');
    sortedFiles.forEach((file, index) => {
      const date = file.replace('.html', '');
      const filePath = path.join(articlesDir, file);
      const stats = fs.statSync(filePath);
      const size = Math.round(stats.size / 1024);
      const status = index < 5 ? '✅ 保留' : '🗑️ 删除';
      console.log(`  ${index + 1}. ${date} (${size}KB) - ${status}`);
    });
    
    // 3. 确认操作
    console.log('\n🎯 操作计划:');
    console.log(`  ✅ 保留最新的 5 篇文章`);
    console.log(`  🗑️ 删除其余的 ${Math.max(0, sortedFiles.length - 5)} 篇文章`);
    
    if (sortedFiles.length <= 5) {
      console.log('✅ 文章数量已经是5篇或更少，无需清理');
      return;
    }
    
    // 4. 执行清理
    console.log('\n🧹 开始清理...');
    
    const filesToKeep = sortedFiles.slice(0, 5);
    const filesToDelete = sortedFiles.slice(5);
    
    let deletedCount = 0;
    let deletedSize = 0;
    
    for (const file of filesToDelete) {
      const filePath = path.join(articlesDir, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        deletedSize += size;
        console.log(`  🗑️ 删除: ${file} (${Math.round(size/1024)}KB)`);
      } catch (error) {
        console.log(`  ❌ 删除失败: ${file} - ${error.message}`);
      }
    }
    
    // 5. 显示保留的文章
    console.log('\n✅ 保留的文章:');
    filesToKeep.forEach((file, index) => {
      const date = file.replace('.html', '');
      const filePath = path.join(articlesDir, file);
      const stats = fs.statSync(filePath);
      const size = Math.round(stats.size / 1024);
      console.log(`  ${index + 1}. ${date} (${size}KB)`);
    });
    
    // 6. 更新索引页面和sitemap
    console.log('\n📋 更新索引页面和站点地图...');
    await updateIndexAndSitemap(articlesDir);
    
    // 7. 显示清理结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 清理完成统计');
    console.log('='.repeat(60));
    console.log(`🗑️ 删除文章: ${deletedCount} 篇`);
    console.log(`💾 释放空间: ${Math.round(deletedSize/1024)}KB`);
    console.log(`✅ 保留文章: ${filesToKeep.length} 篇`);
    console.log(`🎯 目标达成: 只保留最近5篇正确数据`);
    
    console.log('\n💡 后续说明:');
    console.log('  🔄 以后每天会自动添加新的正确文章');
    console.log('  📚 静态文章会慢慢累积增长');
    console.log('  ✨ 系统现在从干净的状态开始运行');
    
    console.log('\n🎉 清理完成！系统已准备好正常运行');
    
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 更新索引和sitemap的函数
async function updateIndexAndSitemap(articlesDir) {
  // 获取所有剩余的文章文件
  const files = fs.readdirSync(articlesDir);
  const articleFiles = files.filter(file => file.match(/^\d{4}-\d{2}-\d{2}\.html$/));
  
  const articles = articleFiles.map(file => {
    const date = file.replace('.html', '');
    const filePath = path.join(articlesDir, file);
    const stats = fs.statSync(filePath);
    
    return {
      date: date,
      size: stats.size,
      mtime: stats.mtime
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 生成新的索引页面
  const indexHtml = createCleanIndexHtml(articles);
  const indexPath = path.join(articlesDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log(`  ✅ 更新: index.html (${articles.length}篇文章)`);
  
  // 生成新的sitemap
  const sitemapContent = createCleanSitemapXml(articles);
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log(`  ✅ 更新: sitemap.xml (${articles.length}篇文章)`);
}

function createCleanIndexHtml(articles) {
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
    
    return `
    <div class="article-item recent-article">
      <div class="article-date">${shortDate}</div>
      <div class="article-content">
        <h3><a href="${article.date}.html">NYT Connections ${formattedDate}</a></h3>
        <p>Complete solutions, hints, and strategies for today's puzzle. All four categories with detailed explanations.</p>
        <div class="article-meta">
          <span class="badge recent">Clean</span>
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
    <link rel="canonical" href="https://nyt-connections-helper.pages.dev/articles/">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background-color: #f8f9fa;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header {
            text-align: center; margin-bottom: 40px; padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border-radius: 12px;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 700; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .clean-notice {
            background: #e8f5e8; border: 2px solid #4CAF50; border-radius: 8px;
            padding: 15px; margin: 20px 0; text-align: center;
        }
        .article-item {
            display: flex; margin: 20px 0; padding: 20px; background: white;
            border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #4CAF50;
        }
        .article-date {
            flex-shrink: 0; width: 80px; text-align: center; padding: 10px;
            background: #e8f5e8; border-radius: 8px; margin-right: 20px;
            font-weight: 600; color: #2e7d32; font-size: 0.9em;
        }
        .article-content { flex: 1; }
        .article-content h3 { margin: 0 0 8px 0; font-size: 1.3em; }
        .article-content a { text-decoration: none; color: #1a73e8; font-weight: 600; }
        .article-content p { color: #5f6368; margin-bottom: 12px; font-size: 0.95em; }
        .article-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .badge {
            background: #e8f0fe; color: #1a73e8; padding: 4px 8px;
            border-radius: 4px; font-size: 0.8em; font-weight: 500;
        }
        .badge.recent { background: #4CAF50; color: white; }
        .nav-links { text-align: center; margin: 40px 0; }
        .nav-links a {
            display: inline-block; margin: 0 10px; padding: 12px 24px;
            background: #1a73e8; color: white; text-decoration: none;
            border-radius: 6px; font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧩 NYT Connections Solutions</h1>
            <p>Complete archive of puzzle solutions, hints, and strategies</p>
        </div>
        
        <div class="clean-notice">
            <h3>🧹 Fresh Start!</h3>
            <p>Archive cleaned - showing only the latest ${articles.length} verified articles with correct data.</p>
            <p>New articles will be added daily as the archive grows naturally.</p>
        </div>
        
        <div class="nav-links">
            <a href="../">🏠 Play Latest Puzzle</a>
        </div>
        
        <div>
            <h2 style="margin-bottom: 30px; color: #333; font-size: 1.8em;">📋 Clean Articles (${articles.length} verified)</h2>
            ${articleLinks}
        </div>
    </div>
</body>
</html>`;
}

function createCleanSitemapXml(articles) {
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

// 运行清理
cleanAndKeepRecent5();