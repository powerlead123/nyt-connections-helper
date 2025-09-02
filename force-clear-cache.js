// 强制清除缓存并获取新数据
console.log('🧹 强制清除缓存并获取新数据...');

async function forceClearAndRefresh() {
    try {
        console.log('📅 当前日期: 2025-09-02');
        console.log('🌐 目标URL: https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025');
        
        console.log('\n🔍 检查Mashable是否有今天的文章...');
        
        // 使用代理检查URL是否存在
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025')}`;
        
        console.log('🌐 使用代理URL:', proxyUrl);
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            console.log(`❌ 代理请求失败: ${response.status}`);
            console.log('可能原因:');
            console.log('1. Mashable还没发布9月2日的文章');
            console.log('2. URL格式可能有变化');
            console.log('3. 网络连接问题');
            return;
        }
        
        const data = await response.json();
        const html = data.contents;
        
        if (!html || html.length < 1000) {
            console.log(`❌ HTML内容太短: ${html?.length || 0} 字符`);
            console.log('可能Mashable还没发布今天的文章');
            return;
        }
        
        console.log(`✅ 成功获取HTML: ${html.length} 字符`);
        
        // 检查是否包含Connections相关内容
        const hasConnections = html.toLowerCase().includes('connections');
        const hasAnswer = html.toLowerCase().includes('answer');
        const hasToday = html.toLowerCase().includes('today');
        
        console.log('\n📊 内容分析:');
        console.log('包含"connections":', hasConnections);
        console.log('包含"answer":', hasAnswer);
        console.log('包含"today":', hasToday);
        
        if (hasConnections && hasAnswer) {
            console.log('✅ 找到Connections相关内容');
            
            // 尝试解析
            const answerMatch = html.match(/What is the answer to Connections today[\s\S]{0,2000}/i);
            
            if (answerMatch) {
                console.log('✅ 找到答案部分');
                console.log('答案预览:', answerMatch[0].substring(0, 200));
                
                console.log('\n🎯 建议操作:');
                console.log('1. 访问网站: https://connections-helper-chinese.pages.dev/');
                console.log('2. 点击管理员界面的"刷新数据"按钮');
                console.log('3. 或者发送POST请求到: https://connections-helper-chinese.pages.dev/api/refresh');
                
            } else {
                console.log('❌ 未找到标准答案格式');
                console.log('HTML可能使用了不同的格式');
                
                // 显示HTML片段用于调试
                console.log('\nHTML片段 (前1000字符):');
                console.log(html.substring(0, 1000));
            }
            
        } else {
            console.log('❌ 未找到Connections相关内容');
            console.log('可能这不是正确的文章页面');
        }
        
    } catch (error) {
        console.error('❌ 操作失败:', error.message);
        
        console.log('\n🔄 备选方案:');
        console.log('1. 等待几小时后再试 (Mashable通常在美国时间发布)');
        console.log('2. 手动检查Mashable网站是否有新文章');
        console.log('3. 使用网站的手动刷新功能');
    }
}

forceClearAndRefresh();