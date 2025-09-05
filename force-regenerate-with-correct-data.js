// 强制使用正确数据重新生成文章
const today = new Date().toISOString().split('T')[0];

async function forceRegenerateWithCorrectData() {
    console.log('🔄 强制使用正确数据重新生成文章...');
    
    try {
        // 1. 先获取正确的今日数据
        console.log('\n1️⃣ 获取正确的今日数据');
        console.log('='.repeat(40));
        
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        if (!todayResponse.ok) {
            console.log('❌ 无法获取今日数据');
            return;
        }
        
        const correctData = await todayResponse.json();
        console.log('✅ 正确的今日数据:');
        console.log(`单词: ${correctData.words?.join(', ')}`);
        
        // 2. 多次尝试重新生成，直到使用正确数据
        console.log('\n2️⃣ 多次尝试重新生成');
        console.log('='.repeat(40));
        
        let attempts = 0;
        const maxAttempts = 5;
        let success = false;
        
        while (attempts < maxAttempts && !success) {
            attempts++;
            console.log(`\n尝试 ${attempts}/${maxAttempts}:`);
            
            // 触发重新生成
            const regenerateResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate-article', secret: 'your-secret-key-here' })
            });
            
            if (regenerateResponse.ok) {
                const result = await regenerateResponse.json();
                console.log(`生成结果: ${result.result?.articleLength} 字符`);
                
                // 等待一下
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 检查文章内容
                const articleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
                if (articleResponse.ok) {
                    const content = await articleResponse.text();
                    
                    // 检查是否包含正确的单词
                    const hasCorrectWords = correctData.words?.some(word => content.includes(word));
                    
                    if (hasCorrectWords) {
                        console.log('✅ 文章现在包含正确的数据！');
                        success = true;
                        
                        // 验证所有单词
                        const wordMatches = content.match(/<span class="bg-gray-100[^>]*>([^<]+)<\/span>/g) || [];
                        const articleWords = wordMatches.map(match => match.replace(/<[^>]*>/g, '').trim());
                        
                        console.log(`文章中的单词: ${articleWords.join(', ')}`);
                        
                        const matchCount = correctData.words?.filter(word => articleWords.includes(word)).length || 0;
                        console.log(`匹配的单词数量: ${matchCount}/${correctData.words?.length || 0}`);
                        
                    } else {
                        console.log('❌ 文章仍使用旧数据，继续尝试...');
                    }
                }
            } else {
                console.log(`❌ 生成失败: ${regenerateResponse.status}`);
            }
            
            if (!success && attempts < maxAttempts) {
                console.log('等待5秒后重试...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        if (!success) {
            console.log('\n❌ 多次尝试后仍无法使用正确数据');
            console.log('可能的原因:');
            console.log('1. 代码更改还未部署到Cloudflare Pages');
            console.log('2. 数据获取逻辑仍有问题');
            console.log('3. 缓存机制阻止了数据更新');
            
            console.log('\n建议解决方案:');
            console.log('1. 等待Cloudflare Pages完成部署');
            console.log('2. 检查scheduled.js的部署状态');
            console.log('3. 手动清除KV存储中的缓存');
        } else {
            console.log('\n🎉 成功！文章现在使用正确的数据。');
            console.log(`\n用户可以访问: https://nyt-connections-helper.pages.dev/api/article/${today}`);
        }
        
    } catch (error) {
        console.error('❌ 强制重新生成失败:', error.message);
    }
}

forceRegenerateWithCorrectData();