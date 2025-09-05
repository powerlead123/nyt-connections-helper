// 修复文章数据不匹配问题
const today = new Date().toISOString().split('T')[0];

async function fixArticleData() {
    console.log('🔧 修复文章数据不匹配问题...');
    console.log(`日期: ${today}`);
    
    try {
        // 1. 检查当前数据状态
        console.log('\n1️⃣ 检查当前数据状态');
        console.log('='.repeat(40));
        
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        if (todayResponse.ok) {
            const todayData = await todayResponse.json();
            console.log('今日API数据:');
            console.log(`  来源: ${todayData.source || '未知'}`);
            if (todayData.groups) {
                todayData.groups.forEach((group, index) => {
                    console.log(`  ${index + 1}. ${group.theme}: ${group.words?.join(', ')}`);
                });
            }
        }
        
        // 2. 重新生成文章（使用新的逻辑）
        console.log('\n2️⃣ 重新生成文章');
        console.log('='.repeat(40));
        
        const regenerateResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-article', secret: 'your-secret-key-here' })
        });
        
        console.log(`重新生成状态: ${regenerateResponse.status}`);
        
        if (regenerateResponse.ok) {
            const result = await regenerateResponse.json();
            console.log('重新生成结果:', result);
        } else {
            console.log('❌ 重新生成失败');
            return;
        }
        
        // 3. 等待并检查新文章
        console.log('\n3️⃣ 检查新文章内容');
        console.log('='.repeat(40));
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newArticleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        if (newArticleResponse.ok) {
            const newContent = await newArticleResponse.text();
            console.log(`新文章长度: ${newContent.length} 字符`);
            
            // 检查新文章中的单词
            const wordMatches = newContent.match(/<span class="bg-gray-100[^>]*>([^<]+)<\/span>/g) || [];
            const words = wordMatches.map(match => match.replace(/<[^>]*>/g, '').trim());
            
            console.log(`文章中的单词 (${words.length}个):`);
            console.log(words.join(', '));
            
            // 与今日API数据对比
            const todayData2 = await fetch('https://nyt-connections-helper.pages.dev/api/today').then(r => r.json());
            const todayWords = todayData2.words || [];
            
            console.log(`\n今日API单词 (${todayWords.length}个):`);
            console.log(todayWords.join(', '));
            
            // 检查是否匹配
            const isMatching = words.length === todayWords.length && 
                              words.every(word => todayWords.includes(word));
            
            if (isMatching) {
                console.log('\n✅ 数据匹配成功！文章和今日API现在使用相同的数据。');
            } else {
                console.log('\n❌ 数据仍然不匹配，需要进一步调试。');
                
                // 显示差异
                const missingInArticle = todayWords.filter(word => !words.includes(word));
                const extraInArticle = words.filter(word => !todayWords.includes(word));
                
                if (missingInArticle.length > 0) {
                    console.log(`文章中缺少的单词: ${missingInArticle.join(', ')}`);
                }
                if (extraInArticle.length > 0) {
                    console.log(`文章中多余的单词: ${extraInArticle.join(', ')}`);
                }
            }
        }
        
        // 4. 验证用户体验
        console.log('\n4️⃣ 验证用户体验');
        console.log('='.repeat(40));
        
        console.log('用户现在可以:');
        console.log('1. 在主页玩今日谜题');
        console.log('2. 点击文章链接查看完整解答');
        console.log('3. 确保看到的是同一套谜题的答案');
        
        console.log(`\n🔗 验证链接:`);
        console.log(`今日谜题: https://nyt-connections-helper.pages.dev/`);
        console.log(`今日文章: https://nyt-connections-helper.pages.dev/api/article/${today}`);
        
    } catch (error) {
        console.error('❌ 修复过程出错:', error.message);
    }
}

fixArticleData();