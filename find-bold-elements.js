// 查找所有可能的加粗元素
async function findBoldElements() {
    console.log('=== 查找加粗元素 ===');
    
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
            return;
        }
        
        const answerSection = html.substring(startIndex, startIndex + 2000);
        
        // 查找包含我们已知分组名称的HTML标签
        const knownCategories = ['Curses', 'St. Nicholas', 'Earring Magic Ken', 'possessive determiners'];
        
        console.log('\\n=== 查找包含分组名称的HTML标签 ===');
        
        for (const category of knownCategories) {
            const index = answerSection.indexOf(category);
            if (index !== -1) {
                // 查找这个分组名称周围的HTML标签
                const before = answerSection.substring(Math.max(0, index - 100), index);
                const after = answerSection.substring(index, Math.min(answerSection.length, index + 200));
                
                console.log(`\\n找到分组 "${category}":`);
                console.log(`前文: ...${before.substring(before.length - 50)}`);
                console.log(`后文: ${after.substring(0, 100)}...`);
                
                // 查找可能的标签
                const tagMatch = before.match(/<([^>\s]+)[^>]*>\s*$/);
                if (tagMatch) {
                    console.log(`可能的开始标签: <${tagMatch[1]}>`);
                }
            }
        }
        
        // 查找所有可能的加粗相关标签和类
        console.log('\\n=== 查找所有可能的加粗标签 ===');
        
        const boldPatterns = [
            /<strong[^>]*>.*?<\/strong>/gi,
            /<b[^>]*>.*?<\/b>/gi,
            /<span[^>]*class[^>]*bold[^>]*>.*?<\/span>/gi,
            /<div[^>]*class[^>]*bold[^>]*>.*?<\/div>/gi,
            /<p[^>]*class[^>]*bold[^>]*>.*?<\/p>/gi,
            /<h[1-6][^>]*>.*?<\/h[1-6]>/gi
        ];
        
        for (let i = 0; i < boldPatterns.length; i++) {
            const matches = answerSection.match(boldPatterns[i]) || [];
            if (matches.length > 0) {
                console.log(`\\n模式 ${i + 1} 找到 ${matches.length} 个匹配:`);
                matches.forEach((match, j) => {
                    const text = match.replace(/<[^>]*>/g, '');
                    console.log(`  ${j + 1}. "${text}"`);
                });
            }
        }
        
        // 查找包含冒号的任何标签
        console.log('\\n=== 查找包含冒号的标签 ===');
        const colonTags = answerSection.match(/<[^>]+>[^<]*:[^<]*<\/[^>]+>/gi) || [];
        colonTags.forEach((tag, i) => {
            const text = tag.replace(/<[^>]*>/g, '');
            console.log(`${i + 1}. "${text}"`);
        });
        
    } catch (error) {
        console.error('查找出错:', error);
    }
}

findBoldElements();