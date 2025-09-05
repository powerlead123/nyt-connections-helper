// 按照冒号分割的正确解析器
async function parseConnectionsAnswers() {
    console.log('=== 按冒号分割解析 ===');
    
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
        
        const answerSection = html.substring(startIndex + startMarker.length, endIndex);
        console.log('答案区域:', answerSection);
        
        // 按冒号分割，然后解析每个部分
        const groups = [];
        
        // 使用正则表达式找到所有 "文字:" 的模式
        const categoryPattern = /([^:]+?):\s*([^:]*?)(?=[A-Z][^:]*?:|$)/g;
        let match;
        
        while ((match = categoryPattern.exec(answerSection)) !== null) {
            const category = match[1].trim();
            const wordsText = match[2].trim();
            
            // 跳过空的或无效的匹配
            if (!category || !wordsText) continue;
            
            // 分割单词
            const words = wordsText.split(/,\s*/).filter(word => word.length > 0);
            
            // 只保留有4个单词的分组
            if (words.length === 4) {
                groups.push({
                    category: category,
                    words: words
                });
                
                console.log(`✅ 分组: ${category}`);
                console.log(`   单词: ${words.join(', ')}`);
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