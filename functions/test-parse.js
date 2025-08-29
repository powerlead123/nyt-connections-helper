export async function onRequest(context) {
    try {
        const testUrl = 'https://mashable.com/article/nyt-connections-hint-answer-today-08-29-2025';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`;
        
        console.log(`Testing parsing with proxy: ${proxyUrl}`);
        
        const response = await fetch(proxyUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
            return new Response(JSON.stringify({
                error: 'Proxy request failed',
                status: response.status
            }), { status: 500 });
        }
        
        const data = await response.json();
        const html = data.contents;
        
        if (!html) {
            return new Response(JSON.stringify({
                error: 'No HTML content'
            }), { status: 500 });
        }
        
        // 测试解析
        const dateStr = '2025-08-29';
        const result = parseMashableHTML(html, dateStr);
        
        // 额外的调试信息
        const debugInfo = {
            htmlLength: html.length,
            hasConnections: html.toLowerCase().includes('connections'),
            hasAnswer: html.toLowerCase().includes('answer'),
            hasGreen: html.toLowerCase().includes('green'),
            hasYellow: html.toLowerCase().includes('yellow'),
            hasBlue: html.toLowerCase().includes('blue'),
            hasPurple: html.toLowerCase().includes('purple'),
            // 查找可能的答案模式
            colorPatterns: {
                greenMatches: (html.match(/green[\\s\\S]{0,200}/gi) || []).length,
                yellowMatches: (html.match(/yellow[\\s\\S]{0,200}/gi) || []).length,
                blueMatches: (html.match(/blue[\\s\\S]{0,200}/gi) || []).length,
                purpleMatches: (html.match(/purple[\\s\\S]{0,200}/gi) || []).length
            },
            // 查找列表项
            listItems: (html.match(/<li[^>]*>/gi) || []).length,
            // 查找强调标签
            strongTags: (html.match(/<strong[^>]*>/gi) || []).length,
            // 查找大写单词
            uppercaseWords: (html.match(/\\b[A-Z]{2,}\\b/g) || []).slice(0, 20)
        };
        
        return new Response(JSON.stringify({
            success: !!result,
            parseResult: result,
            debugInfo: debugInfo,
            htmlPreview: html.substring(0, 1000)
        }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), { status: 500 });
    }
}

// 复制解析函数用于测试
function parseMashableHTML(html, dateStr) {
    try {
        const groups = [];
        
        // 多种解析策略
        
        // 策略1: 查找标准答案格式
        const answerPatterns = [
            /(?:Green|Yellow|Blue|Purple)[\\s\\S]*?:([\\s\\S]*?)(?=(?:Green|Yellow|Blue|Purple)|$)/gi,
            /(?:🟢|🟡|🔵|🟣)[\\s\\S]*?:([\\s\\S]*?)(?=(?:🟢|🟡|🔵|🟣)|$)/gi,
            /<strong[^>]*>(?:Green|Yellow|Blue|Purple)[^<]*<\\/strong>([\\s\\S]*?)(?=<strong[^>]*>(?:Green|Yellow|Blue|Purple)|$)/gi
        ];
        
        for (const pattern of answerPatterns) {
            const matches = [...html.matchAll(pattern)];
            if (matches.length >= 4) {
                console.log(`Found ${matches.length} groups with pattern`);
                
                for (let i = 0; i < Math.min(4, matches.length); i++) {
                    const wordsText = matches[i][1];
                    const words = extractWordsFromText(wordsText);
                    
                    if (words.length >= 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: words.slice(0, 4),
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }
                
                if (groups.length === 4) break;
            }
        }
        
        // 策略2: 查找列表格式
        if (groups.length < 4) {
            const listPattern = /<li[^>]*>(.*?)<\\/li>/gi;
            const listItems = [...html.matchAll(listPattern)];
            
            if (listItems.length >= 16) {
                console.log(`Found ${listItems.length} list items`);
                
                for (let i = 0; i < 4; i++) {
                    const groupWords = [];
                    for (let j = 0; j < 4; j++) {
                        const itemIndex = i * 4 + j;
                        if (itemIndex < listItems.length) {
                            const word = extractWordsFromText(listItems[itemIndex][1])[0];
                            if (word) groupWords.push(word);
                        }
                    }
                    
                    if (groupWords.length === 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: groupWords,
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }
            }
        }
        
        // 策略3: 查找所有大写单词
        if (groups.length < 4) {
            const allWords = extractWordsFromText(html);
            if (allWords.length >= 16) {
                console.log(`Found ${allWords.length} potential words`);
                
                // 取前16个单词，分成4组
                for (let i = 0; i < 4; i++) {
                    const groupWords = allWords.slice(i * 4, (i + 1) * 4);
                    if (groupWords.length === 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: groupWords,
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }
            }
        }
        
        if (groups.length === 4) {
            console.log('Successfully parsed 4 groups from Mashable');
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable'
            };
        }
        
        console.log(`Only found ${groups.length} groups, need 4`);
        return null;
        
    } catch (error) {
        console.error('Mashable HTML parsing error:', error);
        return null;
    }
}

// 从文本中提取单词
function extractWordsFromText(text) {
    if (!text) return [];
    
    // 移除HTML标签
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    // 查找大写单词（可能是答案）
    const words = cleanText.match(/\\b[A-Z][A-Z\\s]{1,15}\\b/g) || [];
    
    return words
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM)$/.test(word));
}