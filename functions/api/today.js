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
        
        // 如果没有缓存，获取新数据
        const puzzleData = await fetchTodaysPuzzle();
        
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

// 从多个数据源获取数据
async function fetchFromMashable() {
    try {
        // 尝试从NYT官方API获取（如果可用）
        const nytData = await fetchFromNYT();
        if (nytData) return nytData;
        
        // 尝试从Mashable获取
        const mashableData = await fetchFromMashableSource();
        if (mashableData) return mashableData;
        
        // 尝试从本地文章文件获取
        const localData = await fetchFromLocalArticles();
        if (localData) return localData;
        
        return null;
        
    } catch (error) {
        console.error('All data sources failed:', error);
        return null;
    }
}

// 尝试从NYT官方获取数据
async function fetchFromNYT() {
    try {
        // NYT Connections 游戏页面
        const response = await fetch('https://www.nytimes.com/games/connections', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) return null;
        
        const html = await response.text();
        
        // 查找游戏数据
        const gameDataMatch = html.match(/window\.gameData\s*=\s*({.*?});/s);
        if (gameDataMatch) {
            const gameData = JSON.parse(gameDataMatch[1]);
            if (gameData && gameData.today) {
                return parseNYTGameData(gameData.today);
            }
        }
        
        return null;
    } catch (error) {
        console.error('NYT fetch error:', error);
        return null;
    }
}

// 解析NYT游戏数据
function parseNYTGameData(todayData) {
    try {
        if (!todayData.groups || !todayData.startingGroups) return null;
        
        const groups = todayData.groups.map((group, index) => ({
            theme: group.theme || `Group ${index + 1}`,
            words: group.members || [],
            difficulty: ['green', 'yellow', 'blue', 'purple'][group.level] || 'green',
            hint: `These words are all related to "${group.theme}"`
        }));
        
        const words = groups.flatMap(g => g.words);
        
        return {
            date: new Date().toISOString().split('T')[0],
            words: words,
            groups: groups,
            source: 'NYT Official'
        };
    } catch (error) {
        console.error('NYT data parsing error:', error);
        return null;
    }
}

// 从Mashable获取数据
async function fetchFromMashableSource() {
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');
        
        // 尝试多种URL格式
        const urls = [
            `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${month}-${day}-${year}`,
            `https://mashable.com/article/connections-hint-answer-today-${month}-${day}-${year}`
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

// 解析Mashable HTML内容
function parseMashableHTML(html, dateStr) {
    try {
        const groups = [];
        
        // 多种解析策略
        
        // 策略1: 查找标准答案格式 - 更宽松的模式
        console.log('Starting pattern matching...');
        const answerPatterns = [
            // 基本颜色模式（大小写不敏感）
            /(?:green|yellow|blue|purple)[\s\S]*?:([\s\S]*?)(?=(?:green|yellow|blue|purple)|$)/gi,
            /(?:Green|Yellow|Blue|Purple)[\s\S]*?:([\s\S]*?)(?=(?:Green|Yellow|Blue|Purple)|$)/gi,
            // 表情符号模式
            /(?:🟢|🟡|🔵|🟣)[\s\S]*?:([\s\S]*?)(?=(?:🟢|🟡|🔵|🟣)|$)/gi,
            // HTML标签模式
            /<strong[^>]*>(?:Green|Yellow|Blue|Purple)[^<]*<\/strong>([\s\S]*?)(?=<strong[^>]*>(?:Green|Yellow|Blue|Purple)|$)/gi,
            // 查找"答案"或"solution"后的内容
            /(?:answer|solution)[\s\S]*?:([\s\S]*?)(?=(?:answer|solution|green|yellow|blue|purple)|$)/gi,
            // 更宽松的匹配 - 查找连续的大写单词组
            /([A-Z]{3,}[\s,]*[A-Z]{3,}[\s,]*[A-Z]{3,}[\s,]*[A-Z]{3,})/g
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

// 备用谜题数据 - 使用今天的真实数据
function getBackupPuzzle() {
    const today = new Date().toISOString().split('T')[0];
    
    return {
        date: today,
        words: ['NET', 'SNARE', 'TANGLE', 'WEB', 'CUP', 'KETTLE', 'TEABAG', 'WATER', 'DIAMOND', 'NAILS', 'ROCK', 'STEEL', 'CANTAB', 'CYBERSPACE', 'ICECAPS', 'MAKESHIFT'],
        groups: [
            {
                theme: 'Places to get trapped',
                words: ['NET', 'SNARE', 'TANGLE', 'WEB'],
                difficulty: 'green',
                hint: 'Think about things that can catch or ensnare something'
            },
            {
                theme: 'Used for tea',
                words: ['CUP', 'KETTLE', 'TEABAG', 'WATER'],
                difficulty: 'yellow',
                hint: 'Essential items for making and serving tea'
            },
            {
                theme: 'Associated with hardness',
                words: ['DIAMOND', 'NAILS', 'ROCK', 'STEEL'],
                difficulty: 'blue',
                hint: 'All of these things are known for being very hard or tough'
            },
            {
                theme: 'Ending with keyboard keys',
                words: ['CANTAB', 'CYBERSPACE', 'ICECAPS', 'MAKESHIFT'],
                difficulty: 'purple',
                hint: 'Look at the last few letters of each word - they spell out keys on your keyboard'
            }
        ],
        source: 'Today\'s Puzzle'
    };
}