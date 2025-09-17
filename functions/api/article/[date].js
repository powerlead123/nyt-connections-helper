// Cloudflare Pages Function for displaying daily articles
export async function onRequest(context) {
    const { request, env, params } = context;
    
    try {
        const date = params.date;
        
        // 验证日期格式
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return new Response('Invalid date format. Use YYYY-MM-DD', { 
                status: 400,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // 从KV存储获取文章
        let article = null;
        if (env.CONNECTIONS_KV) {
            article = await env.CONNECTIONS_KV.get(`article-${date}`);
        }
        
        if (article) {
            // 返回存储的文章内容
            return new Response(article, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600' // 1小时缓存
                }
            });
        }
        
        // 如果没有找到文章，尝试生成一个
        console.log(`No article found for ${date}, attempting to generate...`);
        
        // 获取该日期的谜题数据
        let puzzleData = null;
        
        // 如果是今天的日期，优先使用today API的数据
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
            try {
                // 直接调用today API逻辑获取最新数据
                puzzleData = await fetchTodayPuzzleData();
                console.log('Using fresh today API data for article generation');
            } catch (error) {
                console.log('Failed to fetch today API data, falling back to KV storage');
            }
        }
        
        // 如果没有获取到今日数据，尝试从KV存储获取
        if (!puzzleData && env.CONNECTIONS_KV) {
            puzzleData = await env.CONNECTIONS_KV.get(`puzzle-${date}`, 'json');
        }
        
        if (puzzleData) {
            // 生成文章
            const generatedArticle = generateArticleHTML(puzzleData, date);
            
            // 存储生成的文章
            if (env.CONNECTIONS_KV) {
                await env.CONNECTIONS_KV.put(`article-${date}`, generatedArticle, {
                    expirationTtl: 86400 * 90 // 90天过期 - 更好的SEO效果
                });
            }
            
            return new Response(generatedArticle, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }
        
        // 如果都没有，返回404
        return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article Not Found - NYT Connections</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 class="text-2xl font-bold text-gray-800 mb-4">Article Not Found</h1>
            <p class="text-gray-600 mb-4">
                No article found for ${date}. The article may not have been generated yet or the date may be invalid.
            </p>
            <a href="/" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Back to Today's Puzzle
            </a>
        </div>
    </div>
</body>
</html>`, {
            status: 404,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Article API error:', error);
        
        return new Response('Internal Server Error', {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 获取今日谜题数据（与today.js相同的逻辑）
async function fetchTodayPuzzleData() {
    try {
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
        
        // 提取提示区域的分组名称
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
            throw new Error('无法提取完整的分组名称');
        }
        
        // 提取答案区域
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('无法找到答案区域');
        }
        
        const answerSection = html.substring(startIndex, endIndex);
        
        // 提取单词
        const wordPattern = /\b[A-Z][A-Z\-0-9]*\b/g;
        const allWords = [...answerSection.matchAll(wordPattern)]
            .map(match => match[0])
            .filter(word => word.length >= 3 && word.length <= 12)
            .filter((word, index, arr) => arr.indexOf(word) === index);
        
        if (allWords.length < 16) {
            throw new Error('提取的单词数量不足');
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
            source: 'Mashable (Article API)'
        };
        
    } catch (error) {
        console.error('Today puzzle fetch error:', error);
        return null;
    }
}

// 生成SEO优化的文章HTML内容
function generateArticleHTML(puzzleData, date) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const shortDate = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    // 生成更丰富的SEO内容
    const difficultyLevels = {
        'yellow': { name: 'Yellow (Easiest)', emoji: '🟡', description: 'straightforward category' },
        'green': { name: 'Green (Easy)', emoji: '🟢', description: 'moderately easy category' },
        'blue': { name: 'Blue (Medium)', emoji: '🔵', description: 'challenging category' },
        'purple': { name: 'Purple (Hardest)', emoji: '🟣', description: 'most difficult category' }
    };
    
    // 按难度顺序排序
    const orderedGroups = ['yellow', 'green', 'blue', 'purple'].map(difficulty => 
        puzzleData.groups.find(group => group.difficulty === difficulty)
    ).filter(Boolean);
    
    let groupsHTML = '';
    orderedGroups.forEach((group, index) => {
        const difficultyInfo = difficultyLevels[group.difficulty];
        
        groupsHTML += `
        <div class="group ${group.difficulty}">
            <h3>${difficultyInfo.emoji} ${difficultyInfo.name}: ${group.theme}</h3>
            <div class="words">Words: ${group.words.join(', ')}</div>
            <div class="hint">💡 Hint: ${group.hint}</div>
            <p>This ${difficultyInfo.description} connects words that ${group.hint.toLowerCase()}.</p>
        </div>`;
    });
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections ${shortDate} - Complete Answers, Hints & Solutions</title>
    <meta name="description" content="Find all answers and hints for NYT Connections puzzle ${shortDate}. Complete solutions with explanations for all four categories: ${puzzleData.groups.map(g => g.theme).join(', ')}.">
    <meta name="keywords" content="NYT Connections, New York Times Connections, ${shortDate}, puzzle answers, word game, daily puzzle, hints, solutions">
    <meta property="og:title" content="NYT Connections ${shortDate} - Complete Solutions">
    <meta property="og:description" content="Complete answers and hints for today's NYT Connections puzzle with detailed explanations.">
    <meta property="og:type" content="article">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .group { margin: 20px 0; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .yellow { background-color: #fff9c4; border-left-color: #eab308; }
        .green { background-color: #dcfce7; border-left-color: #16a34a; }
        .blue { background-color: #dbeafe; border-left-color: #2563eb; }
        .purple { background-color: #f3e8ff; border-left-color: #9333ea; }
        .words { font-weight: bold; font-size: 1.1em; margin: 10px 0; }
        .hint { font-style: italic; color: #666; }
        .intro { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .tips { background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>NYT Connections ${formattedDate} - Complete Answers & Solutions</h1>
    
    <div class="intro">
        <p>Welcome to today's NYT Connections puzzle solution! Below you'll find all the answers, hints, and explanations for the ${shortDate} puzzle. Each group is color-coded by difficulty level, from yellow (easiest) to purple (hardest).</p>
    </div>

    <h2>🎯 Complete Solutions by Difficulty</h2>`;
    
    html += groupsHTML;
    
    html += `
    <div class="tips">
        <h2>🧩 How to Solve NYT Connections</h2>
        <p>NYT Connections is a daily word puzzle where you need to find groups of four words that share something in common. Here are some tips:</p>
        <ul>
            <li><strong>Start with obvious connections:</strong> Look for clear categories like colors, animals, or professions</li>
            <li><strong>Watch for wordplay:</strong> Purple categories often involve puns, word parts, or clever connections</li>
            <li><strong>Eliminate red herrings:</strong> Some words might seem to fit multiple categories</li>
            <li><strong>Use process of elimination:</strong> If you're sure about three words, the fourth often becomes clear</li>
        </ul>
    </div>

    <h2>📝 All 16 Words</h2>
    <p>Today's puzzle featured these 16 words: <strong>${puzzleData.words.join(', ')}</strong></p>
    
    <div class="intro">
        <h2>🎮 About NYT Connections</h2>
        <p>NYT Connections is a daily word puzzle game by The New York Times. Players must identify four groups of four words that share a common theme. The categories range from straightforward (yellow) to tricky wordplay (purple). Each puzzle has exactly one solution, and you have four mistakes before the game ends.</p>
        
        <p>New puzzles are released daily at midnight ET. Come back tomorrow for the next puzzle solution!</p>
    </div>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em;">
        <p>This solution guide helps players who are stuck or want to check their answers. For the best experience, try solving the puzzle yourself first at <a href="https://www.nytimes.com/games/connections" target="_blank">nytimes.com/games/connections</a>.</p>
    </footer>
</body>
</html>`;
    
    return html;
}