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