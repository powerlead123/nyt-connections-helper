// 修复分组名称解析
async function fixCategoryParsing() {
    console.log('=== 修复分组名称解析 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,1500}/i);
        
        if (!answerSectionMatch) {
            console.log('❌ 未找到答案区域');
            return;
        }
        
        let answerSection = answerSectionMatch[0];
        answerSection = answerSection.replace(/What is the answer to Connections today/i, '');
        
        console.log('原始文本:');
        console.log(answerSection.substring(0, 300));
        
        // 新的解析策略：直接查找冒号，然后向前回溯找完整的分组名称
        console.log('\n=== 新的解析策略 ===');
        
        // 找到所有冒号的位置
        const colonPositions = [];
        for (let i = 0; i < answerSection.length; i++) {
            if (answerSection[i] === ':') {
                colonPositions.push(i);
            }
        }
        
        console.log(`找到 ${colonPositions.length} 个冒号位置:`, colonPositions);
        
        const groups = [];
        
        for (let i = 0; i < colonPositions.length; i++) {
            const colonPos = colonPositions[i];
            
            // 向前查找分组名称的开始位置
            let categoryStart = 0;
            if (i > 0) {
                // 从上一个组的结束位置开始查找
                const prevColonPos = colonPositions[i - 1];
                
                // 找到上一个组的单词结束位置（通常是大写单词后面）
                let searchStart = prevColonPos + 1;
                
                // 跳过上一个组的单词部分，找到下一个分组名称的开始
                const afterPrevColon = answerSection.substring(searchStart, colonPos);
                
                // 查找最后一个大写单词的结束位置
                const lastWordMatch = afterPrevColon.match(/.*[A-Z][A-Z\s\-"']*([A-Z]|G)/);
                if (lastWordMatch) {
                    categoryStart = searchStart + lastWordMatch[0].length;
                    
                    // 跳过可能的空格和标点
                    while (categoryStart < colonPos && /[\s,]/.test(answerSection[categoryStart])) {
                        categoryStart++;
                    }
                } else {
                    categoryStart = searchStart;
                }
            }
            
            // 提取分组名称
            const category = answerSection.substring(categoryStart, colonPos).trim();
            
            // 提取单词部分
            let wordsEnd = answerSection.length;
            if (i < colonPositions.length - 1) {
                // 找到下一个分组名称的开始位置
                const nextColonPos = colonPositions[i + 1];
                const afterColon = answerSection.substring(colonPos + 1, nextColonPos);
                
                // 查找单词部分的结束（通常是最后一个大写单词）
                const wordsMatch = afterColon.match(/^[^A-Z]*([A-Z][A-Z\s\-"',]*)/);
                if (wordsMatch) {
                    wordsEnd = colonPos + 1 + wordsMatch[0].length;
                } else {
                    wordsEnd = nextColonPos;
                }
            } else {
                // 最后一个组，找到Don't或文本结束
                const remaining = answerSection.substring(colonPos + 1);
                const endMatch = remaining.match(/^[^D]*(?=Don't|$)/);
                if (endMatch) {
                    wordsEnd = colonPos + 1 + endMatch[0].length;
                }
            }
            
            const wordsText = answerSection.substring(colonPos + 1, wordsEnd).trim();
            
            console.log(`\n分组 ${i + 1}:`);
            console.log(`  位置: ${categoryStart}-${colonPos} (分组名称)`);
            console.log(`  分组名称: "${category}"`);
            console.log(`  单词文本: "${wordsText.substring(0, 50)}"`);
            
            // 提取单词
            const words = wordsText
                .split(',')
                .map(w => w.trim().toUpperCase())
                .filter(w => w.length > 0 && /^[A-Z\s\-"']+$/.test(w))
                .slice(0, 4);
            
            if (category.length > 0 && words.length >= 4) {
                groups.push({ category, words });
                console.log(`  ✅ "${category}": ${words.join(', ')}`);
            } else {
                console.log(`  ❌ 无效: 分组名称长度=${category.length}, 单词数=${words.length}`);
            }
        }
        
        console.log(`\n总共解析出 ${groups.length} 个组`);
        
        if (groups.length >= 4) {
            console.log('\n🎉 分组名称解析成功！');
            groups.slice(0, 4).forEach((group, i) => {
                console.log(`${i + 1}. "${group.category}": ${group.words.join(', ')}`);
            });
        } else {
            console.log('\n❌ 分组名称解析失败');
        }
        
    } catch (error) {
        console.error('测试出错:', error);
    }
}

fixCategoryParsing();