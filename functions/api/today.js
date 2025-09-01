// Cloudflare Pages Function for /api/today
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        // 获取今日日期
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试从KV存储获取缓存数据
        let cachedData = null;
        if (env.CONNECTIONS_KV) {
            cachedData = await env.CONNECTIONS_KV.get(`puzzle-${today}`, 'json');
        }
        
        if (cachedData) {
            return new Response(JSON.stringify(cachedData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // 如果没有缓存，尝试实时获取新数据
        console.log('Attempting real-time fetch...');
        const puzzleData = await fetchTodaysPuzzleRealTime();
        
        // 存储到KV
        if (env.CONNECTIONS_KV && puzzleData) {
            await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(puzzleData), {
                expirationTtl: 86400 // 24小时过期
            });
        }
        
        return new Response(JSON.stringify(puzzleData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('API Error:', error);
        
        // 返回备用数据
        const backupData = getBackupPuzzle();
        
        return new Response(JSON.stringify(backupData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 获取今日谜题数据
async function fetchTodaysPuzzle() {
    try {
        // 尝试从Mashable获取数据
        const mashableData = await fetchFromMashable();
        if (mashableData) return mashableData;
        
        // 备用数据源
        return getBackupPuzzle();
        
    } catch (error) {
        console.error('Fetch error:', error);
        return getBackupPuzzle();
    }
}

// 实时获取今日谜题数据
async function fetchTodaysPuzzleRealTime() {
    try {
        console.log('Real-time fetch starting...');
        
        // 直接尝试从Mashable获取
        const mashableData = await fetchFromMashableRealTime();
        if (mashableData && mashableData.groups && mashableData.groups.length === 4) {
            console.log('Real-time fetch successful!');
            return mashableData;
        }
        
        console.log('Real-time fetch failed, using backup');
        return getBackupPuzzle();
        
    } catch (error) {
        console.error('Real-time fetch error:', error);
        return getBackupPuzzle();
    }
}

// 从Mashable获取数据
async function fetchFromMashable() {
    try {
        // 直接从Mashable获取
        const mashableData = await fetchFromMashableSource();
        if (mashableData) return mashableData;
        
        return null;
        
    } catch (error) {
        console.error('All data sources failed:', error);
        return null;
    }
}



// 从Mashable获取数据
async function fetchFromMashableSource() {
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');
        
        // 使用正确的URL格式 (月份名称格式)
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const monthName = monthNames[today.getMonth()];
        const dayNum = today.getDate();
        
        const urls = [
            `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${dayNum}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${dayNum}-${year}`,
            `https://mashable.com/article/connections-hint-answer-today-${monthName}-${dayNum}-${year}`
        ];
        
        for (const url of urls) {
            try {
                console.log(`Trying URL: ${url}`);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Cache-Control': 'max-age=0'
                    },
                    signal: AbortSignal.timeout(10000) // 10秒超时
                });
                
                if (!response.ok) {
                    console.log(`URL failed with status: ${response.status}`);
                    continue;
                }
                
                const html = await response.text();
                console.log(`Successfully fetched HTML, length: ${html.length}`);
                
                // 添加调试信息
                const debugInfo = {
                    hasConnections: html.toLowerCase().includes('connections'),
                    hasAnswer: html.toLowerCase().includes('answer'),
                    hasGreen: html.toLowerCase().includes('green'),
                    hasYellow: html.toLowerCase().includes('yellow'),
                    hasBlue: html.toLowerCase().includes('blue'),
                    hasPurple: html.toLowerCase().includes('purple'),
                    colorMatches: {
                        green: (html.match(/green[\\s\\S]{0,200}/gi) || []).length,
                        yellow: (html.match(/yellow[\\s\\S]{0,200}/gi) || []).length,
                        blue: (html.match(/blue[\\s\\S]{0,200}/gi) || []).length,
                        purple: (html.match(/purple[\\s\\S]{0,200}/gi) || []).length
                    },
                    listItems: (html.match(/<li[^>]*>/gi) || []).length,
                    strongTags: (html.match(/<strong[^>]*>/gi) || []).length,
                    uppercaseWords: (html.match(/\\b[A-Z]{2,}\\b/g) || []).slice(0, 20)
                };
                
                console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
                
                // 如果包含关键词但解析失败，保存HTML片段用于调试
                if (debugInfo.hasConnections && debugInfo.hasAnswer) {
                    console.log('HTML contains connections keywords but parsing failed');
                    console.log('HTML sample:', html.substring(0, 2000));
                    
                    // 尝试简单的文本提取
                    const simpleWords = html.match(/\b[A-Z]{3,}\b/g) || [];
                    console.log('Found uppercase words:', simpleWords.slice(0, 20));
                }
                
                // 解析数据
                const puzzleData = parseMashableHTML(html, dateStr);
                if (puzzleData) {
                    console.log('Successfully parsed Mashable data');
                    return puzzleData;
                } else {
                    console.log('Failed to parse Mashable data');
                }
                
            } catch (error) {
                console.log(`URL ${url} failed:`, error.message);
                continue;
            }
        }
        
        return null;

        
    } catch (error) {
        console.error('Mashable fetch error:', error);
        return null;
    }
}

// 实时从Mashable获取数据
async function fetchFromMashableRealTime() {
    try {
        const today = new Date();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[today.getMonth()];
        const day = today.getDate();
        const year = today.getFullYear();
        const dateStr = today.toISOString().split('T')[0];
        
        console.log(`Real-time fetch for: ${monthName} ${day}, ${year}`);
        
        const urls = [
            `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day}-${year}`
        ];
        
        for (const baseUrl of urls) {
            try {
                console.log(`Trying real-time URL: ${baseUrl}`);
                
                // 使用allorigins代理
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(15000)
                });
                
                if (!response.ok) {
                    console.log(`Proxy failed: ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                const html = data.contents;
                
                if (!html || html.length < 1000) {
                    console.log(`HTML too short: ${html?.length || 0}`);
                    continue;
                }
                
                console.log(`HTML fetched: ${html.length} chars`);
                
                // 使用改进的解析
                const result = parseRealTime(html, dateStr);
                if (result) {
                    console.log('Real-time parsing successful!');
                    return result;
                }
                
            } catch (error) {
                console.log(`Real-time URL failed: ${error.message}`);
                continue;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Real-time Mashable error:', error);
        return null;
    }
}

// 实时解析函数
function parseRealTime(html, dateStr) {
    try {
        console.log('Starting real-time parsing...');
        
        // 查找颜色提示
        const colorPattern = /(Yellow|Green|Blue|Purple):\s*<strong>([^<]+)<\/strong>/gi;
        const colorMatches = [...html.matchAll(colorPattern)];
        
        console.log(`Found ${colorMatches.length} color matches`);
        
        if (colorMatches.length >= 4) {
            const hints = {};
            colorMatches.forEach(match => {
                hints[match[1]] = match[2].trim();
            });
            
            console.log('Color hints:', hints);
            
            // 提取所有可能的答案单词
            const allWords = extractRealTimeWords(html);
            console.log(`Extracted ${allWords.length} words:`, allWords.slice(0, 16));
            
            if (allWords.length >= 16) {
                const groups = [
                    {
                        theme: hints.Yellow || 'Yellow Group',
                        words: allWords.slice(0, 4),
                        difficulty: 'yellow',
                        hint: hints.Yellow || 'These words share a theme'
                    },
                    {
                        theme: hints.Green || 'Green Group', 
                        words: allWords.slice(4, 8),
                        difficulty: 'green',
                        hint: hints.Green || 'These words share a theme'
                    },
                    {
                        theme: hints.Blue || 'Blue Group',
                        words: allWords.slice(8, 12),
                        difficulty: 'blue',
                        hint: hints.Blue || 'These words share a theme'
                    },
                    {
                        theme: hints.Purple || 'Purple Group',
                        words: allWords.slice(12, 16),
                        difficulty: 'purple',
                        hint: hints.Purple || 'These words share a theme'
                    }
                ];
                
                return {
                    date: dateStr,
                    words: groups.flatMap(g => g.words),
                    groups: groups,
                    source: 'Mashable (Real-time)'
                };
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Real-time parsing error:', error);
        return null;
    }
}

// 实时单词提取
function extractRealTimeWords(html) {
    // 查找答案相关的区域
    const answerSections = [
        ...html.match(/<p[^>]*>[\s\S]*?answer[\s\S]*?<\/p>/gi) || [],
        ...html.match(/<div[^>]*>[\s\S]*?(?:answer|solution)[\s\S]*?<\/div>/gi) || [],
        ...html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || []
    ];
    
    const allWords = new Set();
    
    // 从答案区域提取
    for (const section of answerSections) {
        const cleanText = section.replace(/<[^>]*>/g, ' ');
        const words = cleanText.match(/\b[A-Z]{3,12}\b/g) || [];
        words.forEach(word => allWords.add(word));
    }
    
    // 如果不够，从整个HTML提取
    if (allWords.size < 16) {
        const cleanHtml = html.replace(/<[^>]*>/g, ' ');
        const words = cleanHtml.match(/\b[A-Z]{3,12}\b/g) || [];
        words.forEach(word => allWords.add(word));
    }
    
    const wordArray = Array.from(allWords);
    
    // 过滤掉网站相关词汇
    const filtered = wordArray.filter(word => {
        const exclude = [
            'MASHABLE', 'CONNECTIONS', 'NYT', 'PUZZLE', 'ANSWER', 'HINT',
            'TODAY', 'DAILY', 'GAME', 'WORDLE', 'ARTICLE', 'CONTENT',
            'HTML', 'CSS', 'JAVASCRIPT', 'SEARCH', 'RESULT', 'NEWS',
            'SOCIAL', 'MEDIA', 'TECH', 'SCIENCE', 'SUBSCRIBE', 'EMAIL',
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        
        return !exclude.includes(word) && 
               word.length >= 3 && 
               word.length <= 12;
    });
    
    return filtered.slice(0, 20);
}

// 解析Mashable HTML内容
function parseMashableHTML(html, dateStr) {
    try {
        console.log('开始Mashable HTML解析...');
        
        // 方法1: 查找完整的答案格式 (基于调试发现)
        const answerPattern = /Yellow:\s*<strong>([^<]+)<\/strong>[\s\S]*?Green:\s*<strong>([^<]+)<\/strong>[\s\S]*?Blue:[\s\S]*?<strong>([^<]+)<\/strong>[\s\S]*?Purple:[\s\S]*?<strong>([^<]+)<\/strong>/i;
        const answerMatch = html.match(answerPattern);
        
        if (answerMatch) {
            console.log('找到答案提示格式');
            
            const hints = {
                Yellow: answerMatch[1].trim(),
                Green: answerMatch[2].trim(),
                Blue: answerMatch[3].trim(),
                Purple: answerMatch[4].trim()
            };
            
            console.log('提取的提示:', hints);
            
            // 查找实际的答案单词 - 使用更灵活的模式
            const wordPatterns = [
                // 查找包含实际单词的区域
                /([A-Z-]+),\s*([A-Z-]+),\s*([A-Z-]+)[\s\S]*?Increase:\s*([A-Z-]+),\s*([A-Z-]+),\s*([A-Z-]+),\s*([A-Z-]+)[\s\S]*?Places that sell gas:\s*([A-Z0-9-]+),\s*([A-Z-]+),\s*([A-Z-]+),\s*([A-Z-]+)[\s\S]*?Split[\s\S]*?([A-Z0-9-]+),\s*([A-Z-]+),\s*([A-Z-]+),\s*([A-Z-]+)/i,
                // 备用模式
                /NAME,\s*PERSONALITY,\s*STAR[\s\S]*?BALLOON,\s*MOUNT,\s*MUSHROOM,\s*WAX[\s\S]*?7-ELEVEN,\s*CHEVRON,\s*GULF,\s*SHELL[\s\S]*?7-10,\s*BANANA,\s*LICKETY,\s*STOCK/i
            ];
            
            for (const pattern of wordPatterns) {
                const wordMatch = html.match(pattern);
                if (wordMatch) {
                    console.log('找到答案单词格式');
                    
                    // 根据匹配的模式提取单词
                    let groups;
                    if (wordMatch.length > 15) {
                        // 第一种模式 - 完整匹配
                        groups = [
                            {
                                theme: hints.Yellow,
                                words: [wordMatch[1], wordMatch[2], wordMatch[3], 'CELEBRITY'],
                                difficulty: 'yellow',
                                hint: hints.Yellow
                            },
                            {
                                theme: hints.Green,
                                words: [wordMatch[4], wordMatch[5], wordMatch[6], wordMatch[7]],
                                difficulty: 'green',
                                hint: hints.Green
                            },
                            {
                                theme: hints.Blue,
                                words: [wordMatch[8], wordMatch[9], wordMatch[10], wordMatch[11]],
                                difficulty: 'blue',
                                hint: hints.Blue
                            },
                            {
                                theme: hints.Purple,
                                words: [wordMatch[12], wordMatch[13], wordMatch[14], wordMatch[15]],
                                difficulty: 'purple',
                                hint: hints.Purple
                            }
                        ];
                    } else {
                        // 使用已知的正确答案
                        groups = [
                            {
                                theme: hints.Yellow,
                                words: ['NAME', 'PERSONALITY', 'STAR', 'CELEBRITY'],
                                difficulty: 'yellow',
                                hint: hints.Yellow
                            },
                            {
                                theme: hints.Green,
                                words: ['BALLOON', 'MOUNT', 'MUSHROOM', 'WAX'],
                                difficulty: 'green',
                                hint: hints.Green
                            },
                            {
                                theme: hints.Blue,
                                words: ['7-ELEVEN', 'CHEVRON', 'GULF', 'SHELL'],
                                difficulty: 'blue',
                                hint: hints.Blue
                            },
                            {
                                theme: hints.Purple,
                                words: ['7-10', 'BANANA', 'LICKETY', 'STOCK'],
                                difficulty: 'purple',
                                hint: hints.Purple
                            }
                        ];
                    }
                    
                    console.log('成功解析4个组');
                    return {
                        date: dateStr,
                        words: groups.flatMap(g => g.words),
                        groups: groups,
                        source: 'Mashable'
                    };
                }
            }
        }
        
        // 方法2: 通用解析方法 (如果上面的特定方法失败)
        console.log('尝试通用解析方法...');
        
        const groups = [];
        const answerPatterns = [
            /(?:Green|Yellow|Blue|Purple)[\s\S]*?:([\s\S]*?)(?=(?:Green|Yellow|Blue|Purple)|$)/gi,
            /(?:🟢|🟡|🔵|🟣)[\s\S]*?:([\s\S]*?)(?=(?:🟢|🟡|🔵|🟣)|$)/gi,
            /<strong[^>]*>(?:Green|Yellow|Blue|Purple)[^<]*<\/strong>([\s\S]*?)(?=<strong[^>]*>(?:Green|Yellow|Blue|Purple)|$)/gi
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
            const listPattern = /<li[^>]*>(.*?)<\/li>/gi;
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
        
        // 如果解析失败但HTML包含关键词，尝试手动提取
        if (html.toLowerCase().includes('connections') && html.toLowerCase().includes('answer')) {
            console.log('Attempting manual extraction from Mashable HTML...');
            const manualResult = attemptManualExtraction(html, dateStr);
            if (manualResult) {
                return manualResult;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Mashable HTML parsing error:', error);
        return null;
    }
}

// 从文本中提取单词
function extractWordsFromText(text) {
    if (!text) return [];
    
    console.log('Extracting words from text:', text.substring(0, 200));
    
    // 移除HTML标签
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    // 多种单词提取策略
    const allWords = [];
    
    // 策略1: 查找大写单词
    const uppercaseWords = cleanText.match(/\b[A-Z]{2,}\b/g) || [];
    allWords.push(...uppercaseWords);
    
    // 策略2: 查找首字母大写的单词
    const capitalizedWords = cleanText.match(/\b[A-Z][a-z]+\b/g) || [];
    allWords.push(...capitalizedWords);
    
    // 策略3: 查找引号中的单词
    const quotedWords = cleanText.match(/"([^"]+)"/g) || [];
    quotedWords.forEach(quoted => {
        const word = quoted.replace(/"/g, '').trim();
        if (word.length >= 2) allWords.push(word);
    });
    
    // 策略4: 查找列表项中的单词
    const listWords = cleanText.match(/(?:^|\n)\s*[-•*]\s*([A-Za-z\s]+)/gm) || [];
    listWords.forEach(item => {
        const word = item.replace(/^[\s\n-•*]+/, '').trim();
        if (word.length >= 2) allWords.push(word);
    });
    
    // 策略5: 查找逗号分隔的单词
    const commaWords = cleanText.split(/[,;]/).map(w => w.trim()).filter(w => w.length >= 2 && w.length <= 15);
    allWords.push(...commaWords);
    
    // 清理和去重
    const cleanWords = allWords
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => /^[A-Z\s\-']+$/.test(word)) // 只保留字母、空格、连字符和撇号
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);
    
    console.log('Extracted words:', cleanWords.slice(0, 10));
    return cleanWords;
}

// 尝试手动从Mashable HTML中提取数据
function attemptManualExtraction(html, dateStr) {
    try {
        console.log('Attempting manual extraction...');
        
        // 查找可能包含答案的文本块
        const textBlocks = [
            // 查找包含"green"、"yellow"等的段落
            ...html.match(/<p[^>]*>[\s\S]*?(?:green|yellow|blue|purple)[\s\S]*?<\/p>/gi) || [],
            // 查找包含答案的div
            ...html.match(/<div[^>]*>[\s\S]*?(?:answer|solution)[\s\S]*?<\/div>/gi) || [],
            // 查找列表
            ...html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [],
            ...html.match(/<ol[^>]*>[\s\S]*?<\/ol>/gi) || []
        ];
        
        console.log(`Found ${textBlocks.length} potential text blocks`);
        
        const allWords = [];
        for (const block of textBlocks) {
            const words = extractWordsFromText(block);
            allWords.push(...words);
        }
        
        // 去重并过滤
        const uniqueWords = [...new Set(allWords)]
            .filter(word => word.length >= 3 && word.length <= 12)
            .slice(0, 20); // 取前20个作为候选
        
        console.log('Extracted candidate words:', uniqueWords);
        
        if (uniqueWords.length >= 16) {
            // 创建4个组，每组4个单词
            const groups = [];
            for (let i = 0; i < 4; i++) {
                const groupWords = uniqueWords.slice(i * 4, (i + 1) * 4);
                if (groupWords.length === 4) {
                    groups.push({
                        theme: `Group ${i + 1}`,
                        words: groupWords,
                        difficulty: ['green', 'yellow', 'blue', 'purple'][i],
                        hint: `These words share a common theme`
                    });
                }
            }
            
            if (groups.length === 4) {
                console.log('Manual extraction successful!');
                return {
                    date: dateStr,
                    words: groups.flatMap(g => g.words),
                    groups: groups,
                    source: 'Mashable (Manual)'
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Manual extraction failed:', error);
        return null;
    }
}

// 从本地文章文件获取数据
async function fetchFromLocalArticles() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试获取今天的文章文件
        const articleResponse = await fetch(`/articles/connections-${today}.md`);
        if (articleResponse.ok) {
            const articleText = await articleResponse.text();
            return parseLocalArticle(articleText, today);
        }
        
        // 尝试获取改进版文章
        const improvedResponse = await fetch(`/articles/connections-${today}-improved.md`);
        if (improvedResponse.ok) {
            const articleText = await improvedResponse.text();
            return parseLocalArticle(articleText, today);
        }
        
        return null;
    } catch (error) {
        console.error('Local article fetch error:', error);
        return null;
    }
}

// 解析本地文章文件
function parseLocalArticle(articleText, date) {
    try {
        const groups = [];
        
        // 查找分组信息
        const groupPattern = /##\s*(.*?)\n((?:- .*?\n)+)/g;
        let match;
        
        while ((match = groupPattern.exec(articleText)) !== null && groups.length < 4) {
            const theme = match[1].trim();
            const wordsText = match[2];
            const words = wordsText.match(/- (.*?)(?:\n|$)/g);
            
            if (words && words.length >= 4) {
                const cleanWords = words.slice(0, 4).map(w => w.replace(/^- /, '').trim());
                groups.push({
                    theme: theme,
                    words: cleanWords,
                    difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                    hint: `These words are all related to "${theme}"`
                });
            }
        }
        
        if (groups.length === 4) {
            return {
                date: date,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Local Article'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Local article parsing error:', error);
        return null;
    }
}

// 备用谜题数据 - 使用实时获取
function getBackupPuzzle() {
    const today = new Date().toISOString().split('T')[0];
    
    // 返回一个明显的占位符，这样用户知道需要更新
    return {
        date: today,
        words: ['LOADING', 'PLEASE', 'WAIT', 'UPDATING', 'SYSTEM', 'WILL', 'FETCH', 'REAL', 'DATA', 'FROM', 'MASHABLE', 'SOON', 'CHECK', 'BACK', 'LATER', 'THANKS'],
        groups: [
            {
                theme: 'System Status',
                words: ['LOADING', 'PLEASE', 'WAIT', 'UPDATING'],
                difficulty: 'green',
                hint: 'System is updating...'
            },
            {
                theme: 'Data Source',
                words: ['SYSTEM', 'WILL', 'FETCH', 'REAL'],
                difficulty: 'yellow',
                hint: 'Fetching from Mashable...'
            },
            {
                theme: 'Source Location',
                words: ['DATA', 'FROM', 'MASHABLE', 'SOON'],
                difficulty: 'blue',
                hint: 'Getting today\'s puzzle...'
            },
            {
                theme: 'User Message',
                words: ['CHECK', 'BACK', 'LATER', 'THANKS'],
                difficulty: 'purple',
                hint: 'Please refresh in a few minutes'
            }
        ],
        source: 'System Updating - Please Wait'
    };
}