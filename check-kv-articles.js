// 检查KV中的文章并生成缺失的文章
console.log('🔍 检查KV中的文章存储情况...');

async function checkAndGenerateArticles() {
    try {
        // 检查今天的文章
        const today = new Date().toISOString().split('T')[0];
        console.log(`检查今天 (${today}) 的文章...`);
        
        const todayArticleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`今天文章状态: ${todayArticleResponse.status}`);
        
        if (todayArticleResponse.status === 404) {
            console.log('❌ 今天的文章不存在，尝试生成...');
            
            // 触发scheduled任务来生成文章
            const generateResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'generate-article', 
                    secret: 'your-secret-key-here' 
                })
            });
            
            if (generateResponse.ok) {
                const result = await generateResponse.json();
                console.log('✅ 文章生成请求已发送:', result);
                
                // 等待几秒后再检查
                setTimeout(async () => {
                    const checkAgain = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
                    console.log(`重新检查今天文章状态: ${checkAgain.status}`);
                    
                    if (checkAgain.ok) {
                        console.log('🎉 今天的文章已生成成功！');
                    } else {
                        console.log('⚠️ 文章可能还在生成中...');
                    }
                }, 5000);
                
            } else {
                console.log('❌ 文章生成请求失败:', generateResponse.status);
            }
        } else if (todayArticleResponse.ok) {
            console.log('✅ 今天的文章已存在');
            const content = await todayArticleResponse.text();
            console.log(`文章长度: ${content.length} 字符`);
        }
        
        // 检查最近几天的文章
        console.log('\n📅 检查最近7天的文章存在情况:');
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            try {
                const response = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${dateStr}`, {
                    method: 'HEAD'
                });
                
                const status = response.ok ? '✅ 存在' : '❌ 不存在';
                console.log(`   ${dateStr}: ${status} (${response.status})`);
                
            } catch (error) {
                console.log(`   ${dateStr}: ❌ 检查失败`);
            }
        }
        
    } catch (error) {
        console.error('检查过程出错:', error);
    }
}

checkAndGenerateArticles();