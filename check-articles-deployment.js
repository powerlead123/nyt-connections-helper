// 检查文章页面部署
console.log('📚 检查文章页面部署状态...');

setTimeout(async () => {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/articles', {
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const content = await response.text();
            
            // 检查页面标题
            const titleMatch = content.match(/<title>(.*?)<\/title>/);
            const title = titleMatch ? titleMatch[1] : '未找到标题';
            
            console.log('📋 页面标题:', title);
            
            // 检查是否是正确的文章列表页面
            if (content.includes('Solutions Archive')) {
                console.log('✅ 正确显示文章列表页面！');
            } else if (content.includes('NYT Connections Game')) {
                console.log('❌ 仍然显示游戏首页');
            } else {
                console.log('❓ 未知页面类型');
            }
            
            // 检查关键元素
            const hasArchiveTitle = content.includes('Solutions Archive');
            const hasRecentSolutions = content.includes('Recent Solutions');
            const hasLoadingScript = content.includes('loadArticles');
            
            console.log('🔍 页面元素检查:');
            console.log(`   Archive标题: ${hasArchiveTitle ? '✅' : '❌'}`);
            console.log(`   Recent Solutions: ${hasRecentSolutions ? '✅' : '❌'}`);
            console.log(`   加载脚本: ${hasLoadingScript ? '✅' : '❌'}`);
            
            if (hasArchiveTitle && hasRecentSolutions && hasLoadingScript) {
                console.log('\n🎉 文章列表页面部署成功！');
            } else {
                console.log('\n⚠️ 页面可能还在更新中...');
            }
            
        } else {
            console.log(`❌ 请求失败: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ 检查失败: ${error.message}`);
    }
}, 5000); // 等待5秒后检查