// 检查真实的今日谜题数据
console.log('🔍 检查真实的今日NYT Connections谜题...');

async function checkRealTodayPuzzle() {
    try {
        // 1. 先检查我们的refresh API，看能否获取真实数据
        console.log('📡 尝试通过refresh API获取真实数据...');
        
        const refreshResponse = await fetch('https://nyt-connections-helper.pages.dev/api/refresh');
        
        if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('🔄 Refresh API响应:');
            console.log(JSON.stringify(refreshData, null, 2));
        } else {
            console.log(`❌ Refresh API失败: ${refreshResponse.status}`);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 2. 直接尝试从Mashable获取今日数据
        console.log('📡 尝试直接从Mashable获取今日数据...');
        
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log(`📅 今日日期: ${dateStr}`);
        
        const mashableUrl = `https://mashable.com/article/nyt-connections-hint-answer-today-${dateStr}`;
        console.log(`🔗 Mashable URL: ${mashableUrl}`);
        
        try {
            const mashableResponse = await fetch(mashableUrl);
            console.log(`📊 Mashable响应状态: ${mashableResponse.status}`);
            
            if (mashableResponse.ok) {
                const html = await mashableResponse.text();
                
                // 简单检查是否包含今日谜题内容
                const hasConnectionsContent = html.includes('Connections') && html.includes('puzzle');
                const hasWordsContent = html.includes('words') || html.includes('categories');
                
                console.log(`📋 包含Connections内容: ${hasConnectionsContent ? '✅' : '❌'}`);
                console.log(`📋 包含单词/分类内容: ${hasWordsContent ? '✅' : '❌'}`);
                
                // 尝试提取一些关键信息
                const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
                if (titleMatch) {
                    console.log(`📰 页面标题: ${titleMatch[1]}`);
                }
                
                // 检查是否有今日日期
                const hasToday = html.includes(dateStr) || html.includes(today.toDateString());
                console.log(`📅 包含今日日期: ${hasToday ? '✅' : '❌'}`);
                
            } else {
                console.log('❌ Mashable页面无法访问');
            }
            
        } catch (mashableError) {
            console.log(`❌ Mashable请求失败: ${mashableError.message}`);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 3. 检查KV中存储的数据时间戳
        console.log('⏰ 分析KV数据的时间信息...');
        
        const kvResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        if (kvResponse.ok) {
            const kvData = await kvResponse.json();
            
            if (kvData.timestamp) {
                const dataTime = new Date(kvData.timestamp);
                const now = new Date();
                const timeDiff = Math.floor((now - dataTime) / (1000 * 60)); // 分钟差
                
                console.log(`📊 KV数据时间戳: ${dataTime.toLocaleString()}`);
                console.log(`⏱️  距离现在: ${timeDiff} 分钟前`);
                console.log(`🔍 数据来源: ${kvData.source || '未知'}`);
                
                // 判断数据是否过时
                if (timeDiff > 60) {
                    console.log('⚠️  数据可能过时（超过1小时）');
                } else {
                    console.log('✅ 数据相对新鲜（1小时内）');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkRealTodayPuzzle().catch(console.error);