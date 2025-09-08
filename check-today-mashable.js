// 检查今天的Mashable文章是否存在
async function checkTodayMashable() {
    console.log('🔍 检查今天(9月8日)的Mashable文章...');
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const day = today.getDate();
    
    console.log(`今天: ${year}年${month} ${day}日`);
    
    const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`;
    console.log(`URL: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log(`状态: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const html = await response.text();
            console.log(`HTML长度: ${html.length} 字符`);
            
            // 检查关键内容
            const hasConnections = html.toLowerCase().includes('connections');
            const hasToday = html.toLowerCase().includes('today');
            const hasAnswer = html.toLowerCase().includes('answer');
            const hasHints = html.includes("Today's connections fall into the following categories:");
            const hasAnswerSection = html.includes('What is the answer to Connections today');
            
            console.log('\n内容检查:');
            console.log(`包含'connections': ${hasConnections}`);
            console.log(`包含'today': ${hasToday}`);
            console.log(`包含'answer': ${hasAnswer}`);
            console.log(`包含提示区域: ${hasHints}`);
            console.log(`包含答案区域: ${hasAnswerSection}`);
            
            if (hasHints && hasAnswerSection) {
                console.log('\n✅ 文章结构完整，可以解析');
                
                // 尝试提取提示
                const correctHintMatch = html.match(/Today's connections fall into the following categories:(.*?)(?=Looking|Ready|$)/i);
                if (correctHintMatch) {
                    console.log('\n提示区域内容:');
                    console.log(correctHintMatch[1].substring(0, 500) + '...');
                }
                
                // 尝试提取答案区域
                const startMarker = 'What is the answer to Connections today';
                const endMarker = "Don't feel down if you didn't manage to guess it this time";
                
                const startIndex = html.indexOf(startMarker);
                const endIndex = html.indexOf(endMarker, startIndex);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    const answerSection = html.substring(startIndex, endIndex);
                    console.log('\n答案区域内容:');
                    console.log(answerSection.substring(0, 500) + '...');
                }
                
            } else {
                console.log('\n❌ 文章结构不完整，无法解析');
            }
            
        } else {
            console.log('\n❌ 文章不存在或无法访问');
            const errorText = await response.text();
            console.log('错误内容:', errorText.substring(0, 200));
        }
        
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

checkTodayMashable();