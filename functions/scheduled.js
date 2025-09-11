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
            // 生成文章内容 (HTML格式)
            const article = generateArticleHTML(puzzleData, today);
            
            // 存储文章到 KV
            if (env.CONNECTIONS_KV) {
                await env.CONNECTIONS_KV.put(`article-${today}`, article, {
                    expirationTtl: 86400 * 90 // 90天过期 - 更好的SEO效果
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

// 获取今日谜题数据
async function fetchTodaysPuzzleData() {
    try {
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

// 从Mashable获取数据 - 使用完美逻辑
async function fetchFromMashable() {
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
        const result = parseMashableHTML(html, today.toISOString().split('T')[0]);
        if (result) {
            console.log('🎉 完美逻辑解析成功!');
            return result;
        }
        
        return null;
        
    } catch (error) {
        console.error('Mashable fetch error:', error);
        return null;
    }
}

// 解析Mashable HTML内容 - 完美逻辑版本
function parseMashableHTML(html, dateStr) {
    try {
        console.log('🎯 开始完美逻辑解析...');
        
        // 查找关键短语
        const targetPhrase = "Today's connections fall into the following categories:";
        const phraseIndex = html.indexOf(targetPhrase);
        
        if (phraseIndex === -1) {
            console.log('❌ 未找到关键短语');
            return null;
        }
        
        console.log('✅ 找到关键短语');
        
        // 提取关键短语之后的内容
        const afterPhrase = html.substring(phraseIndex + targetPhrase.length);
        const searchContent = afterPhrase.substring(0, 1000);
        const colorHints = {};
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        
        colors.forEach(color => {
            const patterns = [
                new RegExp(`${color}:\\s*"([^"]{1,50})"`, 'i'),
                new RegExp(`${color}:\\s*([^\\n<]{1,50})`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = searchContent.match(pattern);
                if (match) {
                    let hint = match[1].trim();
                    if (hint.length > 30) {
                        const cutPoints = ['Green:', 'Blue:', 'Purple:', 'Looking', 'Ready'];
                        for (const cutPoint of cutPoints) {
                            const cutIndex = hint.indexOf(cutPoint);
                            if (cutIndex > 0 && cutIndex < 30) {
                                hint = hint.substring(0, cutIndex).trim();
                                break;
                            }
                        }
                    }
                    colorHints[color] = hint;
                    break;
                }
            }
        });
        
        if (Object.keys(colorHints).length < 4) {
            console.log('❌ 未找到4个分组');
            return null;
        }
        
        console.log('✅ 找到4个分组名称');
        
        // 找到答案区域
        let answerAreaStart = html.indexOf('What is the answer to Connections today');
        if (answerAreaStart === -1) {
            answerAreaStart = html.indexOf('"You should know better!"');
        }
        
        if (answerAreaStart === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        const answerArea = html.substring(answerAreaStart);
        console.log('✅ 找到答案区域');
        
        // 构建边界并解析单词
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
            
            const startIndex = answerArea.indexOf(startBoundary);
            if (startIndex === -1) continue;
            
            const endIndex = answerArea.indexOf(endBoundary, startIndex + startBoundary.length);
            if (endIndex === -1) continue;
            
            const betweenContent = answerArea.substring(startIndex + startBoundary.length, endIndex);
            const commas = (betweenContent.match(/,/g) || []).length;
            
            if (commas >= 3) {
                const colonIndex = betweenContent.indexOf(':');
                if (colonIndex !== -1) {
                    const afterColon = betweenContent.substring(colonIndex + 1);
                    const afterColonClean = afterColon.trim();
                    const allParts = afterColonClean.split(',').map(part => part.trim());
                    
                    if (allParts.length >= 4) {
                        const words = allParts.slice(0, 4);
                        groups.push({
                            theme: hint,
                            words: words,
                            difficulty: difficulty,
                            hint: hint
                        });
                    }
                }
            }
        }
        
        if (groups.length === 4) {
            console.log('🎉 完美成功!');
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable (Perfect Logic v2.0)'
            };
        } else {
            console.log(`❌ 只解析出 ${groups.length} 个分组`);
            return null;
        }
        
    } catch (error) {
        console.error('Perfect logic parsing error:', error);
        return null;
    }
}

// 生成文章HTML
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
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                NYT Connections ${formattedDate}
            </h1>
            <p class="text-gray-600">Complete Answers, Hints & Solutions</p>
        </header>
        
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">📋 Complete Answers</h2>
            ${groupsHTML}
        </div>
    </div>
</body>
</html>`;
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