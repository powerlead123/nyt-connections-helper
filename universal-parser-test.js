// 通用解析器测试
async function testUniversalParser() {
    console.log('=== 测试通用解析器 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,2000}/i);
        
        if (!answerSectionMatch) {
            console.log('❌ 未找到答案区域');
            return;
        }
        
        const answerSection = answerSectionMatch[0];
        console.log('答案区域内容:');
        console.log(answerSection.substring(0, 400));
        
        // 通用解析策略
        console.log('\n=== 通用解析策略 ===');
        
        // 策略1: 查找所有 [文本]: [大写单词列表] 的模式
        const colonPattern = /([^:]+?):\s*([A-Z][^:]*?)(?=[A-Z][^:]*?:|Don't|$)/g;
        const colonMatches = [...answerSection.matchAll(colonPattern)];
        
        console.log(`策略1 - 冒号模式找到 ${colonMatches.length} 个匹配:`);
        const groups1 = [];
        
        for (const match of colonMatches) {
            const category = match[1].trim().replace(/^What is the answer to Connections today/, '');
            const wordsText = match[2].trim();
            
            if (category.length > 0 && wordsText.length > 0) {
                const words = wordsText
                    .split(',')
                    .map(w => w.trim().toUpperCase())
                    .filter(w => w.length > 0 && /^[A-Z\s\-"']+$/.test(w));
                
                if (words.length >= 3) { // 至少3个单词
                    groups1.push({ category, words: words.slice(0, 4) });
                    console.log(`  "${category}": ${words.slice(0, 4).join(', ')}`);
                }
            }
        }
        
        // 策略2: 手动分割文本，查找模式
        console.log('\n策略2 - 手动分割:');
        const cleanText = answerSection.replace(/What is the answer to Connections today/i, '');
        
        // 查找所有大写单词
        const allWords = cleanText.match(/\b[A-Z]{2,}[A-Z\s\-"']*\b/g) || [];
        console.log(`找到 ${allWords.length} 个大写单词:`, allWords.slice(0, 20));
        
        // 查找冒号位置来分割组
        const colonPositions = [];
        let pos = 0;
        while ((pos = cleanText.indexOf(':', pos + 1)) !== -1) {
            colonPositions.push(pos);
        }
        console.log(`找到 ${colonPositions.length} 个冒号位置:`, colonPositions);
        
        // 策略3: 基于已知的单词数量（16个）来推断分组
        if (allWords.length >= 16) {
            console.log('\n策略3 - 基于单词数量推断:');
            
            // 尝试找到分组边界
            const potentialGroups = [];
            let currentGroup = [];
            let currentCategory = '';
            
            for (let i = 0; i < allWords.length; i++) {
                const word = allWords[i];
                
                // 如果当前组已有4个单词，开始新组
                if (currentGroup.length === 4) {
                    if (currentCategory) {
                        potentialGroups.push({
                            category: currentCategory,
                            words: [...currentGroup]
                        });
                    }
                    currentGroup = [];
                    currentCategory = '';
                }
                
                // 检查这个单词是否可能是分组名称的一部分
                const nextColon = cleanText.indexOf(':', cleanText.indexOf(word));
                const prevColon = cleanText.lastIndexOf(':', cleanText.indexOf(word));
                
                if (nextColon !== -1 && nextColon - cleanText.indexOf(word) < 50) {
                    // 可能是分组名称
                    if (!currentCategory) {
                        currentCategory = word;
                    }
                } else if (currentCategory && currentGroup.length < 4) {
                    // 可能是答案单词
                    currentGroup.push(word);
                }
            }
            
            // 添加最后一组
            if (currentGroup.length === 4 && currentCategory) {
                potentialGroups.push({
                    category: currentCategory,
                    words: [...currentGroup]
                });
            }
            
            console.log(`推断出 ${potentialGroups.length} 个组:`);
            potentialGroups.forEach((group, i) => {
                console.log(`  ${i+1}. "${group.category}": ${group.words.join(', ')}`);
            });
        }
        
        // 选择最佳结果
        const bestResult = groups1.length === 4 ? groups1 : 
                          (groups1.length > 0 ? groups1 : []);
        
        console.log(`\n最佳结果: ${bestResult.length} 个组`);
        
        if (bestResult.length >= 4) {
            console.log('🎉 解析成功!');
            bestResult.slice(0, 4).forEach((group, i) => {
                console.log(`${i+1}. ${group.category}: ${group.words.join(', ')}`);
            });
        } else {
            console.log('❌ 解析失败');
        }
        
    } catch (error) {
        console.error('测试出错:', error);
    }
}

testUniversalParser();