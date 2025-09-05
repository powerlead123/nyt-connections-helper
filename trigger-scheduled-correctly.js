// 正确触发scheduled端点
async function triggerScheduledEndpoint() {
    try {
        console.log('🔄 正确触发scheduled端点...');
        
        // 方法1: 触发文章生成
        console.log('\n方法1: 触发文章生成');
        const articleResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate-article',
                secret: 'your-secret-key-here'
            })
        });
        
        console.log(`文章生成状态: ${articleResponse.status}`);
        
        if (articleResponse.ok) {
            const result = await articleResponse.json();
            console.log('✅ 文章生成成功!');
            console.log('结果:', result);
        } else {
            const errorText = await articleResponse.text();
            console.log('❌ 文章生成失败');
            console.log('错误:', errorText);
        }
        
        // 方法2: 触发完整每日更新
        console.log('\n方法2: 触发完整每日更新');
        const dailyResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'your-secret-key-here'
            })
        });
        
        console.log(`每日更新状态: ${dailyResponse.status}`);
        
        if (dailyResponse.ok) {
            const result = await dailyResponse.json();
            console.log('✅ 每日更新成功!');
            console.log('结果:', result);
        } else {
            const errorText = await dailyResponse.text();
            console.log('❌ 每日更新失败');
            console.log('错误:', errorText);
        }
        
        // 等待一下，然后检查文章是否生成
        console.log('\n等待3秒后检查文章...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const today = new Date().toISOString().split('T')[0];
        const checkResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`\n文章检查状态: ${checkResponse.status}`);
        
        if (checkResponse.ok) {
            console.log('✅ 文章现在可用了!');
            const content = await checkResponse.text();
            console.log(`文章长度: ${content.length} 字符`);
            
            // 检查文章内容
            if (content.includes('NYT Connections') && content.includes('Complete Answers')) {
                console.log('✅ 文章内容验证通过');
            } else {
                console.log('⚠️ 文章内容可能有问题');
            }
        } else {
            console.log('❌ 文章仍然不可用');
        }
        
    } catch (error) {
        console.error('触发失败:', error.message);
    }
}

triggerScheduledEndpoint();