// 简单的正则表达式解析器
async function parseConnectionsAnswers() {
    console.log('=== 简单正则解析 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 找到答案区域
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerText = html.substring(startIndex + startMarker.length, endIndex);
        
        // 清理文本
        answerText = answerText.replace(/\\"/g, '"').trim();
        console.log('答案文本:', answerText);
        
        const groups = [];
        
        // 使用正则表达式匹配每个分组
        // 模式: 分组名称: 单词1, 单词2, 单词3, 单词4
        const patterns = [
            {
                name: 'Curses',
                regex: /Curses:\s*([A-Z\-\s,]+?)(?=In\s*")/
            },
            {
                name: 'In "A visit from St. Nicholas"',
                regex: /In\s*"A visit from St\. Nicholas":\s*([A-Z\-\s,]+?)(?=Worn\s*by)/
            },
            {
                name: 'Worn by Earring Magic Ken',
                regex: /Worn by Earring Magic Ken:\s*([A-Z\-\s,]+?)(?=Starting\s*with)/
            },
            {
                name: 'Starting with possessive determiners',
                regex: /Starting with possessive determiners:\s*([A-Z\-\s,]+?)(?=Don't|$)/
            }
        ];
        
        for (const pattern of patterns) {
            const match = answerText.match(pattern.regex);
            if (match) {
                const wordsText = match[1].trim();
                const words = wordsText.split(/,\s*/).filter(word => word.trim().length > 0);
                
                groups.push({
                    category: pattern.name,
                    words: words
                });
                
                console.log(`✅ ${pattern.name}: ${words.join(', ')}`);
            } else {
                console.log(`❌ 未找到: ${pattern.name}`);
            }
        }
        
        console.log(`\n=== 解析完成，找到 ${groups.length} 个分组 ===`);
        
        const result = {
            date: '2024-09-02',
            groups: groups
        };
        
        console.log('\n=== JSON结果 ===');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

parseConnectionsAnswers();