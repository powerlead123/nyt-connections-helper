// 查找正确的Mashable URL格式
async function findCorrectUrl() {
    console.log('🔍 查找正确的Mashable URL格式...\n');
    
    // 尝试不同的日期格式
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();
    const year = today.getFullYear();
    
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthName = monthNames[today.getMonth()];
    
    // 不同的URL格式
    const urlFormats = [
        // 标准格式
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/connections-hint-answer-today-${monthName}-${day}-${year}`,
        
        // 数字月份格式
        `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-${month}-${day}-${year}`,
        
        // 带零的格式
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day.toString().padStart(2, '0')}-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day.toString().padStart(2, '0')}-${year}`,
        
        // 简化格式
        `https://mashable.com/article/connections-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-${monthName}-${day}-${year}`,
        
        // 今天特殊格式
        `https://mashable.com/article/nyt-connections-today-${monthName}-${day}`,
        `https://mashable.com/article/connections-today-${monthName}-${day}`,
    ];
    
    console.log(`测试日期: ${monthName} ${day}, ${year}`);
    console.log('测试URL格式:');
    urlFormats.forEach((url, i) => console.log(`${i+1}. ${url.split('/').pop()}`));
    
    for (let i = 0; i < urlFormats.length; i++) {
        const url = urlFormats[i];
        console.log(`\\n🌐 测试 ${i+1}: ${url.split('/').pop()}`);
        
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            
            console.log(`  状态: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                const html = data.contents;
                
                console.log(`  HTML长度: ${html?.length || 0}`);
                
                if (html && html.length > 1000) {
                    // 检查是否是错误页面
                    const isError = html.includes('error_404') || html.includes('Page not found');
                    const hasConnections = html.toLowerCase().includes('connections');
                    const hasAnswer = html.toLowerCase().includes('answer');
                    const hasToday = html.toLowerCase().includes('today');
                    
                    console.log(`  错误页面: ${isError}`);
                    console.log(`  包含connections: ${hasConnections}`);
                    console.log(`  包含answer: ${hasAnswer}`);
                    console.log(`  包含today: ${hasToday}`);
                    
                    if (!isError && hasConnections && hasAnswer) {
                        console.log('  ✅ 找到有效页面！');
                        
                        // 查找标题
                        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
                        if (titleMatch) {
                            console.log(`  标题: ${titleMatch[1]}`);
                        }
                        
                        // 查找文章内容
                        const articleMatch = html.match(/<article[^>]*>[\s\S]*?<\/article>/i);
                        if (articleMatch) {
                            console.log('  找到文章内容');
                            const articleHtml = articleMatch[0];
                            
                            // 查找颜色提示
                            const colorPatterns = [
                                /(Yellow|Green|Blue|Purple):\s*([^\n<]+)/gi,
                                /(Yellow|Green|Blue|Purple)\s*:\s*<[^>]*>([^<]+)</gi,
                                /(Yellow|Green|Blue|Purple)[^:]*:\s*([^\n<]+)/gi
                            ];
                            
                            for (const pattern of colorPatterns) {
                                const matches = [...articleHtml.matchAll(pattern)];
                                if (matches.length > 0) {
                                    console.log('  🎯 找到颜色提示:');
                                    matches.forEach(match => {
                                        console.log(`    ${match[1]}: ${match[2].trim()}`);
                                    });
                                    break;
                                }
                            }
                        }
                        
                        return { success: true, url, html };
                    }
                } else {
                    console.log('  ❌ HTML内容太短');
                }
            } else {
                console.log(`  ❌ HTTP错误: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`  ❌ 请求失败: ${error.message}`);
        }
    }
    
    console.log('\\n❌ 没有找到有效的URL');
    return { success: false };
}

findCorrectUrl().catch(console.error);