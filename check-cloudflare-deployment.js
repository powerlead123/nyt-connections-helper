// 检查 Cloudflare Pages 部署状态
console.log('🔍 检查 Cloudflare Pages 部署状态');
console.log('');

// 检查线上文章页面
const checkUrls = [
    'https://nyt-connections-helper.pages.dev/articles/',
    'https://nyt-connections-helper.pages.dev/articles/2025-09-22.html',
    'https://nyt-connections-helper.pages.dev/articles/2025-09-21.html',
    'https://nyt-connections-helper.pages.dev/articles/2025-09-20.html'
];

async function checkDeployment() {
    console.log('📋 检查以下URL的可访问性：');
    
    for (const url of checkUrls) {
        try {
            const response = await fetch(url);
            const status = response.status;
            const statusText = response.statusText;
            
            if (status === 200) {
                console.log(`✅ ${url} - 可访问 (${status})`);
                
                // 如果是文章索引页面，检查内容
                if (url.includes('/articles/') && !url.includes('.html')) {
                    const content = await response.text();
                    const hasNewArticles = content.includes('2025-09-22') && 
                                         content.includes('2025-09-21') && 
                                         content.includes('2025-09-20');
                    
                    if (hasNewArticles) {
                        console.log('   📚 包含最新文章链接 ✅');
                    } else {
                        console.log('   ⚠️  未包含最新文章链接 - 可能还在部署中');
                    }
                }
            } else {
                console.log(`❌ ${url} - ${status} ${statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${url} - 网络错误: ${error.message}`);
        }
    }
    
    console.log('');
    console.log('💡 如果文章页面显示404或内容未更新：');
    console.log('1. Cloudflare Pages 可能还在部署中（通常需要1-3分钟）');
    console.log('2. 可以访问 Cloudflare Dashboard 查看部署状态');
    console.log('3. 或者等待几分钟后再次检查');
}

checkDeployment().catch(console.error);