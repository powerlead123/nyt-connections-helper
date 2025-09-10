// 检查实际的HTML格式
async function checkHtmlFormat() {
    console.log('检查实际HTML格式');
    
    try {
        const today = new Date();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[today.getMonth()];
        const day = today.getDate();
        const year = today.getFullYear();
        
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(15000)
        });
        
        const html = await response.text();
        console.log('HTML长度:', html.length);
        
        // 查找包含"Shame on you"的部分
        const shameIndex = html.indexOf('Shame on you');
        if (shameIndex !== -1) {
            console.log('找到"Shame on you"位置:', shameIndex);
            
            // 获取前后的上下文
            const start = Math.max(0, shameIndex - 200);
            const end = Math.min(html.length, shameIndex + 500);
            const context = html.substring(start, end);
            
            console.log('上下文:');
            console.log(context);
            
            // 查找所有包含答案的段落
            const answerParagraphs = html.match(/<p[^>]*>.*?(yellow|green|blue|purple).*?<\/p>/gi) || [];
            console.log(`\\n找到 ${answerParagraphs.length} 个包含颜色的段落:`);
            
            answerParagraphs.slice(0, 10).forEach((para, i) => {
                console.log(`${i + 1}. ${para.substring(0, 150)}...`);
            });
        } else {
            console.log('未找到"Shame on you"');
        }
        
    } catch (error) {
        console.error('错误:', error);
    }
}

checkHtmlFormat();