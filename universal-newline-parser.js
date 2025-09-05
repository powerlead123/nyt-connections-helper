// 通用的Connections解析器 - 适用于任何日期
async function parseConnectionsAnswers() {
    console.log('=== 通用Connections解析器 ===');
    
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
        console.log('答案文本长度:', answerText.length);
        console.log('答案文本:', answerText.substring(0, 200) + '...');
        
        const groups = [];
        
        // 通用正则表达式：匹配 "任何文字: 大写单词, 大写单词, 大写单词, 大写单词" 的模式
        // 这个模式会匹配任何以冒号结尾的分组名称，后面跟着4个用逗号分隔的大写单词
        const universalPattern = /([^:]+?):\s*([A-Z][A-Z\s\-]*(?:,\s*[A-Z][A-Z\s\-]*){3})/g;
        
        let match;
        while ((match = universalPattern.exec(answerText)) !== null) {
            const category = match[1].trim();
            const wordsText = match[2].trim();
            
            // 分割单词
            const words = wordsText.split(/,\s*/).map(word => word.trim()).filter(word => word.length > 0);
            
            // 确保正好有4个单词
            if (words.length === 4) {
                groups.push({
                    category: category,
                    words: words
                });
                
                console.log(`✅ 分组: "${category}"`);
                console.log(`   单词: ${words.join(', ')}`);
            } else {
                console.log(`⚠️  跳过（单词数量不对）: "${category}" - ${words.length}个单词`);
            }
        }
        
        // 如果通用模式没找到足够的分组，尝试更宽松的模式
        if (groups.length < 4) {
            console.log('\\n=== 尝试更宽松的模式 ===');
            
            // 更宽松的模式：匹配任何包含冒号的行
            const loosePattern = /([^:]{3,50}):\s*([A-Z][^:]*?)(?=[A-Z][^:]*?:|$)/g;
            
            const tempGroups = [];
            let looseMatch;
            while ((looseMatch = loosePattern.exec(answerText)) !== null) {
                const category = looseMatch[1].trim();
                const wordsText = looseMatch[2].trim();
                
                // 分割单词
                const words = wordsText.split(/,\s*/).map(word => word.trim()).filter(word => word.length > 0);
                
                if (words.length >= 3 && words.length <= 5) {
                    tempGroups.push({
                        category: category,
                        words: words.slice(0, 4) // 只取前4个单词
                    });
                    
                    console.log(`🔍 候选分组: "${category}"`);
                    console.log(`   单词: ${words.slice(0, 4).join(', ')}`);
                }
            }
            
            // 如果宽松模式找到了更多分组，使用它们
            if (tempGroups.length > groups.length) {
                groups.length = 0; // 清空原有分组
                groups.push(...tempGroups);
            }
        }
        
        console.log(`\\n=== 解析完成，找到 ${groups.length} 个分组 ===`);
        
        const result = {
            date: new Date().toISOString().split('T')[0], // 使用当前日期
            groups: groups
        };
        
        console.log('\\n=== JSON结果 ===');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

parseConnectionsAnswers();