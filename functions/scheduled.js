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
            // 优先使用today.js的逻辑获取数据
            puzzleData = await fetchFromTodayAPI(env);
            if (!puzzleData) {
                puzzleData = await fetchTodaysPuzzleData();
            }
        }
        
        if (puzzleData) {
            // 生成文章内容 (HTML格式)
            const article = generateArticleHTML(puzzleData, today);
            
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

// 从today API获取数据（优先使用）
async function fetchFromTodayAPI(env) {
    try {
        // 构造内部请求到today API
        const todayRequest = new Request('https://nyt-connections-helper.pages.dev/api/today', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        // 直接调用today.js的逻辑
        const today = new Date();
        const year = today.getFullYear();
        const month = today.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const day = today.getDate();
        
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 使用与today.js相同的解析逻辑
        const hints = [];
        const correctHintMatch = html.match(/Today's connections fall into the following categories:(.*?)(?=Looking|Ready|$)/i);
        
        if (correctHintMatch) {
            const hintText = correctHintMatch[1];
            const correctPatterns = [
                /Yellow:\s*(.*?)Green:/i,
                /Green:\s*(.*?)Blue:/i,  
                /Blue:\s*(.*?)Purple:/i,
                /Purple:\s*(.*?)(?:Looking|Ready|$)/i
            ];
            
            for (const pattern of correctPatterns) {
                const match = hintText.match(pattern);
                if (match) {
                    hints.push(match[1].trim());
                }
            }
        }
        
        if (hints.length < 4) {
            console.log('无法提取完整的分组名称，回退到备用方法');
            return null;
        }
        
        // 提取答案区域
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            console.log('无法找到答案区域');
            return null;
        }
        
        const answerSection = html.substring(startIndex, endIndex);
        
        // 提取单词
        const wordPattern = /\b[A-Z][A-Z\-0-9]*\b/g;
        const allWords = [...answerSection.matchAll(wordPattern)]
            .map(match => match[0])
            .filter(word => word.length >= 3 && word.length <= 12)
            .filter((word, index, arr) => arr.indexOf(word) === index);
        
        if (allWords.length < 16) {
            console.log('提取的单词数量不足');
            return null;
        }
        
        // 构造分组数据
        const groups = [
            {
                theme: hints[0],
                words: allWords.slice(0, 4),
                difficulty: 'yellow',
                hint: hints[0]
            },
            {
                theme: hints[1], 
                words: allWords.slice(4, 8),
                difficulty: 'green',
                hint: hints[1]
            },
            {
                theme: hints[2],
                words: allWords.slice(8, 12),
                difficulty: 'blue', 
                hint: hints[2]
            },
            {
                theme: hints[3],
                words: allWords.slice(12, 16),
                difficulty: 'purple',
                hint: hints[3]
            }
        ];
        
        const dateStr = today.toISOString().split('T')[0];
        
        return {
            date: dateStr,
            words: allWords.slice(0, 16),
            groups: groups,
            source: 'Mashable (Today API Logic)'
        };
        
    } catch (error) {
        console.error('Today API fetch error:', error);
        return null;
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

// 生成文章HTML (与article/[date].js中的函数相同)
function generateArticleHTML(puzzleData, date) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const difficultyColors = {
        yellow: '🟡',
        green: '🟢',
        blue: '🔵',
        purple: '🟣'
    };
    
    const difficultyNames = {
        yellow: 'Yellow (Easiest)',
        green: 'Green (Easy)',
        blue: 'Blue (Hard)',
        purple: 'Purple (Hardest)'
    };
    
    let groupsHTML = '';
    
    puzzleData.groups.forEach((group, index) => {
        const emoji = difficultyColors[group.difficulty] || '⚪';
        const difficultyName = difficultyNames[group.difficulty] || group.difficulty;
        
        groupsHTML += `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-3">
                ${emoji} ${group.theme} 
                <span class="text-sm font-normal text-gray-600">(${difficultyName})</span>
            </h3>
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">Words:</h4>
                <div class="flex flex-wrap gap-2">
                    ${group.words.map(word => `<span class="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">${word}</span>`).join('')}
                </div>
            </div>
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">Explanation:</h4>
                <p class="text-gray-600">${group.hint || `These words are all related to "${group.theme}".`}</p>
            </div>
        </div>`;
    });
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections ${formattedDate} - Answers & Solutions</title>
    <meta name="description" content="Complete solutions and answers for NYT Connections puzzle on ${formattedDate}. Get hints, explanations, and strategies for today's word grouping challenge.">
    <meta name="keywords" content="NYT Connections, ${date}, answers, solutions, hints, puzzle, word grouping, New York Times">
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="NYT Connections ${formattedDate} - Complete Solutions">
    <meta property="og:description" content="Find all answers and explanations for today's NYT Connections puzzle. Get detailed hints for each group.">
    <meta property="og:type" content="article">
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "NYT Connections ${formattedDate} - Answers & Solutions",
        "description": "Complete solutions for NYT Connections puzzle on ${formattedDate}",
        "datePublished": "${date}T06:00:00Z",
        "author": {
            "@type": "Organization",
            "name": "NYT Connections Helper"
        },
        "publisher": {
            "@type": "Organization",
            "name": "NYT Connections Helper"
        }
    }
    </script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                NYT Connections ${formattedDate}
            </h1>
            <p class="text-gray-600">Complete Answers, Hints & Solutions</p>
            <div class="mt-4">
                <a href="/" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mr-2">
                    Play Today's Puzzle
                </a>
                <a href="/articles" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                    All Solutions
                </a>
            </div>
        </header>
        
        <!-- Quick Summary -->
        <div class="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 class="text-xl font-bold text-blue-800 mb-3">🎯 Quick Summary</h2>
            <p class="text-blue-700">
                Today's Connections puzzle features ${puzzleData.groups.length} themed groups with varying difficulty levels. 
                The categories range from straightforward associations to clever wordplay that might catch you off guard.
            </p>
        </div>
        
        <!-- Complete Answers -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">📋 Complete Answers</h2>
            ${groupsHTML}
        </div>
        
        <!-- Strategy Tips -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-bold text-gray-800 mb-4">💡 Strategy Tips</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700">
                <li>Start with the most obvious connections first - look for clear categories</li>
                <li>Consider multiple meanings of words - they might have unexpected connections</li>
                <li>Think about wordplay, puns, and less obvious relationships</li>
                <li>Yellow groups are usually the easiest, purple groups often involve wordplay</li>
                <li>Don't be afraid to shuffle words around to see new patterns</li>
                <li>If you're stuck, take a break and come back with fresh eyes</li>
            </ul>
        </div>
        
        <!-- About Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">🎮 About NYT Connections</h2>
            <p class="text-gray-700 mb-4">
                Connections is a daily word puzzle game by The New York Times. Players must find groups of four words 
                that share something in common. Each puzzle has exactly four groups, and each group has a different 
                difficulty level indicated by color.
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center">
                    <div class="text-2xl mb-1">🟡</div>
                    <div class="font-semibold">Yellow</div>
                    <div class="text-gray-600">Easiest</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl mb-1">🟢</div>
                    <div class="font-semibold">Green</div>
                    <div class="text-gray-600">Easy</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl mb-1">🔵</div>
                    <div class="font-semibold">Blue</div>
                    <div class="text-gray-600">Hard</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl mb-1">🟣</div>
                    <div class="font-semibold">Purple</div>
                    <div class="text-gray-600">Hardest</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p>&copy; 2025 NYT Connections Helper. This site is not affiliated with The New York Times.</p>
            <p class="text-sm text-gray-400 mt-2">
                Visit <a href="https://www.nytimes.com/games/connections" class="text-blue-400 hover:underline">NYT Games</a> 
                to play the official puzzle.
            </p>
        </div>
    </footer>
</body>
</html>`;
}

// 从Mashable获取数据
async function fetchFromMashable() {
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
        
        // 尝试使用代理服务
        const proxyServices = [
            // 使用allorigins代理
            (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            // 使用cors-anywhere代理
            (url) => `https://cors-anywhere.herokuapp.com/${url}`,
            // 直接访问
            (url) => url
        ];

        for (const baseUrl of urls) {
            for (const proxyFn of proxyServices) {
                try {
                    const url = proxyFn(baseUrl);
                    console.log(`Trying URL: ${url}`);
                    
                    let response;
                    let html;
                    
                    if (url.includes('allorigins.win')) {
                        // allorigins返回JSON格式
                        response = await fetch(url, {
                            method: 'GET',
                            signal: AbortSignal.timeout(15000)
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            html = data.contents;
                        }
                    } else {
                        // 直接请求或cors-anywhere
                        const headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5'
                        };
                        
                        if (url.includes('cors-anywhere')) {
                            headers['X-Requested-With'] = 'XMLHttpRequest';
                        }
                        
                        response = await fetch(url, {
                            method: 'GET',
                            headers: headers,
                            signal: AbortSignal.timeout(15000)
                        });
                        
                        if (response.ok) {
                            html = await response.text();
                        }
                    }
                    
                    if (!html) {
                        console.log(`No HTML content from ${url}`);
                        continue;
                    }
                    
                    console.log(`Successfully fetched HTML, length: ${html.length}`);
                    
                    // 解析数据
                    const puzzleData = parseMashableHTML(html, dateStr);
                    if (puzzleData) {
                        console.log('Successfully parsed Mashable data');
                        return puzzleData;
                    }
                    
                } catch (error) {
                    console.log(`URL ${proxyFn(baseUrl)} failed:`, error.message);
                    continue;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Mashable fetch error:', error);
        return null;
    }
}

// 解析Mashable HTML内容 - 改进版
function parseMashableHTML(html, dateStr) {
    try {
        console.log('开始Mashable HTML解析...');
        
        // 新方法1: 查找今天日期的确认
        const today = new Date();
        const monthName = ['january', 'february', 'march', 'april', 'may', 'june',
                          'july', 'august', 'september', 'october', 'november', 'december'][today.getMonth()];
        const day = today.getDate();
        
        const datePatterns = [
            new RegExp(`${monthName}\\s+${day}`, 'i'),
            new RegExp(`${day}\\s+${monthName}`, 'i'),
            new RegExp(`${today.getMonth() + 1}[\/\\-]${day}`, 'i'),
            new RegExp(`${day}[\/\\-]${today.getMonth() + 1}`, 'i')
        ];
        
        let hasDateMatch = false;
        for (const pattern of datePatterns) {
            if (pattern.test(html)) {
                hasDateMatch = true;
                console.log('找到今天日期匹配');
                break;
            }
        }
        
        if (!hasDateMatch) {
            console.log('警告: 未找到今天日期，可能不是今天的文章');
        }
        
        // 新方法2: 更精确的答案提取
        const improvedAnswerPattern = /(Yellow|Green|Blue|Purple)[\s\S]*?<strong[^>]*>([^<]+)<\/strong>/gi;
        const colorMatches = [...html.matchAll(improvedAnswerPattern)];
        
        console.log(`找到 ${colorMatches.length} 个颜色匹配`);
        
        if (colorMatches.length >= 4) {
            const hints = {};
            colorMatches.forEach(match => {
                const color = match[1];
                const hint = match[2].trim();
                hints[color] = hint;
                console.log(`${color}: ${hint}`);
            });
            
            // 新方法3: 在答案区域查找实际单词
            const answerSectionPattern = /(?:answer|solution)[\s\S]{0,2000}/gi;
            const answerSections = html.match(answerSectionPattern) || [];
            
            console.log(`找到 ${answerSections.length} 个答案区域`);
            
            for (const section of answerSections) {
                // 查找大写单词列表
                const wordListPatterns = [
                    // 逗号分隔的大写单词
                    /([A-Z][A-Z\-\d]*),\s*([A-Z][A-Z\-\d]*),\s*([A-Z][A-Z\-\d]*),\s*([A-Z][A-Z\-\d]*)/g,
                    // 列表项中的单词
                    /<li[^>]*>([A-Z][A-Z\-\d\s]*)<\/li>/gi,
                    // 强调标签中的单词
                    /<(?:strong|b)[^>]*>([A-Z][A-Z\-\d\s]*)<\/(?:strong|b)>/gi
                ];
                
                const foundWords = [];
                
                for (const pattern of wordListPatterns) {
                    const matches = [...section.matchAll(pattern)];
                    for (const match of matches) {
                        if (match.length >= 5) {
                            // 4个单词的组
                            foundWords.push([match[1], match[2], match[3], match[4]]);
                        } else if (match[1]) {
                            // 单个单词
                            const word = match[1].trim().toUpperCase();
                            if (word.length >= 2 && word.length <= 15) {
                                foundWords.push(word);
                            }
                        }
                    }
                }
                
                console.log('在答案区域找到的单词:', foundWords.slice(0, 20));
                
                // 如果找到足够的单词，创建分组
                if (foundWords.length >= 16 || (foundWords.length >= 4 && foundWords[0] instanceof Array)) {
                    const groups = createGroupsFromWords(foundWords, hints);
                    if (groups.length === 4) {
                        console.log('成功从答案区域创建分组');
                        return {
                            date: dateStr,
                            words: groups.flatMap(g => g.words),
                            groups: groups,
                            source: 'Mashable (Improved)'
                        };
                    }
                }
            }
        }
        
        // 方法1: 查找完整的答案格式 (保留原有逻辑作为备用)
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
                        // 动态提取单词 - 不使用硬编码答案
                        const allWords = extractAllWordsFromHTML(html);
                        console.log('提取到的所有单词:', allWords.slice(0, 20));
                        
                        if (allWords.length >= 16) {
                            groups = [
                                {
                                    theme: hints.Yellow,
                                    words: allWords.slice(0, 4),
                                    difficulty: 'yellow',
                                    hint: hints.Yellow
                                },
                                {
                                    theme: hints.Green,
                                    words: allWords.slice(4, 8),
                                    difficulty: 'green',
                                    hint: hints.Green
                                },
                                {
                                    theme: hints.Blue,
                                    words: allWords.slice(8, 12),
                                    difficulty: 'blue',
                                    hint: hints.Blue
                                },
                                {
                                    theme: hints.Purple,
                                    words: allWords.slice(12, 16),
                                    difficulty: 'purple',
                                    hint: hints.Purple
                                }
                            ];
                        }
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

// 从HTML中提取所有可能的Connections单词
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

// 提取Connections风格的单词
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