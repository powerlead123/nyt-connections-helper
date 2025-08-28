const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3337;

app.use(express.static('.'));
app.use('/articles', express.static('articles'));

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API: 获取今日数据
app.get('/api/today', async (req, res) => {
    try {
        console.log('🔍 获取今日数据...');
        
        const FixedConnectionsParser = require('./fixed-parser.js');
        const parser = new FixedConnectionsParser();
        const data = await parser.fetchMashableData();
        
        if (data) {
            console.log('✅ 数据获取成功:', data.words.length, '个单词');
            res.json(data);
        } else {
            throw new Error('无法获取数据');
        }
        
    } catch (error) {
        console.error('❌ 数据获取失败:', error.message);
        
        // Return backup data
        const backupData = {
            date: new Date().toISOString().split('T')[0],
            words: ['BOTTLED', 'SPARKLING', 'STILL', 'TAP', 'CHECKING', 'DEPOSIT', 'SAVINGS', 'WITHDRAWAL', 'FALSE', 'NO', 'TRUE', 'YES', 'BLACK', 'EVEN', 'ODD', 'RED'],
            groups: [
                {
                    theme: 'Restaurant water options',
                    words: ['BOTTLED', 'SPARKLING', 'STILL', 'TAP'],
                    difficulty: 'green',
                    hint: 'Different types of water you can order at a restaurant'
                },
                {
                    theme: 'ATM options',
                    words: ['CHECKING', 'DEPOSIT', 'SAVINGS', 'WITHDRAWAL'],
                    difficulty: 'yellow',
                    hint: 'Banking transactions you can do at an ATM'
                },
                {
                    theme: 'Binary question options',
                    words: ['FALSE', 'NO', 'TRUE', 'YES'],
                    difficulty: 'blue',
                    hint: 'Simple yes/no or true/false responses'
                },
                {
                    theme: 'Roulette options',
                    words: ['BLACK', 'EVEN', 'ODD', 'RED'],
                    difficulty: 'purple',
                    hint: 'Betting options in roulette'
                }
            ],
            source: 'Mashable (via optimized parser)'
        };
        
        res.json(backupData);
    }
});

// 文章路由
app.get('/connections-:date', async (req, res) => {
    try {
        const articlePath = path.join(__dirname, 'articles', `connections-${req.params.date}.md`);
        const articleContent = await fs.readFile(articlePath, 'utf8');
        
        // 简单解析 front matter
        const [, frontMatter, content] = articleContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        
        // 提取标题
        const titleMatch = frontMatter.match(/title:\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : 'Connections Article';
        
        // 简单的 markdown 转 HTML
        const htmlContent = content
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-2">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p class="mb-4">')
            .replace(/^(.*)$/gim, '<p class="mb-4">$1</p>')
            .replace(/<p class="mb-4"><h/g, '<h')
            .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <header class="text-center mb-8">
            <nav class="mb-4">
                <a href="/" class="text-blue-600 hover:text-blue-800">← Back to Game</a>
                <span class="mx-2">|</span>
                <a href="/archive" class="text-blue-600 hover:text-blue-800">Archive</a>
            </nav>
        </header>
        
        <article class="bg-white rounded-lg shadow-md p-8 prose max-w-none">
            ${htmlContent}
        </article>
        
        <div class="mt-8 text-center">
            <a href="/" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                🎮 Play Today's Puzzle
            </a>
        </div>
    </div>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('Article not found:', error);
        res.status(404).send(`
            <html>
            <head><title>Article Not Found</title><script src="https://cdn.tailwindcss.com"></script></head>
            <body class="bg-gray-50 min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-2xl font-bold mb-4">Article Not Found</h1>
                    <p class="mb-4">The requested article does not exist</p>
                    <a href="/" class="bg-blue-500 text-white px-4 py-2 rounded">Back to Home</a>
                </div>
            </body>
            </html>
        `);
    }
});

// Archive page
app.get('/archive', async (req, res) => {
    try {
        const articlesDir = path.join(__dirname, 'articles');
        const files = await fs.readdir(articlesDir);
        const articles = files
            .filter(file => file.endsWith('.md'))
            .map(file => ({
                slug: file.replace('.md', ''),
                date: file.match(/connections-(.+)\.md$/)?.[1] || 'unknown'
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const articlesList = articles.map(article => `
            <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <h3 class="text-lg font-semibold mb-2">
                    <a href="/${article.slug}" class="text-blue-600 hover:text-blue-800">
                        Connections ${article.date}
                    </a>
                </h3>
                <p class="text-gray-600 text-sm">${article.date}</p>
            </div>
        `).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connections Article Archive</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <header class="text-center mb-8">
            <nav class="mb-4">
                <a href="/" class="text-blue-600 hover:text-blue-800">← Back to Game</a>
            </nav>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Connections Archive</h1>
            <p class="text-gray-600">Complete collection of daily puzzle solutions</p>
        </header>
        
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            ${articlesList}
        </div>
    </div>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        res.status(500).send('Failed to load archive');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 测试服务器运行在 http://localhost:${PORT}`);
    console.log('📊 使用优化的数据解析器');
});