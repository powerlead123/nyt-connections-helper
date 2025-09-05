// 修复分组名称边界的版本
async function fixedCategoryParser() {
    console.log('=== 修复分组名称边界 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 查找答案区域 - 保持原逻辑
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,1000}/i);
        
        if (!answerSectionMatch) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerSection = answerSectionMatch[0];
        answerSection = answerSection.replace(/What is the answer to Connections today/i, '');
        const dontIndex = answerSection.indexOf("Don't");
        if (dontIndex !== -1) {
            answerSection = answerSection.substring(0, dontIndex);
        }
        
        console.log('答案文本:', answerSection);
        
        // 找到所有冒号位置
        const colonPositions = [];
        for (let i = 0; i < answerSection.length; i++) {
            if (answerSection[i] === ':') {
                colonPositions.push(i);
            }
        }
        
        console.log(`找到 ${colonPositions.length} 个冒号:`, colonPositions);
        
        const groups = [];
        
        for (let i = 0; i < colonPositions.length && groups.length < 4; i++) {
            const colonPos = colonPositions[i];
            
            // 简化的分组名称提取
            let categoryStart = 0;
            
            if (i > 0) {
                const prevColonPos = colonPositions[i - 1];
                
                // 从上一个冒号后开始，查找4个单词的结束位置
                const textAfterPrevColon = answerSection.substring(prevColonPos + 1, colonPos);
                
                // 简单方法：按逗号分割，取前4个单词
                const parts = textAfterPrevColon.split(',');
                let wordsCount = 0;
                let wordsEndPos = prevColonPos + 1;
                
                for (const part of parts) {
                    if (wordsCount >= 4) break;
                    
                    const trimmed = part.trim();
                    if (trimmed && /^[A-Z]/.test(trimmed)) {
                        wordsCount++;
                        wordsEndPos += part.length + 1; // +1 for comma
                    } else {
                        wordsEndPos += part.length + 1;
                    }
                }
                
                // 从单词结束位置开始查找下一个分组名称
                categoryStart = wordsEndPos;
                
                // 跳过非字母字符
                while (categoryStart < colonPos && !/[A-Za-z]/.test(answerSection[categoryStart])) {
                    categoryStart++;
                }
            }
            
            // 提取分组名称
            const category = answerSection.substring(categoryStart, colonPos).trim();
            
            // 提取单词部分
            let wordsEnd = answerSection.length;
            if (i < colonPositions.length - 1) {
                wordsEnd = colonPositions[i + 1];
            }
            
            const wordsText = answerSection.substring(colonPos + 1, wordsEnd);
            
            // 提取4个单词
            const words = wordsText.split(',')
                .map(w => w.trim())
                .filter(w => w && /^[A-Z]/.test(w))
                .slice(0, 4);
            
            console.log(`\\n分组 ${i + 1}:`);
            console.log(`  开始位置: ${categoryStart}`);
            console.log(`  分组名称: "${category}"`);
            console.log(`  单词: ${words.join(', ')}`);
            
            if (category && words.length >= 4) {
                groups.push({
                    category: category,
                    words: words
                });
                console.log(`  ✅ 成功`);
            } else {
                console.log(`  ❌ 失败`);
            }
        }
        
        console.log(`\\n总共解析出 ${groups.length} 个分组`);
        
        if (groups.length >= 4) {
            const result = {
                date: new Date().toISOString().split('T')[0],
                groups: groups.slice(0, 4)
            };
            
            console.log('\\n🎉 最终结果:');
            console.log(JSON.stringify(result, null, 2));
            return result;
        }
        
        return null;
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

fixedCategoryParser();