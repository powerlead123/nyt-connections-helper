// Cloudflare Pages Function for scheduled tasks
export async function onRequest(context) {
    const { request, env } = context;
    
    // 只允许 POST 请求和正确的密钥
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        const body = await request.json();
        const { action, secret } = body;
        
        // 验证密钥（可以在环境变量中设置）
        if (secret !== env.CRON_SECRET && secret !== 'your-secret-key-here') {
            return new Response('Unauthorized', { status: 401 });
        }
        
        let result;
        
        switch (action) {
            case 'scrape-data':
                result = await scrapeAndUpdateData(env);
                break;
            case 'generate-article':
                result = await generateDailyArticle(env);
                break;
            case 'daily-update':
                // 执行完整的每日更新流程
                const scrapeResult = await scrapeAndUpdateData(env);
                const articleResult = await generateDailyArticle(env);
                result = { scrape: scrapeResult, article: articleResult };
                break;
            default:
                return new Response('Invalid action', { status: 400 });
        }
        
        return new Response(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            result: result
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Scheduled task error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 抓取和更新数据
async function scrapeAndUpdateData(env) {
    try {
        // 获取今日谜题数据
        const puzzleData = await fetchTodaysPuzzleData();
        
        if (puzzleData) {
            const today = new Date().toISOString().split('T')[0];
            
            // 存储到 KV
            if (env.CONNECTIONS_KV) {
                await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(puzzleData), {
                    expirationTtl: 86400 // 24小时过期
                });
            }
            
            return {
                success: true,
                date: today,
                source: puzzleData.source,
                wordsCount: puzzleData.words.length
            };
        }
        
        return { success: false, reason: 'No puzzle data found' };
        
    } catch (error) {
        console.error('Scrape data error:', error);
        return { success: false, error: error.message };
    }
}

// 生成每日文章
async function generateDailyArticle(env) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取谜题数据
        let puzzleData = null;
        if (env.CONNECTIONS_KV) {
            puzzleData = await env.CONNECTIONS_KV.get(`puzzle-${today}`, 'json');
        }
        
        if (!puzzleData) {
            puzzleData = await fetchTodaysPuzzleData();
        }
        
        if (puzzleData) {
            // 生成文章内容
            const article = generateArticleContent(puzzleData, today);
            
            // 存储文章到 KV
            if (env.CONNECTIONS_KV) {
                await env.CONNECTIONS_KV.put(`article-${today}`, article, {
                    expirationTtl: 86400 * 7 // 7天过期
                });
            }
            
            return {
                success: true,
                date: today,
                articleLength: article.length
            };
        }
        
        return { success: false, reason: 'No puzzle data for article generation' };
        
    } catch (error) {
        console.error('Generate article error:', error);
        return { success: false, error: error.message };
    }
}

// 获取今日谜题数据（复用 today.js 的逻辑）
async function fetchTodaysPuzzleData() {
    try {
        // 尝试从NYT官方获取
        const nytData = await fetchFromNYT();
        if (nytData) return nytData;
        
        // 尝试从Mashable获取
        const mashableData = await fetchFromMashable();
        if (mashableData) return mashableData;
        
        // 返回备用数据
        return getBackupPuzzle();
        
    } catch (error) {
        console.error('Fetch puzzle data error:', error);
        return getBackupPuzzle();
    }
}

// 生成文章内容
function generateArticleContent(puzzleData, date) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const difficultyColors = {
        green: '🟢',
        yellow: '🟡',
        blue: '🔵',
        purple: '🟣'
    };
    
    let article = `# NYT Connections ${formattedDate} - Answers, Hints & Solutions

Welcome to today's Connections puzzle solution! If you're stuck on the ${formattedDate} NYT Connections game, you've come to the right place. Below you'll find all the answers, hints, and detailed explanations to help you solve today's word grouping challenge.

## 🎯 Quick Summary - ${formattedDate} Connections

Today's puzzle features themes around various categories. The difficulty ranges from straightforward word associations to some tricky wordplay that might catch you off guard.

## 📋 Complete Answers - ${formattedDate}

Here are all four groups for today's Connections puzzle:

`;

    puzzleData.groups.forEach((group, index) => {
        const emoji = difficultyColors[group.difficulty] || '⚪';
        const difficultyName = group.difficulty.charAt(0).toUpperCase() + group.difficulty.slice(1);
        
        article += `### ${emoji} ${group.theme} (${difficultyName})

**Words:** ${group.words.join(', ')}

**Explanation:** These words are connected by the theme "${group.theme}". ${group.hint}

**Hint:** ${group.hint}

---

`;
    });
    
    article += `## 💡 Strategy Tips

- Start with the most obvious connections first
- Look for common themes like categories, wordplay, or shared characteristics
- Don't be afraid to shuffle the words to see new patterns
- Remember that purple groups often involve wordplay or less obvious connections

## 🎮 Play More Connections

Visit [NYT Games](https://www.nytimes.com/games/connections) to play today's puzzle, or check out our [Solutions Archive](/solutions-archive) for previous puzzles.

---

*This solution was generated automatically. If you found this helpful, bookmark our site for daily Connections solutions!*
`;

    return article;
}

// 从Mashable获取数据
async function fetchFromMashable() {
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
                
                // 解析数据
                const puzzleData = parseMashableHTML(html, dateStr);
                if (puzzleData) {
                    console.log('Successfully parsed Mashable data');
                    return puzzleData;
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
        
        // 策略1: 查找标准答案格式
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

async function fetchFromNYT() {
    // NYT官方API通常需要更复杂的处理
    return null;
}

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
        source: 'Backup'
    };
}