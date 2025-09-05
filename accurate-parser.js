// 修复分组名称边界检测的准确解析器
async function accurateParser() {
    console.log('=== 准确的通用解析器 ===');
    
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
        
        // 找到所有冒号位置
        const colonPositions = [];
        for (let i = 0; i < answerSection.length; i++) {
            if (answerSection[i] === ':') {
                colonPositions.push(i);
            }
        }
        
        console.log(`\\n找到 ${colonPositions.length} 个冒号位置:`, colonPositions);
        
        const groups = [];
        
        for (let i = 0; i < colonPositions.length && groups.length < 4; i++) {
            const colonPos = colonPositions[i];
            
            // 改进的分组名称提取逻辑
            let categoryStart = 0;
            
            if (i > 0) {
                const prevColonPos = colonPositions[i - 1];
                
                // 从上一个冒号后开始，跳过单词部分
                let searchStart = prevColonPos + 1;
                
                // 查找4个大写单词的模式（每组的答案）
                const afterPrevColon = answerSection.substring(searchStart, colonPos);
                
                // 匹配4个用逗号分隔的大写单词
                const fourWordsPattern = /^[^A-Z]*([A-Z][A-Z\s\-"']*(?:,\s*[A-Z][A-Z\s\-"']*){0,3})/;
                const wordsMatch = afterPrevColon.match(fourWordsPattern);
                
                if (wordsMatch) {
                    // 跳过这4个单词
                    categoryStart = searchStart + wordsMatch[0].length;
                    
                    // 继续跳过非字母字符，直到找到下一个分组名称的开始
                    while (categoryStart < colonPos && !/[A-Za-z]/.test(answerSection[categoryStart])) {
                        categoryStart++;
                    }
                } else {
                    categoryStart = searchStart;
                }
            }
            
            // 提取分组名称 - 从categoryStart到冒号
            const category = answerSection.substring(categoryStart, colonPos).trim();
            
            // 提取单词部分
            let wordsEnd = answerSection.length;
            if (i < colonPositions.length - 1) {
                wordsEnd = colonPositions[i + 1];
                
                // 向前查找，只包含单词部分
                const wordsSection = answerSection.substring(colonPos + 1, wordsEnd);
                
                // 查找4个单词的结束位置
                const fourWordsPattern = /^[^A-Z]*([A-Z][A-Z\s\-"']*(?:,\s*[A-Z][A-Z\s\-"']*){0,3})/;
                const wordsMatch = wordsSection.match(fourWordsPattern);
                
                if (wordsMatch) {
                    wordsEnd = colonPos + 1 + wordsMatch[0].length;
                }
            }
            
            const wordsText = answerSection.substring(colonPos + 1, wordsEnd).trim();
            
            console.log(`\\n分组 ${i + 1}:`);
            console.log(`  冒号位置: ${colonPos}`);
            console.log(`  分组开始: ${categoryStart}`);
            console.log(`  分组名称: "${category}"`);
            console.log(`  单词文本: "${wordsText}"`);
            
            // 解析单词
            const words = wordsText.split(',')
                .map(word => word.trim())
                .filter(word => word.length > 0 && /^[A-Z]/.test(word))
                .slice(0, 4);
            
            // 验证结果
            if (category.length > 0 && category.length < 100 && words.length >= 3) {
                groups.push({
                    category: category,
                    words: words
                });
                console.log(`  ✅ "${category}": ${words.join(', ')}`);
            } else {
                console.log(`  ❌ 无效 - 分组名称长度: ${category.length}, 单词数: ${words.length}`);
            }
        }
        
        console.log(`\\n总共解析出 ${groups.length} 个有效组`);
        
        if (groups.length >= 4) {
            console.log('\\n🎉 解析成功！');
            
            const finalGroups = groups.slice(0, 4);
            finalGroups.forEach((group, i) => {
                console.log(`${i + 1}. "${group.category}": ${group.words.join(', ')}`);
            });
            
            const result = {
                date: new Date().toISOString().split('T')[0],
                groups: finalGroups
            };
            
            console.log('\\n最终结果:');
            console.log(JSON.stringify(result, null, 2));
            
            return result;
        } else {
            console.log('\\n❌ 解析失败，只找到', groups.length, '个有效组');
            return null;
        }
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

accurateParser();