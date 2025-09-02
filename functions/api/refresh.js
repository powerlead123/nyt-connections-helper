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
            console.log('Failed to get fresh data');
            
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to fetch fresh data - using existing data',
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

// 强制获取新数据
async function forceFetchFreshData() {
    try {
        const today = new Date();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[today.getMonth()];
        const day = today.getDate();
        const year = today.getFullYear();
        const dateStr = today.toISOString().split('T')[0];
        
        console.log(`Force fetching for: ${monthName} ${day}, ${year}`);
        
        // 使用正确的URL格式
        const urls = [
            `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`
        ];
        
        // 使用可靠的代理服务
        const proxyServices = [
            (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        ];
        
        for (const baseUrl of urls) {
            for (const proxyFn of proxyServices) {
                try {
                    const proxyUrl = proxyFn(baseUrl);
                    console.log(`Trying: ${baseUrl}`);
                    
                    const response = await fetch(proxyUrl, {
                        method: 'GET',
                        signal: AbortSignal.timeout(30000), // 增加到30秒超时
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (!response.ok) {
                        console.log(`Proxy failed: ${response.status}`);
                        continue;
                    }
                    
                    let html;
                    if (proxyUrl.includes('allorigins.win')) {
                        const data = await response.json();
                        html = data.contents;
                    } else if (proxyUrl.includes('corsproxy.io') || proxyUrl.includes('thingproxy')) {
                        html = await response.text();
                    } else {
                        html = await response.text();
                    }
                    
                    if (!html || html.length < 1000) {
                        console.log(`HTML too short: ${html?.length || 0}`);
                        continue;
                    }
                    
                    console.log(`HTML fetched: ${html.length} chars`);
                    
                    // 解析数据
                    const result = parseForceRefresh(html, dateStr);
                    if (result && result.groups && result.groups.length === 4) {
                        console.log('Force parsing successful!');
                        return result;
                    }
                    
                } catch (error) {
                    console.log(`URL failed: ${error.message}`);
                    continue;
                }
            }
        }
        
        console.log('All force fetch attempts failed');
        return null;
        
    } catch (error) {
        console.error('Force fetch error:', error);
        return null;
    }
}

// 强制刷新解析
function parseForceRefresh(html, dateStr) {
    try {
        console.log('Starting force refresh parsing...');
        
        // 查找颜色提示 - 尝试多种格式
        const colorPatterns = [
            /(Yellow|Green|Blue|Purple):\s*<strong>([^<]+)<\/strong>/gi,
            /(Yellow|Green|Blue|Purple):\s*<b>([^<]+)<\/b>/gi,
            /(Yellow|Green|Blue|Purple):\s*([^\n<]+)/gi
        ];
        
        let colorMatches = [];
        for (const pattern of colorPatterns) {
            colorMatches = [...html.matchAll(pattern)];
            if (colorMatches.length > 0) break;
        }
        
        console.log(`Found ${colorMatches.length} color matches`);
        
        if (colorMatches.length >= 4) {
            const hints = {};
            colorMatches.forEach(match => {
                const color = match[1];
                const hint = match[2].trim();
                // 只保留第一个提示（避免重复）
                if (!hints[color]) {
                    hints[color] = hint;
                }
            });
            
            console.log('Extracted hints:', hints);
            
            // 提取单词 - 使用更智能的方法
            const extractedData = extractConnectionsWords(html);
            console.log(`Extracted data:`, extractedData);
            
            // 如果是分组数据
            if (Array.isArray(extractedData) && extractedData.length >= 4 && extractedData[0].category) {
                console.log('Using structured group data');
                
                const colorMap = {
                    'First appearance': 'yellow',
                    'Ones celebrated with holidays': 'green', 
                    'Famous poets': 'blue',
                    'What "Cardinal" might refer to': 'purple'
                };
                
                const groups = extractedData.slice(0, 4).map((group, index) => {
                    const difficulty = colorMap[group.category] || ['yellow', 'green', 'blue', 'purple'][index];
                    return {
                        theme: group.category,
                        words: group.words,
                        difficulty: difficulty,
                        hint: group.category
                    };
                });
                
                return {
                    date: dateStr,
                    words: groups.flatMap(g => g.words),
                    groups: groups,
                    source: 'Mashable (Manual Refresh - Structured)'
                };
            }
            // 如果是单词数组（传统方法）
            else if (Array.isArray(extractedData) && extractedData.length >= 16) {
                console.log('Using traditional word array');
                
                const groups = [
                    {
                        theme: hints.Yellow || 'Yellow Group',
                        words: extractedData.slice(0, 4),
                        difficulty: 'yellow',
                        hint: hints.Yellow || 'These words share a theme'
                    },
                    {
                        theme: hints.Green || 'Green Group',
                        words: extractedData.slice(4, 8),
                        difficulty: 'green',
                        hint: hints.Green || 'These words share a theme'
                    },
                    {
                        theme: hints.Blue || 'Blue Group',
                        words: extractedData.slice(8, 12),
                        difficulty: 'blue',
                        hint: hints.Blue || 'These words share a theme'
                    },
                    {
                        theme: hints.Purple || 'Purple Group',
                        words: extractedData.slice(12, 16),
                        difficulty: 'purple',
                        hint: hints.Purple || 'These words share a theme'
                    }
                ];
                
                return {
                    date: dateStr,
                    words: groups.flatMap(g => g.words),
                    groups: groups,
                    source: 'Mashable (Manual Refresh)'
                };
            }
        }
        
        // 策略2: 通用解析
        console.log('Trying generic parsing...');
        const allWords = extractForceRefreshWords(html);
        
        if (allWords.length >= 16) {
            const groups = [];
            for (let i = 0; i < 4; i++) {
                groups.push({
                    theme: `Group ${i + 1}`,
                    words: allWords.slice(i * 4, (i + 1) * 4),
                    difficulty: ['green', 'yellow', 'blue', 'purple'][i],
                    hint: 'These words share a common theme'
                });
            }
            
            return {
                date: dateStr,
                words: allWords.slice(0, 16),
                groups: groups,
                source: 'Mashable (Manual Refresh - Generic)'
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Force refresh parsing error:', error);
        return null;
    }
}

// 智能提取Connections单词 - 基于实际HTML结构
function extractConnectionsWords(html) {
    console.log('Extracting Connections words from structured content...');
    
    // 首先查找答案部分
    const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,2000}/i);
    
    if (!answerSectionMatch) {
        console.log('Answer section not found, trying alternative methods...');
        return extractFallbackWords(html);
    }
    
    const answerSection = answerSectionMatch[0];
    console.log('Found answer section, length:', answerSection.length);
    
    // 清理HTML标签，保留文本内容
    const cleanSection = answerSection
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    console.log('Cleaned section preview:', cleanSection.substring(0, 300));
    
    // 使用简单直接的方法提取答案
    const patterns = [
        {
            name: 'First appearance',
            start: 'First appearance:',
            end: 'Ones celebrated'
        },
        {
            name: 'Ones celebrated with holidays', 
            start: 'Ones celebrated with holidays:',
            end: 'Famous poets'
        },
        {
            name: 'Famous poets',
            start: 'Famous poets:',
            end: 'What'
        },
        {
            name: 'What "Cardinal" might refer to',
            start: 'What "Cardinal" might refer to:',
            end: "Don't"
        }
    ];
    
    const groupedWords = [];
    
    patterns.forEach((pattern, i) => {
        const startIndex = cleanSection.indexOf(pattern.start);
        if (startIndex !== -1) {
            const endIndex = cleanSection.indexOf(pattern.end, startIndex + pattern.start.length);
            
            let wordsText;
            if (endIndex !== -1) {
                wordsText = cleanSection.substring(startIndex + pattern.start.length, endIndex);
            } else {
                // 如果没找到结束标记，取到文本末尾
                wordsText = cleanSection.substring(startIndex + pattern.start.length);
            }
            
            // 清理文本
            wordsText = wordsText.trim();
            
            console.log(`Group ${i+1}: ${pattern.name} -> ${wordsText}`);
            
            // 分割单词
            const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0);
            
            if (words.length > 0) {
                groupedWords.push({
                    category: pattern.name,
                    words: words
                });
            }
        }
    });
    
    console.log(`Extracted ${groupedWords.length} groups using direct method`);
    
    // 如果直接方法成功，返回结果
    if (groupedWords.length >= 4) {
        return groupedWords;
    }
    
    // 否则尝试备用方法
    console.log('Direct method failed, trying fallback method...');
    return extractFallbackWords(html);
}

// 解析Connections内容的核心函数
function parseConnectionsContent(content) {
    console.log('Parsing connections content...');
    
    // 查找所有冒号位置来定位分类
    const colonPositions = [];
    for (let i = 0; i < content.length; i++) {
        if (content[i] === ':') {
            colonPositions.push(i);
        }
    }
    
    console.log(`Found ${colonPositions.length} colons`);
    
    if (colonPositions.length < 4) {
        console.log('Not enough colons found, trying pattern matching...');
        return parseWithPatterns(content);
    }
    
    const groups = [];
    
    for (let i = 0; i < Math.min(4, colonPositions.length); i++) {
        const colonPos = colonPositions[i];
        const nextColonPos = colonPositions[i + 1] || content.length;
        
        // 找分类名称（冒号前）
        let categoryStart = colonPos - 1;
        while (categoryStart > 0 && !/[A-Z]/.test(content[categoryStart])) {
            categoryStart--;
        }
        
        // 向前找到分类开始
        while (categoryStart > 0 && content[categoryStart - 1] !== ' ' && !/[A-Z]/.test(content[categoryStart - 1])) {
            categoryStart--;
        }
        
        const category = content.substring(categoryStart, colonPos).trim();
        
        // 找单词部分
        const wordsStart = colonPos + 1;
        let wordsEnd = nextColonPos;
        
        // 如果有下一个冒号，找到下一个分类的开始
        if (i < colonPositions.length - 1) {
            let nextCategoryStart = nextColonPos - 1;
            while (nextCategoryStart > wordsStart && !/[A-Z]/.test(content[nextCategoryStart])) {
                nextCategoryStart--;
            }
            // 向前找到单词的真正结束
            while (nextCategoryStart > wordsStart && content[nextCategoryStart - 1] !== ' ') {
                nextCategoryStart--;
            }
            wordsEnd = nextCategoryStart;
        }
        
        let wordsText = content.substring(wordsStart, wordsEnd).trim();
        
        // 清理可能的干扰文本
        wordsText = wordsText.replace(/Don't.*$/i, '').trim();
        
        console.log(`Group ${i+1}: "${category}" -> "${wordsText}"`);
        
        // 分割单词
        const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0 && w.length < 50);
        
        if (words.length >= 4) {
            groups.push({
                category: category,
                words: words.slice(0, 4)
            });
        }
    }
    
    console.log(`Extracted ${groups.length} groups using colon method`);
    
    if (groups.length >= 4) {
        return groups;
    }
    
    // 如果冒号方法失败，尝试模式匹配
    return parseWithPatterns(content);
}

// 使用已知模式解析（备用方法）
function parseWithPatterns(content) {
    console.log('Using pattern matching method...');
    
    // 常见的分类模式
    const commonPatterns = [
        { regex: /First appearance:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'First appearance' },
        { regex: /Ones celebrated with holidays:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'Ones celebrated with holidays' },
        { regex: /Famous poets:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'Famous poets' },
        { regex: /Curses:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'Curses' },
        { regex: /In "A visit from St\. Nicholas":\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'In "A visit from St. Nicholas"' },
        { regex: /Worn by Earring Magic Ken:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'Worn by Earring Magic Ken' },
        { regex: /Starting with possessive determiners:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'Starting with possessive determiners' },
        { regex: /What[^:]*might refer to:\s*([^A-Z]*[A-Z][^A-Z]*(?:,[^A-Z]*[A-Z][^A-Z]*)*)/i, name: 'What "Cardinal" might refer to' }
    ];
    
    const groups = [];
    
    for (const pattern of commonPatterns) {
        const match = content.match(pattern.regex);
        if (match) {
            const wordsText = match[1].trim();
            const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0);
            
            console.log(`Pattern match: "${pattern.name}" -> [${words.join(', ')}]`);
            
            if (words.length >= 4) {
                groups.push({
                    category: pattern.name,
                    words: words.slice(0, 4)
                });
            }
        }
        
        if (groups.length >= 4) break;
    }
    
    console.log(`Pattern matching found ${groups.length} groups`);
    
    if (groups.length >= 4) {
        return groups;
    }
    
    // 最后尝试备用方法
    return extractFallbackWords(content);
}

// 备用提取方法
function extractFallbackWords(html) {
    console.log('Using fallback extraction method...');
    
    // 查找包含答案的结构化列表 - 支持多种格式
    const patterns = [
        /<strong>([^<]+):<\/strong>\s*([^<\n]+)/gi,  // 标准格式
        /<b>([^<]+):<\/b>\s*([^<\n]+)/gi,           // 粗体格式
        /([^:]+):\s*([A-Z][^<\n]+)/gi               // 简单格式
    ];
    
    let answerMatches = [];
    
    // 尝试不同的模式
    for (const pattern of patterns) {
        answerMatches = [...html.matchAll(pattern)];
        if (answerMatches.length >= 4) break;
    }
    
    console.log(`Fallback found ${answerMatches.length} structured answer groups`);
    
    const groupedWords = [];
    
    // 从结构化答案中提取，保持分组
    answerMatches.forEach((match, i) => {
        const category = match[1].trim();
        const wordsText = match[2].trim();
        
        console.log(`Fallback Group ${i+1}: ${category} -> ${wordsText}`);
        
        // 提取单词，处理各种格式
        const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0);
        
        const cleanWords = [];
        words.forEach(wordPhrase => {
            // 支持各种格式：大写字母、数字、连字符、引号、&符号等
            if (wordPhrase.match(/^[A-Z0-9\s\-"'&\.]+$/)) {
                cleanWords.push(wordPhrase);
            }
        });
        
        if (cleanWords.length > 0) {
            groupedWords.push({
                category: category,
                words: cleanWords
            });
        }
    });
    
    // 如果仍然没有找到足够的分组，使用传统单词提取
    if (groupedWords.length < 4) {
        console.log('Fallback also failed, using traditional word extraction...');
        
        const allWords = [];
        const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
        
        listItems.forEach((item, i) => {
            const cleanText = item.replace(/<[^>]*>/g, ' ');
            const words = cleanText.match(/\b[A-Z]{3,12}\b/g) || [];
            console.log(`List item ${i+1}: ${words.slice(0, 6).join(', ')}`);
            words.forEach(word => {
                if (!allWords.includes(word)) {
                    allWords.push(word);
                }
            });
        });
        
        // 过滤掉常见的非游戏单词
        const excludeWords = [
            'MASHABLE', 'CONNECTIONS', 'NYT', 'PUZZLE', 'ANSWER', 'HINT', 'TODAY',
            'DAILY', 'GAME', 'ARTICLE', 'CONTENT', 'SEARCH', 'RESULT', 'NEWS',
            'TECH', 'SCIENCE', 'SOCIAL', 'MEDIA', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE',
            'SEPTEMBER', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
            'STRONG', 'FIRST', 'ONES', 'FAMOUS', 'WHAT', 'MIGHT', 'REFER'
        ];
        
        const filtered = allWords.filter(word => {
            return !excludeWords.includes(word) && 
                   word.length >= 3 && 
                   word.length <= 12 &&
                   !/^\d+$/.test(word); // 排除纯数字
        });
        
        console.log(`Final filtered words (${filtered.length}): ${filtered.slice(0, 20).join(', ')}`);
        
        return filtered.slice(0, 20); // 返回前20个单词
    }
    
    return groupedWords;
}

// 旧的提取函数（保留作为备用）
function extractForceRefreshWords(html) {
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
    
    console.log(`Found ${answerSections.length} answer sections`);
    
    const allWords = new Set();
    
    // 从答案区域提取单词
    for (const section of answerSections) {
        const cleanText = section.replace(/<[^>]*>/g, ' ');
        
        // 多种单词模式
        const patterns = [
            /\b[A-Z]{3,12}\b/g,           // 全大写单词
            /\b[A-Z][a-z]{2,11}\b/g,      // 首字母大写
            /\b\d+[\-\/][A-Z]+\b/g,       // 数字-字母组合
            /"([A-Za-z\-']{3,12})"/g      // 引号中的单词
        ];
        
        for (const pattern of patterns) {
            const matches = cleanText.match(pattern) || [];
            matches.forEach(word => {
                const cleanWord = word.replace(/['"]/g, '').trim().toUpperCase();
                if (cleanWord.length >= 3 && cleanWord.length <= 12) {
                    allWords.add(cleanWord);
                }
            });
        }
    }
    
    // 如果答案区域的单词不够，从整个HTML提取
    if (allWords.size < 16) {
        const cleanHtml = html.replace(/<[^>]*>/g, ' ');
        const generalWords = cleanHtml.match(/\b[A-Z]{3,12}\b/g) || [];
        generalWords.forEach(word => allWords.add(word));
    }
    
    const wordArray = Array.from(allWords);
    
    // 过滤掉网站相关词汇
    const filtered = wordArray.filter(word => {
        const excludeWords = [
            'MASHABLE', 'CONNECTIONS', 'NYT', 'TIMES', 'PUZZLE', 'GAME',
            'ANSWER', 'HINT', 'TODAY', 'DAILY', 'SOLUTION', 'CATEGORY',
            'HTML', 'CSS', 'JAVASCRIPT', 'ARTICLE', 'CONTENT', 'PAGE',
            'SEARCH', 'RESULT', 'TECH', 'SCIENCE', 'NEWS', 'SOCIAL',
            'SUBSCRIBE', 'NEWSLETTER', 'EMAIL', 'FOLLOW', 'SHARE',
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
        ];
        
        return !excludeWords.includes(word) && 
               word.length >= 3 && 
               word.length <= 12 &&
               /^[A-Z0-9\-]+$/.test(word);
    });
    
    console.log(`Filtered to ${filtered.length} candidate words`);
    
    return filtered.slice(0, 20); // 返回前20个最可能的单词
}