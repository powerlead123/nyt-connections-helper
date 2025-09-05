// 工作的通用解析器 - 基于冒号位置的精确解析
async function workingUniversalParser() {
    console.log('=== 工作的通用解析器 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 查找答案区域
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,1000}/i);
        
        if (!answerSectionMatch) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerSection = answerSectionMatch[0];
        
        // 清理文本
        answerSection = answerSection.replace(/What is the answer to Connections today/i, '');
        const dontIndex = answerSection.indexOf("Don't");
        if (dontIndex !== -1) {
            answerSection = answerSection.substring(0, dontIndex);
        }
        
        console.log('清理后的文本:');
        console.log(`"${answerSection}"`);
        
        // 基于冒号位置的精确解析
        console.log('\n=== 基于冒号位置的精确解析 ===');
        
        // 找到所有冒号位置
        const colonPositions = [];
        for (let i = 0; i < answerSection.length; i++) {
            if (answerSection[i] === ':') {
                colonPositions.push(i);
            }
        }
        
        console.log(`找到 ${colonPositions.length} 个冒号位置:`, colonPositions);
        
        // 过滤掉明显不是分组的冒号（比如在URL中的）
        const validColonPositions = colonPositions.filter(pos => {
            const before = answerSection.substring(Math.max(0, pos - 50), pos);
            const after = answerSection.substring(pos + 1, Math.min(answerSection.length, pos + 100));
            
            // 检查冒号前后是否像分组格式
            const hasWordsAfter = /[A-Z]/.test(after);
            const hasReasonableBefore = before.length > 0 && before.length < 100;
            const notInUrl = !before.includes('http') && !after.includes('http');
            
            return hasWordsAfter && hasReasonableBefore && notInUrl;
        });
        
        console.log(`有效冒号位置: ${validColonPositions.length} 个:`, validColonPositions);
        
        const groups = [];
        
        for (let i = 0; i < validColonPositions.length && groups.length < 4; i++) {
            const colonPos = validColonPositions[i];
            
            // 确定分组名称的开始位置
            let categoryStart = 0;
            if (i > 0) {
                // 从上一个冒号后开始查找
                const prevColonPos = validColonPositions[i - 1];
                
                // 跳过上一组的单词，找到当前分组名称的开始
                let searchPos = prevColonPos + 1;
                
                // 查找连续的大写单词（上一组的答案）
                const afterPrevColon = answerSection.substring(searchPos, colonPos);
                
                // 使用正则找到4个大写单词的结束位置
                const wordsPattern = /^[^A-Z]*([A-Z][A-Z\s\-"',]*(?:,\s*[A-Z][A-Z\s\-"',]*){0,3})/;
                const wordsMatch = afterPrevColon.match(wordsPattern);
                
                if (wordsMatch) {
                    categoryStart = searchPos + wordsMatch[0].length;
                } else {
                    categoryStart = searchPos;
                }
                
                // 跳过空格和标点
                while (categoryStart < colonPos && /[\s,]/.test(answerSection[categoryStart])) {
                    categoryStart++;
                }
            }
            
            // 提取分组名称
            const category = answerSection.substring(categoryStart, colonPos).trim();
            
            // 确定单词区域的结束位置
            let wordsEnd = answerSection.length;
            if (i < validColonPositions.length - 1) {
                const nextColonPos = validColonPositions[i + 1];
                
                // 查找当前组单词的结束位置
                const wordsSection = answerSection.substring(colonPos + 1, nextColonPos);
                
                // 查找连续的大写单词模式
                const wordsPattern = /^[^A-Z]*([A-Z][A-Z\s\-"',]*?)(?=[A-Z][a-z]|$)/;
                const wordsMatch = wordsSection.match(wordsPattern);
                
                if (wordsMatch) {
                    wordsEnd = colonPos + 1 + wordsMatch[0].length;
                } else {
                    wordsEnd = nextColonPos;
                }
            }
            
            // 提取单词文本
            const wordsText = answerSection.substring(colonPos + 1, wordsEnd).trim();
            
            console.log(`\n分组 ${i + 1}:`);
            console.log(`  分组名称: "${category}"`);
            console.log(`  单词文本: "${wordsText}"`);
            
            // 解析单词
            const words = [];
            
            // 按逗号分割，然后清理
            const rawWords = wordsText.split(',');
            
            for (const rawWord of rawWords) {
                const cleanWord = rawWord.trim().toUpperCase();
                
                // 过滤有效的单词
                if (cleanWord.length > 0 && 
                    /^[A-Z\s\-"'0-9]+$/.test(cleanWord) && 
                    cleanWord.length < 30 && // 不要太长的"单词"
                    !cleanWord.includes('HTTP')) {
                    
                    words.push(cleanWord);
                    
                    if (words.length >= 4) break; // 只要4个单词
                }
            }
            
            // 验证结果
            if (category.length > 0 && category.length < 100 && words.length >= 4) {
                groups.push({
                    category: category,
                    words: words.slice(0, 4)
                });
                console.log(`  ✅ "${category}": ${words.slice(0, 4).join(', ')}`);
            } else {
                console.log(`  ❌ 无效 - 分组名称长度: ${category.length}, 单词数: ${words.length}`);
                console.log(`  分组名称: "${category}"`);
                console.log(`  单词: ${words.join(', ')}`);
            }
        }
        
        console.log(`\n总共解析出 ${groups.length} 个有效组`);
        
        if (groups.length >= 4) {
            console.log('\n🎉 解析成功！');
            
            const finalGroups = groups.slice(0, 4);
            finalGroups.forEach((group, i) => {
                console.log(`${i + 1}. "${group.category}": ${group.words.join(', ')}`);
            });
            
            // 生成最终结果
            const result = {
                date: '2025-09-02',
                words: finalGroups.flatMap(g => g.words),
                groups: finalGroups.map((group, index) => ({
                    theme: group.category,
                    words: group.words,
                    difficulty: ['yellow', 'green', 'blue', 'purple'][index],
                    hint: `These words are related to "${group.category}"`
                })),
                source: 'Mashable (Working Universal Parser)'
            };
            
            console.log('\n最终结果:');
            console.log(JSON.stringify(result, null, 2));
            
            return result;
        } else {
            console.log('\n❌ 解析失败，只找到', groups.length, '个有效组');
            return null;
        }
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

// 运行测试
workingUniversalParser();