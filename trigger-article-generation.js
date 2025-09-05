// 手动触发文章生成
const today = new Date().toISOString().split('T')[0];

async function triggerArticleGeneration() {
    try {
        console.log(`🔄 尝试触发 ${today} 的文章生成...`);
        
        // 方法1: 直接访问文章API (应该触发自动生成)
        console.log('\n方法1: 访问文章API');
        const articleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`状态: ${articleResponse.status}`);
        
        if (articleResponse.ok) {
            console.log('✅ 文章生成成功!');
            const content = await articleResponse.text();
            console.log(`内容长度: ${content.length} 字符`);
            
            // 检查是否包含预期内容
            if (content.includes('NYT Connections') && content.includes('Complete Answers')) {
                console.log('✅ 文章内容验证通过');
            } else {
                console.log('⚠️ 文章内容可能有问题');
            }
        } else {
            console.log('❌ 文章生成失败');
            const errorText = await articleResponse.text();
            console.log('错误详情:', errorText.substring(0, 300));
        }
        
        // 方法2: 尝试调用scheduled端点 (需要认证)
        console.log('\n方法2: 尝试调用scheduled端点');
        const scheduledResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST'
        });
        console.log(`Scheduled端点状态: ${scheduledResponse.status}`);
        
        if (scheduledResponse.status === 401) {
            console.log('✅ Scheduled端点存在但需要认证 (正常)');
        } else if (scheduledResponse.ok) {
            console.log('✅ Scheduled端点调用成功');
        } else {
            console.log('❌ Scheduled端点调用失败');
        }
        
        // 方法3: 等待一下再次检查文章
        console.log('\n方法3: 等待后再次检查');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const recheckResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`重新检查状态: ${recheckResponse.status}`);
        
        if (recheckResponse.ok) {
            console.log('✅ 文章现在可用了!');
        } else {
            console.log('❌ 文章仍然不可用');
        }
        
    } catch (error) {
        console.error('触发失败:', error.message);
    }
}

triggerArticleGeneration();