// Cloudflare Pages Function for scheduled tasks
// 支持两种触发方式：
// 1. HTTP POST请求（兼容GitHub Actions）
// 2. Cloudflare Cron Triggers

export async function onRequest(context) {
    const { request, env } = context;
    
    // HTTP请求触发（兼容GitHub Actions）
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const { action, secret } = body;
            
            // 验证密钥（可以在环境变量中设置）
            if (secret !== env.CRON_SECRET && secret !== 'your-secret-key-here') {
                return new Response('Unauthorized', { status: 401 });
            }
            
            const result = await executeScheduledTask(action, env);
            
            return new Response(JSON.stringify({
                success: true,
                timestamp: new Date().toISOString(),
                result: result,
                trigger: 'http'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            console.error('HTTP scheduled task error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                trigger: 'http'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    
    return new Response('Method not allowed', { status: 405 });
}

// Cloudflare Cron Trigger处理函数
export default {
    async scheduled(event, env, ctx) {
        console.log('🕐 Cloudflare Cron Trigger执行:', new Date().toISOString());
        
        try {
            // 执行每日更新任务
            const result = await executeScheduledTask('daily-update', env);
            
            console.log('✅ 定时任务执行成功:', result);
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                result: result,
                trigger: 'cron'
            };
            
        } catch (error) {
            console.error('❌ Cron scheduled task error:', error);
            
            // 可以在这里添加错误通知逻辑
            // 比如发送邮件或Webhook通知
            
            throw error;
        }
    }
};

// 执行定时任务的核心逻辑
async function executeScheduledTask(action, env) {
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
            throw new Error('Invalid action: ' + action);
    }
    
    return result;
}

// 抓取和更新数据
async function scrapeAndUpdateData(env) {
    try {
        console.log('🎯 开始抓取数据...');
        
        // 获取今日谜题数据
        const puzzleData = await fetchTodaysPuzzleData();
        
        if (puzzleData) {
            const today = new Date().toISOString().split('T')[0];
            
            // 存储到 KV
            if (env.CONNECTIONS_KV) {
                try {
                    await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(puzzleData), {
                        expirationTtl: 86400 // 24小时过期
                    });
                    console.log('✅ 数据已保存到KV存储');
                    
                    // 验证存储
                    const stored = await env.CONNECTIONS_KV.get(`puzzle-${today}`, 'json');
                    console.log('✅ KV存储验证:', stored ? '成功' : '失败');
                    
                    return {
                        success: true,
                        date: today,
                        source: puzzleData.source,
                        wordsCount: puzzleData.words.length,
                        kvStored: !!stored,
                        data: puzzleData
                    };
                } catch (kvError) {
                    console.error('❌ KV存储失败:', kvError);
                    return {
                        success: true,
                        date: today,
                        source: puzzleData.source,
                        wordsCount: puzzleData.words.length,
                        kvStored: false,
                        kvError: kvError.message,
                        data: puzzleData
                    };
                }
            } else {
                console.log('❌ CONNECTIONS_KV 绑定不存在');
                return {
                    success: true,
                    date: today,
                    source: puzzleData.source,
                    wordsCount: puzzleData.words.length,
                    kvStored: false,
                    kvError: 'CONNECTIONS_KV binding not found',
                    data: puzzleData
                };
            }
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
        console.log('📝 开始生成文章...');
        
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
                console.log('✅ 文章已保存到KV存储');
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

// 获取今日谜题数据 - 使用完美逻辑
async function fetchTodaysPuzzleData() {
    try {
        console.log('🎯 使用完美抓取逻辑');
        
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

// 解析Mashable HTML内容 - 优化版本
function parseMashableHTML(html, dateStr) {
    try {
        console.log('🎯 开始优化逻辑解析...');
        
        // 1. 找到分组提示区域的开始和结束边界
        const startPhrase = "Today's connections fall into the following categories:";
        const startPos = html.indexOf(startPhrase);
        
        if (startPos === -1) {
            console.log('❌ 未找到开始边界');
            return null;
        }
        
        console.log('✅ 找到开始边界');
        
        // 2. 找到结束边界
        const endPhrase = "Looking for Wordle today?";
        const endPos = html.indexOf(endPhrase, startPos);
        
        if (endPos === -1) {
            console.log('❌ 未找到结束边界');
            return null;
        }
        
        console.log('✅ 找到结束边界');
        
        // 3. 提取分组提示区域
        const hintSection = html.substring(startPos + startPhrase.length, endPos);
        console.log('分组提示区域长度:', hintSection.length);
        
        // 4. 在明确范围内找4个颜色的位置
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        const colorPositions = [];
        
        let currentPos = 0;
        for (const color of colors) {
            const colorPos = hintSection.indexOf(color + ':', currentPos);
            if (colorPos === -1) {
                console.log(`❌ 未找到 ${color} 位置`);
                return null;
            }
            colorPositions.push({ color, pos: colorPos });
            currentPos = colorPos + 1;
        }
        
        console.log('✅ 找到4个颜色位置');
        
        // 5. 提取各个分组的主题名称
        const colorHints = {};
        
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            const startPos = colorPositions[i].pos + color.length + 1; // +1 for ':'
            const endPos = i < colors.length - 1 ? colorPositions[i + 1].pos : hintSection.length;
            
            // 提取主题内容
            let themeContent = hintSection.substring(startPos, endPos);
            
            // 清理主题内容
            themeContent = themeContent
                .replace(/<[^>]*>/g, ' ')           // 去掉HTML标签
                .replace(/\s+/g, ' ')               // 多个空格合并为一个
                .replace(/^\s*[:\-\s]*/, '')        // 去掉开头的冒号、破折号、空格
                .replace(/\s*$/, '')                // 去掉结尾空格
                .trim();
            
            // 🔧 保留必要的引号，只清理多余的引号字符
            // 不要完全去掉引号，因为有些主题需要引号来匹配答案区域
            
            if (themeContent.length > 0 && themeContent.length < 100) {
                colorHints[color] = themeContent;
                console.log(`${color}: "${themeContent}"`);
            } else {
                console.log(`❌ ${color} 主题提取失败: "${themeContent}"`);
                return null;
            }
        }
        
        if (Object.keys(colorHints).length < 4) {
            console.log('❌ 未找到4个完整分组');
            return null;
        }
        
        console.log('✅ 成功提取4个分组名称');
        
        // 找到答案区域
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
        console.log('✅ 找到答案区域并清理转义字符');
        
        // 🔧 同时清理主题中的转义字符，确保边界匹配一致
        Object.keys(colorHints).forEach(color => {
            colorHints[color] = colorHints[color].replace(/\\"/g, '"');
        });
        
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
            console.log('🎉 完美逻辑解析成功!');
            return {
                date: dateStr,
                timestamp: new Date().toISOString(),
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable (Perfect Logic - Cron Trigger)'
            };
        }
        
        console.log(`❌ 只解析出 ${groups.length} 个分组`);
        return null;
        
    } catch (error) {
        console.error('Perfect logic parsing error:', error);
        return null;
    }
}

// 备用谜题数据
function getBackupPuzzle() {
    const today = new Date().toISOString().split('T')[0];
    
    return {
        date: today,
        timestamp: new Date().toISOString(),
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
        source: 'Backup (Cron Trigger)'
    };
}

// 生成文章HTML内容
function generateArticleHTML(puzzleData, date) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections ${formattedDate} - Answers, Hints & Solutions</title>
    <meta name="description" content="Complete solutions and hints for NYT Connections puzzle ${formattedDate}. Get all answers, themes, and solving strategies.">
</head>
<body>
    <h1>NYT Connections ${formattedDate} - Complete Solutions</h1>
    
    <h2>Today's Groups and Answers</h2>`;
    
    puzzleData.groups.forEach((group, index) => {
        const difficultyEmoji = {
            'yellow': '🟡',
            'green': '🟢',
            'blue': '🔵',
            'purple': '🟣'
        }[group.difficulty] || '⚪';
        
        html += `
    <div class="group ${group.difficulty}">
        <h3>${difficultyEmoji} ${group.theme}</h3>
        <p><strong>Words:</strong> ${group.words.join(', ')}</p>
        <p><strong>Hint:</strong> ${group.hint}</p>
    </div>`;
    });
    
    html += `
    <h2>All Words</h2>
    <p>${puzzleData.words.join(', ')}</p>
    
    <p><em>Data source: ${puzzleData.source}</em></p>
    <p><em>Generated: ${new Date().toISOString()}</em></p>
</body>
</html>`;
    
    return html;
}