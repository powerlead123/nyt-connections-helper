// Cloudflare Pages Function for manual refresh
export async function onRequest(context) {
    const { request, env } = context;
    
    // 只允许POST请求
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        console.log('Manual refresh triggered');
        
        const today = new Date().toISOString().split('T')[0];
        
        // 强制获取新数据
        const freshData = await forceFetchFreshData();
        
        if (freshData && freshData.groups && freshData.groups.length === 4) {
            console.log('Fresh data obtained successfully');
            
            // 保存到KV存储
            if (env.CONNECTIONS_KV) {
                try {
                    await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(freshData), {
                        expirationTtl: 86400 // 24小时过期
                    });
                    console.log('Fresh data saved to KV');
                } catch (error) {
                    console.log('KV save error:', error);
                }
            }
            
            return new Response(JSON.stringify({
                success: true,
                message: 'Data refreshed successfully',
                data: freshData,
                timestamp: new Date().toISOString()
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
            
        } else {
            console.log('Failed to get fresh data, trying to return existing data');
            
            // 尝试从KV获取现有数据
            let existingData = null;
            if (env.CONNECTIONS_KV) {
                try {
                    const kvData = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
                    if (kvData) {
                        existingData = JSON.parse(kvData);
                        console.log('Found existing data in KV');
                    }
                } catch (error) {
                    console.log('KV read error:', error);
                }
            }
            
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to fetch fresh data - using existing data',
                data: existingData, // 返回现有数据（如果有的话）
                timestamp: new Date().toISOString()
            }), {
                status: 200, // 不返回错误状态，因为这不是致命错误
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
    } catch (error) {
        console.error('Manual refresh error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            message: 'Refresh failed: ' + error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 强制获取新数据 - 使用完美逻辑
async function forceFetchFreshData() {
    try {
        console.log('🎯 使用完美抓取逻辑');
        
        const today = new Date();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[today.getMonth()];
        const day = today.getDate();
        const year = today.getFullYear();
        
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
        console.log('1. URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
            console.log('❌ 请求失败:', response.status);
            return null;
        }
        
        const html = await response.text();
        console.log('2. HTML长度:', html.length);
        
        // 使用完美解析逻辑
        const result = parseForceRefresh(html, today.toISOString().split('T')[0]);
        if (result) {
            console.log('🎉 完美逻辑解析成功!');
            return result;
        }
        
        return null;
        
    } catch (error) {
        console.error('Force fetch error:', error);
        return null;
    }
}

// 使用完美逻辑解析函数
function parseForceRefresh(html, dateStr) {
    try {
        console.log('🎯 开始完美逻辑解析...');
        
        // 3. 查找关键短语
        const targetPhrase = "Today's connections fall into the following categories:";
        const phraseIndex = html.indexOf(targetPhrase);
        
        if (phraseIndex === -1) {
            console.log('❌ 未找到关键短语');
            return null;
        }
        
        console.log('3. 找到关键短语，位置:', phraseIndex);
        
        // 4. 提取关键短语之后的内容
        const afterPhrase = html.substring(phraseIndex + targetPhrase.length);
        
        // 5. 在关键短语之后提取4个分组名称
        const searchContent = afterPhrase.substring(0, 1000);
        const colorHints = {};
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        
        colors.forEach(color => {
            // 🔧 改进的主题提取逻辑
            const patterns = [
                // 带引号的完整匹配
                new RegExp(`${color}:\\s*"([^"]+)"`, 'i'),
                // 不带引号，到下一个颜色或关键词为止
                new RegExp(`${color}:\\s*([^\\n]+?)(?=(?:Yellow|Green|Blue|Purple|Looking|Ready|Drumroll):)`, 'i'),
                // 不带引号，到换行为止
                new RegExp(`${color}:\\s*([^\\n<]+)`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = searchContent.match(pattern);
                if (match) {
                    let hint = match[1].trim();
                    
                    // 🔧 智能截断逻辑
                    const cutPoints = [
                        'Looking for', 'Ready for', 'Drumroll',
                        'Yellow:', 'Green:', 'Blue:', 'Purple:',
                        'Here\'s the answer', 'This is your last'
                    ];
                    
                    for (const cutPoint of cutPoints) {
                        const cutIndex = hint.indexOf(cutPoint);
                        if (cutIndex > 0) {
                            hint = hint.substring(0, cutIndex).trim();
                            break;
                        }
                    }
                    
                    // 长度限制
                    if (hint.length > 50) {
                        hint = hint.substring(0, 50).trim();
                    }
                    
                    colorHints[color] = hint;
                    console.log(`   ${color}: ${hint}`);
                    break;
                }
            }
        });
        
        if (Object.keys(colorHints).length < 4) {
            console.log('❌ 未找到4个分组');
            return null;
        }
        
        console.log('4. 找到4个分组名称');
        
        // 6. 找到答案区域（包含实际单词的区域）
        console.log('\\n5. 查找答案区域...');
        
        // 查找包含实际答案的区域，通常在"What is the answer"之后
        let answerAreaStart = html.indexOf('What is the answer to Connections today');
        if (answerAreaStart === -1) {
            answerAreaStart = html.indexOf('"You should know better!"');
        }
        
        if (answerAreaStart === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerArea = html.substring(answerAreaStart);
        
        // 🔧 关键修复：清理转义字符
        answerArea = answerArea.replace(/\\"/g, '"');
        console.log('找到答案区域并清理转义字符，长度:', answerArea.length);
        
        // 🔧 同时清理主题中的转义字符，确保边界匹配一致
        Object.keys(colorHints).forEach(color => {
            colorHints[color] = colorHints[color].replace(/\\"/g, '"');
        });
        
        // 7. 严格按照完美逻辑：在答案区域中查找分组名称之间的内容
        console.log('\\n6. 严格按照逻辑解析单词...');
        
        // 构建边界：4个分组名称 + 结束标记
        const boundaries = [
            colorHints['Yellow'],
            colorHints['Green'],
            colorHints['Blue'], 
            colorHints['Purple'],
            "Don't feel down"
        ];
        
        const groups = [];
        const difficulties = ['yellow', 'green', 'blue', 'purple'];
        
        for (let i = 0; i < 4; i++) {
            const color = colors[i];
            const difficulty = difficulties[i];
            const hint = colorHints[color];
            const startBoundary = boundaries[i];
            const endBoundary = boundaries[i + 1];
            
            console.log(`\\n   ${color} 组: 从 "${startBoundary}" 到 "${endBoundary}"`);
            
            // 在答案区域中查找起始边界
            const startIndex = answerArea.indexOf(startBoundary);
            if (startIndex === -1) {
                console.log(`     ❌ 未找到起始边界`);
                continue;
            }
            
            // 在起始边界之后查找结束边界
            const endIndex = answerArea.indexOf(endBoundary, startIndex + startBoundary.length);
            if (endIndex === -1) {
                console.log(`     ❌ 未找到结束边界`);
                continue;
            }
            
            // 提取两个边界之间的内容
            const betweenContent = answerArea.substring(startIndex + startBoundary.length, endIndex);
            console.log(`     区间长度: ${betweenContent.length}`);
            
            // 计算逗号数量
            const commas = (betweenContent.match(/,/g) || []).length;
            console.log(`     逗号数量: ${commas}`);
            
            if (commas >= 3) {
                // 查找冒号后的内容
                const colonIndex = betweenContent.indexOf(':');
                if (colonIndex !== -1) {
                    const afterColon = betweenContent.substring(colonIndex + 1);
                    
                    // 简单按逗号分割，取前4个词组（可能是单词或词组）
                    const afterColonClean = afterColon.trim();
                    const allParts = afterColonClean.split(',').map(part => part.trim());
                    
                    if (allParts.length >= 4) {
                        // 取前4个逗号分隔的部分
                        const words = allParts.slice(0, 4);
                        
                        console.log(`     ✅ 成功: ${words.join(', ')}`);
                        
                        groups.push({
                            theme: hint,
                            words: words,
                            difficulty: difficulty,
                            hint: hint
                        });
                    } else {
                        console.log(`     ❌ 逗号分隔的部分不足4个 (找到 ${allParts.length} 个)`);
                    }
                } else {
                    console.log(`     ❌ 未找到冒号`);
                }
            } else {
                console.log(`     ❌ 逗号不足（需要3个）`);
            }
        }
        
        if (groups.length === 4) {
            console.log('\\n🎉 完美成功!');
            const result = {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable (Perfect Logic v2.0 - Manual Refresh)'
            };
            
            console.log('\\n📊 最终结果:');
            result.groups.forEach((group, i) => {
                const emoji = {
                    'yellow': '🟡',
                    'green': '🟢', 
                    'blue': '🔵',
                    'purple': '🟣'
                }[group.difficulty] || '⚪';
                
                console.log(`     ${emoji} ${group.theme}`);
                console.log(`        ${group.words.join(', ')}`);
            });
            
            return result;
        } else {
            console.log(`\\n❌ 只解析出 ${groups.length} 个分组`);
            return null;
        }
        
    } catch (error) {
        console.error('Perfect logic parsing error:', error);
        return null;
    }
}

// 从文本中提取单词 - 与scheduled.js相同
function extractWordsFromText(text) {
    if (!text) return [];
    
    // 移除HTML标签
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    // 查找大写单词（可能包含空格和连字符）
    const wordPatterns = [
        /\b[A-Z][A-Z\s\-']+\b/g,  // 全大写单词
        /\b[A-Z][a-z]+\b/g,       // 首字母大写
        /\b[A-Z]+\b/g             // 纯大写
    ];
    
    const allWords = [];
    
    for (const pattern of wordPatterns) {
        const matches = cleanText.match(pattern) || [];
        allWords.push(...matches);
    }
    
    // 清理和去重
    const cleanWords = allWords
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter((word, index, arr) => arr.indexOf(word) === index);
    
    return cleanWords;
}

// 从HTML中提取所有可能的Connections单词 - 与scheduled.js相同
function extractAllWordsFromHTML(html) {
    // 查找可能包含答案的区域
    const answerSections = [
        // 查找包含"answer"的段落
        ...html.match(/<p[^>]*>[\s\S]*?answer[\s\S]*?<\/p>/gi) || [],
        // 查找包含颜色的段落  
        ...html.match(/<p[^>]*>[\s\S]*?(?:green|yellow|blue|purple)[\s\S]*?<\/p>/gi) || [],
        // 查找列表
        ...html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [],
        ...html.match(/<ol[^>]*>[\s\S]*?<\/ol>/gi) || [],
        // 查找包含答案的div
        ...html.match(/<div[^>]*>[\s\S]*?(?:answer|solution)[\s\S]*?<\/div>/gi) || []
    ];
    
    console.log(`找到 ${answerSections.length} 个可能的答案区域`);
    
    const allWords = new Set();
    
    // 从答案区域提取单词
    for (const section of answerSections) {
        const words = extractConnectionsWords(section);
        words.forEach(word => allWords.add(word));
    }
    
    // 如果从答案区域提取的单词不够，从整个HTML提取
    if (allWords.size < 16) {
        const generalWords = extractConnectionsWords(html);
        generalWords.forEach(word => allWords.add(word));
    }
    
    const wordArray = Array.from(allWords);
    
    // 过滤掉明显不是答案的单词
    const filteredWords = wordArray.filter(word => {
        // 排除网站相关词汇
        const excludeWords = [
            'MASHABLE', 'CONNECTIONS', 'WORDLE', 'NYT', 'TIMES', 'PUZZLE', 'GAME',
            'ANSWER', 'HINT', 'TODAY', 'DAILY', 'SOLUTION', 'CATEGORY', 'CATEGORIES',
            'HTML', 'CSS', 'JAVASCRIPT', 'ARTICLE', 'CONTENT', 'PAGE', 'WEBSITE',
            'SEARCH', 'RESULT', 'TECH', 'SCIENCE', 'NEWS', 'SOCIAL', 'MEDIA',
            'SUBSCRIBE', 'NEWSLETTER', 'EMAIL', 'FOLLOW', 'SHARE', 'LIKE',
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        
        return !excludeWords.includes(word) && 
               word.length >= 3 && 
               word.length <= 12 &&
               /^[A-Z0-9\-]+$/.test(word);
    });
    
    console.log(`过滤后剩余 ${filteredWords.length} 个候选单词:`, filteredWords.slice(0, 20));
    
    return filteredWords.slice(0, 20); // 返回前20个最可能的单词
}

// 提取Connections风格的单词 - 与scheduled.js相同
function extractConnectionsWords(text) {
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    const patterns = [
        /\b[A-Z]{3,12}\b/g,           // 全大写单词 (3-12字符)
        /\b[A-Z][a-z]{2,11}\b/g,      // 首字母大写 (3-12字符)
        /\b[A-Z][\w\-']{2,11}\b/g,    // 大写开头，可能包含连字符 (3-12字符)
        /\b\d+[\-\/]\w+\b/g,          // 数字组合 (如 7-ELEVEN)
        /"([A-Za-z\-']{3,12})"/g      // 引号中的单词
    ];
    
    const words = [];
    for (const pattern of patterns) {
        const matches = cleanText.match(pattern) || [];
        words.push(...matches);
    }
    
    return words
        .map(word => word.replace(/['"]/g, '').trim().toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 12)
        .filter((word, index, arr) => arr.indexOf(word) === index);
}

// 从找到的单词创建分组 - 新增函数
function createGroupsFromFoundWords(foundWords, hints) {
    const groups = [];
    
    if (foundWords.length >= 4 && foundWords[0] instanceof Array) {
        // 如果是已经分组的单词数组
        for (let i = 0; i < Math.min(4, foundWords.length); i++) {
            const words = foundWords[i];
            const difficulty = ['yellow', 'green', 'blue', 'purple'][i];
            const colorKey = ['Yellow', 'Green', 'Blue', 'Purple'][i];
            
            groups.push({
                theme: hints[colorKey] || `Group ${i + 1}`,
                words: words,
                difficulty: difficulty,
                hint: hints[colorKey] || 'These words share a common theme'
            });
        }
    } else if (foundWords.length >= 16) {
        // 如果是单词列表，按顺序分组
        for (let i = 0; i < 4; i++) {
            const words = foundWords.slice(i * 4, (i + 1) * 4);
            const difficulty = ['yellow', 'green', 'blue', 'purple'][i];
            const colorKey = ['Yellow', 'Green', 'Blue', 'Purple'][i];
            
            groups.push({
                theme: hints[colorKey] || `Group ${i + 1}`,
                words: words,
                difficulty: difficulty,
                hint: hints[colorKey] || 'These words share a common theme'
            });
        }
    }
    
    return groups;
}

