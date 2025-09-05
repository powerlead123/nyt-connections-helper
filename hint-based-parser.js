// 基于提示区域分组名称的解析器
async function hintBasedParser() {
    console.log('=== 基于提示的解析器 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-5-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 1. 提取提示区域的分组名称
        console.log('\\n=== 步骤1: 提取提示区域分组名称 ===');
        
        const hints = [];
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        
        // 查找正确的提示区域：从"Today's connections fall into the following categories:"开始
        const correctHintMatch = html.match(/Today's connections fall into the following categories:(.*?)(?=Looking|Ready|$)/i);
        if (correctHintMatch) {
            console.log('找到正确的提示区域:');
            console.log(correctHintMatch[1]);
            
            // 从这个区域提取分组名称
            const hintText = correctHintMatch[1];
            
            const correctPatterns = [
                /Yellow:\s*(.*?)Green:/i,
                /Green:\s*(.*?)Blue:/i,  
                /Blue:\s*(.*?)Purple:/i,
                /Purple:\s*(.*?)(?:Looking|Ready|$)/i
            ];
            
            for (let i = 0; i < correctPatterns.length; i++) {
                const match = hintText.match(correctPatterns[i]);
                if (match) {
                    const hintName = match[1].trim();
                    hints.push(hintName);
                    console.log(`${colors[i]}: "${hintName}"`);
                } else {
                    console.log(`❌ 未找到 ${colors[i]} 提示`);
                }
            }
        } else {
            console.log('❌ 未找到正确的提示区域');
        }
        

        
        if (hints.length < 4) {
            console.log('❌ 提示不完整，无法继续解析');
            return null;
        }
        
        // 2. 提取答案区域
        console.log('\\n=== 步骤2: 提取答案区域 ===');
        
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerText = html.substring(startIndex + startMarker.length, endIndex);
        answerText = answerText.replace(/\\"/g, '"').trim();
        
        console.log('答案文本:', answerText);
        
        // 3. 基于提示名称解析分组
        console.log('\\n=== 步骤3: 基于提示名称解析分组 ===');
        
        const groups = [];
        
        for (let i = 0; i < hints.length; i++) {
            const currentHint = hints[i];
            const nextHint = i < hints.length - 1 ? hints[i + 1] : null;
            
            console.log(`\\n解析分组 ${i + 1}: "${currentHint}"`);
            
            // 构建正则表达式来匹配当前分组
            let pattern;
            if (nextHint) {
                // 有下一个分组，匹配到下一个分组名称前
                pattern = new RegExp(escapeRegex(currentHint) + ':\\s*(.*?)(?=' + escapeRegex(nextHint) + ':|$)', 'i');
            } else {
                // 最后一个分组，匹配到结尾
                pattern = new RegExp(escapeRegex(currentHint) + ':\\s*(.*?)$', 'i');
            }
            
            console.log(`  使用正则表达式: ${pattern}`);
            
            const match = answerText.match(pattern);
            
            if (match) {
                const wordsText = match[1].trim();
                console.log(`  匹配到单词文本: "${wordsText}"`);
                
                // 提取单词
                const words = wordsText.split(',')
                    .map(word => word.trim())
                    .filter(word => word && /^[A-Z]/.test(word))
                    .slice(0, 4);
                
                if (words.length >= 4) {
                    groups.push({
                        category: currentHint,
                        words: words
                    });
                    console.log(`  ✅ "${currentHint}": ${words.join(', ')}`);
                } else {
                    console.log(`  ❌ 单词数量不足: ${words.length}`);
                }
            } else {
                console.log(`  ❌ 未找到匹配的分组`);
            }
        }
        
        console.log(`\\n=== 解析完成，找到 ${groups.length} 个分组 ===`);
        
        if (groups.length >= 4) {
            const result = {
                date: new Date().toISOString().split('T')[0],
                groups: groups.slice(0, 4)
            };
            
            console.log('\\n🎉 最终结果:');
            console.log(JSON.stringify(result, null, 2));
            return result;
        } else {
            console.log('\\n❌ 解析失败');
            return null;
        }
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

// 转义正则表达式特殊字符
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

hintBasedParser();