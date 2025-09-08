// 完整测试today.js的working-universal-parser逻辑
async function completeTestToday() {
    console.log('🧪 完整测试today.js的working-universal-parser逻辑...');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-8-2025';
        console.log(`URL: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        console.log(`HTML长度: ${html.length}`);
        
        // 完整执行working-universal-parser逻辑
        const result = await workingUniversalParser(html);
        
        if (result && result.groups && result.groups.length === 4) {
            console.log('\n✅ 解析完全成功！');
            
            // 验证数据结构
            console.log('\n📋 解析结果验证:');
            console.log(`单词总数: ${result.words.length}`);
            console.log(`分组数量: ${result.groups.length}`);
            
            // 显示每个分组
            result.groups.forEach((group, i) => {
                const emoji = group.difficulty === 'yellow' ? '🟡' : 
                             group.difficulty === 'green' ? '🟢' : 
                             group.difficulty === 'blue' ? '🔵' : '🟣';
                console.log(`${emoji} ${group.theme}: ${group.words.join(', ')}`);
                
                // 验证每个分组的数据完整性
                if (!group.theme || !group.words || group.words.length !== 4 || !group.difficulty || !group.hint) {
                    console.log(`❌ 分组 ${i+1} 数据不完整`);
                    return false;
                }
            });
            
            // 验证所有单词
            const allGroupWords = result.groups.flatMap(g => g.words);
            const uniqueWords = [...new Set(allGroupWords)];
            
            console.log('\n📊 数据完整性验证:');
            console.log(`分组中单词总数: ${allGroupWords.length}`);
            console.log(`唯一单词数: ${uniqueWords.length}`);
            console.log(`words数组长度: ${result.words.length}`);
            
            // 检查是否有重复单词
            if (uniqueWords.length !== allGroupWords.length) {
                console.log('❌ 发现重复单词');
                return false;
            }
            
            // 检查words数组是否与分组中的单词一致
            const wordsFromGroups = result.groups.flatMap(g => g.words).sort();
            const wordsArray = [...result.words].sort();
            
            if (JSON.stringify(wordsFromGroups) !== JSON.stringify(wordsArray)) {
                console.log('❌ words数组与分组单词不一致');
                console.log('分组单词:', wordsFromGroups);
                console.log('words数组:', wordsArray);
                return false;
            }
            
            // 检查难度级别
            const expectedDifficulties = ['yellow', 'green', 'blue', 'purple'];
            const actualDifficulties = result.groups.map(g => g.difficulty);
            
            if (JSON.stringify(expectedDifficulties) !== JSON.stringify(actualDifficulties)) {
                console.log('❌ 难度级别不正确');
                console.log('期望:', expectedDifficulties);
                console.log('实际:', actualDifficulties);
                return false;
            }
            
            console.log('✅ 所有验证通过！');
            
            // 模拟API响应格式
            const apiResponse = {
                date: new Date().toISOString().split('T')[0],
                words: result.words,
                groups: result.groups
            };
            
            console.log('\n📤 API响应格式:');
            console.log(JSON.stringify(apiResponse, null, 2));
            
            return true;
            
        } else {
            console.log('❌ 解析失败或结果不完整');
            console.log('结果:', result);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        return false;
    }
}

// working-universal-parser逻辑（完全复制）
async function workingUniversalParser(html) {
    try {
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
        
        console.log(`找到 ${colonPositions.length} 个冒号位置`);
        
        // 过滤有效冒号
        const validColonPositions = colonPositions.filter(pos => {
            const before = answerSection.substring(Math.max(0, pos - 50), pos);
            const after = answerSection.substring(pos + 1, Math.min(answerSection.length, pos + 100));
            
            const hasWordsAfter = /[A-Z]/.test(after);
            const hasReasonableBefore = before.length > 0 && before.length < 100;
            const notInUrl = !before.includes('http') && !after.includes('http');
            
            return hasWordsAfter && hasReasonableBefore && notInUrl;
        });
        
        console.log(`有效冒号位置: ${validColonPositions.length} 个`);
        
        const groups = [];
        
        for (let i = 0; i < validColonPositions.length && groups.length < 4; i++) {
            const colonPos = validColonPositions[i];
            
            // 确定分组名称的开始位置
            let categoryStart = 0;
            if (i > 0) {
                const prevColonPos = validColonPositions[i - 1];
                let searchPos = prevColonPos + 1;
                
                const afterPrevColon = answerSection.substring(searchPos, colonPos);
                const wordsPattern = /^[^A-Z]*([A-Z][A-Z\s\-"',]*(?:,\s*[A-Z][A-Z\s\-"',]*){0,3})/;
                const wordsMatch = afterPrevColon.match(wordsPattern);
                
                if (wordsMatch) {
                    categoryStart = searchPos + wordsMatch[0].length;
                } else {
                    categoryStart = searchPos;
                }
                
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
                const wordsSection = answerSection.substring(colonPos + 1, nextColonPos);
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
            const rawWords = wordsText.split(',');
            
            for (const rawWord of rawWords) {
                const cleanWord = rawWord.trim().toUpperCase();
                
                if (cleanWord.length > 0 && 
                    /^[A-Z\s\-"'0-9]+$/.test(cleanWord) && 
                    cleanWord.length < 30 && 
                    !cleanWord.includes('HTTP')) {
                    
                    words.push(cleanWord);
                    if (words.length >= 4) break;
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
            }
        }
        
        console.log(`\n总共解析出 ${groups.length} 个有效组`);
        
        if (groups.length >= 4) {
            const finalGroups = groups.slice(0, 4);
            
            // 生成最终结果
            const result = {
                words: finalGroups.flatMap(g => g.words),
                groups: finalGroups.map((group, index) => ({
                    theme: group.category,
                    words: group.words,
                    difficulty: ['yellow', 'green', 'blue', 'purple'][index],
                    hint: `These words are related to "${group.category}"`
                }))
            };
            
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

// 运行完整测试
completeTestToday().then(success => {
    if (success) {
        console.log('\n🎉 完整测试通过！可以安全部署了！');
    } else {
        console.log('\n❌ 完整测试失败，需要修复后再部署');
    }
});