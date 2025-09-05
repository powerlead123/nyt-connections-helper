// 基于加粗文本的解析器
async function parseConnectionsAnswers() {
    console.log('=== 基于加粗文本解析 ===');
    
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
        const startIndex = html.indexOf(startMarker);
        
        if (startIndex === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        // 提取答案区域（从标题开始的2000字符应该足够）
        const answerSection = html.substring(startIndex, startIndex + 2000);
        console.log('答案区域长度:', answerSection.length);
        
        // 查找所有加粗标签
        console.log('\\n=== 查找加粗标签 ===');
        
        // 查找 <strong> 标签
        const strongMatches = answerSection.match(/<strong[^>]*>(.*?)<\/strong>/gi) || [];
        console.log(`找到 ${strongMatches.length} 个 <strong> 标签:`);
        strongMatches.forEach((match, i) => {
            const text = match.replace(/<[^>]*>/g, '');
            console.log(`${i + 1}. "${text}"`);
        });
        
        // 查找 <b> 标签
        const bMatches = answerSection.match(/<b[^>]*>(.*?)<\/b>/gi) || [];
        console.log(`\\n找到 ${bMatches.length} 个 <b> 标签:`);
        bMatches.forEach((match, i) => {
            const text = match.replace(/<[^>]*>/g, '');
            console.log(`${i + 1}. "${text}"`);
        });
        
        // 合并所有加粗文本
        const allBoldTexts = [...strongMatches, ...bMatches].map(match => 
            match.replace(/<[^>]*>/g, '').trim()
        );
        
        console.log(`\\n=== 所有加粗文本 ===`);
        allBoldTexts.forEach((text, i) => {
            console.log(`${i + 1}. "${text}"`);
        });
        
        // 查找包含冒号的加粗文本（这些应该是分组名称）
        const categoryTexts = allBoldTexts.filter(text => text.includes(':'));
        console.log(`\\n=== 包含冒号的加粗文本（分组名称）===`);
        categoryTexts.forEach((text, i) => {
            console.log(`${i + 1}. "${text}"`);
        });
        
        // 解析分组
        const groups = [];
        
        for (const categoryText of categoryTexts) {
            const colonIndex = categoryText.indexOf(':');
            if (colonIndex === -1) continue;
            
            const category = categoryText.substring(0, colonIndex).trim();
            const wordsText = categoryText.substring(colonIndex + 1).trim();
            
            if (wordsText) {
                const words = wordsText.split(/,\s*/).filter(w => w.length > 0);
                
                groups.push({
                    category: category,
                    words: words
                });
                
                console.log(`\\n✅ 分组: ${category}`);
                console.log(`   单词: ${words.join(', ')}`);
            }
        }
        
        console.log(`\\n=== 解析完成，找到 ${groups.length} 个分组 ===`);
        
        const result = {
            date: '2024-09-02',
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