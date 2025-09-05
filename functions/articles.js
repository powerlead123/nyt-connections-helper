// Cloudflare Pages Function for articles list page
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        // 生成最近7天的文章列表
        const articles = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // 检查文章是否存在
            let articleExists = false;
            if (env.CONNECTIONS_KV) {
                const article = await env.CONNECTIONS_KV.get(`article-${dateStr}`);
                articleExists = !!article;
            }
            
            if (articleExists) {
                const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                articles.push({
                    date: dateStr,
                    formattedDate: formattedDate,
                    url: `/api/article/${dateStr}`
                });
            }
        }
        
        // 生成HTML页面
        const html = generateArticlesListHTML(articles);
        
        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=1800' // 30分钟缓存
            }
        });
        
    } catch (error) {
        console.error('Articles list error:', error);
        
        return new Response('Internal Server Error', {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

function generateArticlesListHTML(articles) {
    const articlesHTML = articles.map(article => `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-bold text-gray-800 mb-2">
                NYT Connections ${article.formattedDate}
            </h3>
            <p class="text-gray-600 mb-4">
                Complete solutions, hints, and strategies for ${article.formattedDate}'s puzzle.
            </p>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">${article.date}</span>
                <a href="${article.url}" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Read Article
                </a>
            </div>
        </div>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections Solutions Archive - Daily Puzzle Answers</title>
    <meta name="description" content="Browse our complete archive of NYT Connections puzzle solutions. Find answers, hints, and strategies for past daily puzzles.">
    <meta name="keywords" content="NYT Connections archive, puzzle solutions, daily answers, connections hints, puzzle history">
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="NYT Connections Solutions Archive">
    <meta property="og:description" content="Complete archive of NYT Connections puzzle solutions with detailed explanations and strategies.">
    <meta property="og:type" content="website">
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "NYT Connections Solutions Archive",
        "description": "Archive of daily NYT Connections puzzle solutions",
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": ${articles.length}
        }
    }
    </script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                NYT Connections Solutions Archive
            </h1>
            <p class="text-gray-600 mb-4">Complete solutions and strategies for daily puzzles</p>
            <div class="flex justify-center space-x-4">
                <a href="/" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    🏠 Back to Game
                </a>
                <a href="/api/today" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                    🎮 Today's Puzzle
                </a>
            </div>
        </header>
        
        <!-- Articles List -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">📚 Recent Solutions</h2>
            ${articles.length > 0 ? `
                <div class="grid gap-6">
                    ${articlesHTML}
                </div>
            ` : `
                <div class="bg-white rounded-lg shadow-md p-8 text-center">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">No Articles Available</h3>
                    <p class="text-gray-600 mb-4">
                        Articles are generated daily. Check back later for the latest puzzle solutions!
                    </p>
                    <a href="/" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Play Today's Puzzle
                    </a>
                </div>
            `}
        </div>
        
        <!-- Info Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">📖 About Our Solutions</h2>
            <div class="text-gray-700 space-y-3">
                <p>
                    Our daily NYT Connections solutions provide comprehensive guides for each puzzle, including:
                </p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                    <li>Complete answers for all four groups</li>
                    <li>Detailed explanations for each theme</li>
                    <li>Difficulty analysis and solving strategies</li>
                    <li>Tips for tackling similar puzzles</li>
                </ul>
                <p class="text-sm text-gray-600 mt-4">
                    New solutions are published daily at 6:00 UTC. Bookmark this page to stay updated!
                </p>
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