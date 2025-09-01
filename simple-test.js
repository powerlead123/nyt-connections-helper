console.log('测试开始...');

async function simpleTest() {
    try {
        console.log('正在测试fetch...');
        
        // 尝试多种URL格式
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // 月份名称映射
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const monthName = monthNames[today.getMonth()];
        
        const urls = [
            // 月份名称格式 (你看到的格式)
            `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${parseInt(day)}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${parseInt(day)}-${year}`,
            `https://mashable.com/article/connections-hint-answer-today-${monthName}-${parseInt(day)}-${year}`,
            // 数字格式
            `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${month}-${day}-${year}`,
            `https://mashable.com/article/nyt-connections-hint-answer-today-${parseInt(month)}-${parseInt(day)}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${parseInt(month)}-${parseInt(day)}-${year}`
        ];
        
        console.log(`今天日期: ${year}-${month}-${day} (${monthName})`);
        
        for (let i = 0; i < urls.length; i++) {
            const testUrl = urls[i];
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`;
            
            console.log(`\n尝试URL ${i + 1}:`, testUrl);
            
            try {
                const response = await fetch(proxyUrl);
                console.log('响应状态:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('HTTP状态码:', data.status?.http_code);
                    console.log('HTML长度:', data.contents ? data.contents.length : 0);
                    
                    if (data.status?.http_code === 200 && data.contents) {
                        console.log('✅ 找到有效URL!');
                        const html = data.contents;
                        
                        // 基本检查
                        console.log('包含connections:', html.toLowerCase().includes('connections'));
                        console.log('包含answer:', html.toLowerCase().includes('answer'));
                        console.log('包含green:', html.toLowerCase().includes('green'));
                        console.log('包含yellow:', html.toLowerCase().includes('yellow'));
                        console.log('包含blue:', html.toLowerCase().includes('blue'));
                        console.log('包含purple:', html.toLowerCase().includes('purple'));
                        
                        // 显示HTML片段
                        console.log('\nHTML预览:');
                        console.log(html.substring(0, 800));
                        
                        break; // 找到有效URL就停止
                    } else {
                        console.log('❌ URL无效 (404或无内容)');
                    }
                }
            } catch (error) {
                console.log('❌ 请求失败:', error.message);
            }
        }

        
    } catch (error) {
        console.error('错误:', error.message);
    }
}

simpleTest();