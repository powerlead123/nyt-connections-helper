// 使用成功的冒号解析方法作为主要解析器
export async function onRequest(context) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const day = today.getDate();
    
    const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 直接使用成功的冒号解析方法
        return await parseWithColonMethod(html, today);
        
    } catch (error) {
        console.error('解析出错:', error);
        return new Response(JSON.stringify({
            date: today.toISOString().split('T')[0],
            error: '无法获取今日谜题，请稍后重试',
            words: [],
            groups: []
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 成功的冒号解析方法
async function parseWithColonMethod(html, today) {
    console.log('使用冒号解析方法');
    
    // 查找答案区域
    const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,2000}/i);
    
    if (!answerSectionMatch) {
        throw new Error('未找到答案区域');
    }
    
    let answerSection = answerSectionMatch[0];
    
    // 清理文本
    answerSection = answerSection.replace(/What is the answer to Connections today/i, '');
    const dontIndex = answerSection.indexOf("Don't");
    if (dontIndex !== -1) {
        answerSection = answerSection.substring(0, dontIndex);
    }
    
    console.log('答案区域:', answerSection);
        
        // 找到所有冒号位置
        const colonPositions = [];
        for (let i = 0; i < answerSection.length; i++) {
            if (answerSection[i] === ':') {
                colonPositions.push(i);
            }
        }
        
        console.log(`找到 ${colonPositions.length} 个冒号`);
        
        // 过滤有效冒号
        const validColonPositions = colonPositions.filter(pos => {
            const before = answerSection.substring(Math.max(0, pos - 50), pos);
            const after = answerSection.substring(pos + 1, Math.min(answerSection.length, pos + 100));
            
            const hasWordsAfter = /[A-Z]/.test(after);
            const hasReasonableBefore = before.length > 0 && before.length < 100;
            const notInUrl = !before.includes('http') && !after.includes('http');
            
            return hasWordsAfter && hasReasonableBefore && notInUrl;
        });
        
        console.log(`有效冒号: ${validColonPositions.length} 个`);
        
        const groups = [];
        const difficulties = ['yellow', 'green', 'blue', 'purple'];
        
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
            
            console.log(`分组 ${i + 1}: "${category}" -> "${wordsText}"`);
            
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
                    theme: category,
                    category: category,
                    words: words.slice(0, 4),
                    difficulty: difficulties[i],
                    hint: `These words are related to "${category}"`
                });
                console.log(`✅ "${category}": ${words.slice(0, 4).join(', ')}`);
            }
        }
        
        if (groups.length >= 4) {
            const finalGroups = groups.slice(0, 4);
            const allWords = finalGroups.flatMap(group => group.words);
            
            const today = new Date();
            
            return new Response(JSON.stringify({
                date: today.toISOString().split('T')[0],
                words: allWords,
                groups: finalGroups
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            throw new Error('冒号解析也失败了');
        }
        
    } catch (error) {
        console.error('冒号解析失败:', error);
        throw error;
    }
}