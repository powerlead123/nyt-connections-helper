// 检查部署状态和代码是否生效
async function checkDeploymentStatus() {
    console.log('🔍 检查部署状态...');
    
    try {
        // 1. 测试新的fetchFromTodayAPI函数是否存在
        console.log('\n1️⃣ 测试scheduled端点的新逻辑');
        console.log('='.repeat(40));
        
        // 触发完整的每日更新，看看日志
        const updateResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'daily-update', secret: 'your-secret-key-here' })
        });
        
        console.log(`更新状态: ${updateResponse.status}`);
        
        if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log('更新结果:', JSON.stringify(result, null, 2));
            
            // 检查数据来源
            if (result.result?.scrape?.source) {
                console.log(`数据来源: ${result.result.scrape.source}`);
                
                if (result.result.scrape.source === 'Backup') {
                    console.log('⚠️ 仍在使用备用数据，新逻辑可能未生效');
                } else if (result.result.scrape.source.includes('Today API')) {
                    console.log('✅ 新逻辑已生效，使用Today API数据');
                } else {
                    console.log(`📊 使用数据源: ${result.result.scrape.source}`);
                }
            }
        }
        
        // 2. 等待并检查最新文章
        console.log('\n2️⃣ 检查最新生成的文章');
        console.log('='.repeat(40));
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const today = new Date().toISOString().split('T')[0];
        const articleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        
        if (articleResponse.ok) {
            const content = await articleResponse.text();
            
            // 提取文章中的单词
            const wordMatches = content.match(/<span class="bg-gray-100[^>]*>([^<]+)<\/span>/g) || [];
            const articleWords = wordMatches.map(match => match.replace(/<[^>]*>/g, '').trim());
            
            console.log(`文章中的单词 (${articleWords.length}个):`);
            console.log(articleWords.join(', '));
            
            // 获取今日API的单词
            const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
            if (todayResponse.ok) {
                const todayData = await todayResponse.json();
                const todayWords = todayData.words || [];
                
                console.log(`\n今日API单词 (${todayWords.length}个):`);
                console.log(todayWords.join(', '));
                
                // 检查匹配度
                const matchingWords = articleWords.filter(word => todayWords.includes(word));
                const matchPercentage = Math.round((matchingWords.length / Math.max(articleWords.length, todayWords.length)) * 100);
                
                console.log(`\n匹配度: ${matchingWords.length}/${Math.max(articleWords.length, todayWords.length)} (${matchPercentage}%)`);
                
                if (matchPercentage >= 90) {
                    console.log('✅ 数据基本匹配，修复成功！');
                } else if (matchPercentage >= 50) {
                    console.log('⚠️ 数据部分匹配，可能需要进一步调整');
                } else {
                    console.log('❌ 数据不匹配，修复未成功');
                }
                
                if (matchingWords.length > 0) {
                    console.log(`匹配的单词: ${matchingWords.join(', ')}`);
                }
            }
        }
        
        // 3. 检查是否是缓存问题
        console.log('\n3️⃣ 分析可能的问题');
        console.log('='.repeat(40));
        
        if (articleWords.includes('NET') && articleWords.includes('SNARE')) {
            console.log('🔍 文章仍包含备用数据单词 (NET, SNARE等)');
            console.log('可能原因:');
            console.log('1. 新代码还未部署到Cloudflare Pages');
            console.log('2. 文章已缓存，KV存储中的数据未更新');
            console.log('3. fetchFromTodayAPI函数返回null，回退到备用数据');
            
            console.log('\n建议解决方案:');
            console.log('1. 等待更长时间让Cloudflare Pages完成部署');
            console.log('2. 检查fetchFromTodayAPI函数的错误日志');
            console.log('3. 手动清除KV存储中的article缓存');
        } else {
            console.log('✅ 文章不再使用备用数据');
        }
        
        console.log('\n📊 当前状态总结:');
        console.log(`- 部署时间: ${new Date().toLocaleString()}`);
        console.log(`- 文章长度: ${content?.length || 0} 字符`);
        console.log(`- 数据匹配: ${matchPercentage || 0}%`);
        console.log(`- 使用备用数据: ${articleWords.includes('NET') ? '是' : '否'}`);
        
    } catch (error) {
        console.error('❌ 检查过程出错:', error.message);
    }
}

checkDeploymentStatus();