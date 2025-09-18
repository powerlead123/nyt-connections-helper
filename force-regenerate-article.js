console.log('🔄 强制重新生成今日文章');

async function forceRegenerateArticle() {
  const baseUrl = 'https://nyt-connections-helper.pages.dev';
  const today = new Date().toISOString().split('T')[0];
  
  console.log('\n=== 1. 清除今日文章缓存 ===');
  
  // 触发定时任务重新生成
  const scheduledResponse = await fetch(`${baseUrl}/scheduled`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'daily-update',
      secret: 'your-secret-key-here'
    })
  });
  
  const scheduledResult = await scheduledResponse.json();
  console.log('定时任务执行:', scheduledResult.success ? '✅' : '❌');
  
  if (scheduledResult.result?.article) {
    console.log('文章重新生成:', scheduledResult.result.article.success ? '✅' : '❌');
    console.log('新文章长度:', scheduledResult.result.article.articleLength || 0, '字符');
  }
  
  console.log('\n=== 2. 等待5秒后检查新文章 ===');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 访问文章页面检查
  const articleUrl = `${baseUrl}/api/article/${today}`;
  const articleResponse = await fetch(articleUrl);
  
  if (articleResponse.ok) {
    const articleHTML = await articleResponse.text();
    
    console.log('\n=== 3. 检查调试信息是否移除 ===');
    const hasDataSource = articleHTML.includes('Data source:');
    const hasGenerated = articleHTML.includes('Generated:');
    const hasMashable = articleHTML.includes('Mashable (Perfect Logic');
    
    console.log('包含"Data source:":', hasDataSource ? '❌ 仍然存在' : '✅ 已移除');
    console.log('包含"Generated:":', hasGenerated ? '❌ 仍然存在' : '✅ 已移除');
    console.log('包含"Mashable"调试信息:', hasMashable ? '❌ 仍然存在' : '✅ 已移除');
    
    // 检查新的SEO内容
    const hasWelcome = articleHTML.includes('Welcome to today');
    const hasTips = articleHTML.includes('How to Solve NYT Connections');
    const hasAbout = articleHTML.includes('About NYT Connections');
    
    console.log('\n=== 4. 检查新内容是否存在 ===');
    console.log('欢迎介绍:', hasWelcome ? '✅' : '❌');
    console.log('解题技巧:', hasTips ? '✅' : '❌');
    console.log('游戏介绍:', hasAbout ? '✅' : '❌');
    
    console.log('\n=== 5. 文章长度对比 ===');
    console.log('当前文章长度:', articleHTML.length, '字符');
    
    if (!hasDataSource && !hasGenerated && hasWelcome && hasTips) {
      console.log('\n🎉 文章更新成功！调试信息已移除，SEO内容已添加');
      console.log('🔗 请刷新浏览器查看新版本:', articleUrl);
    } else {
      console.log('\n⚠️ 文章可能还没有完全更新');
      console.log('建议等待几分钟后再次检查');
    }
    
  } else {
    console.log('❌ 无法访问文章页面:', articleResponse.status);
  }
}

// 运行强制重新生成
forceRegenerateArticle().catch(console.error);