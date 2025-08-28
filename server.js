const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const DataScheduler = require('./scheduler');
const DailyArticleScheduler = require('./daily-article-scheduler');

const app = express();
const PORT = process.env.PORT || 3333;

// Start automatic data fetching scheduler
const scheduler = new DataScheduler();
scheduler.start();

// Start daily article scheduler
const articleScheduler = new DailyArticleScheduler();
articleScheduler.start();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use('/articles', express.static('articles'));

// SEO routes
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, 'connections-help.html'));
});

app.get('/today', (req, res) => {
    res.sendFile(path.join(__dirname, 'connections-today.html'));
});

app.get('/answers', (req, res) => {
    res.sendFile(path.join(__dirname, 'connections-answers.html'));
});

// RSS feed
app.get('/rss.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'rss.xml'));
});

// Article routes
app.get('/connections-:date', async (req, res) => {
    try {
        const articlePath = path.join(__dirname, 'articles', `connections-${req.params.date}.md`);
        const articleContent = await fs.readFile(articlePath, 'utf8');
        
        // Parse front matter and content
        const frontMatterMatch = articleContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        
        if (!frontMatterMatch) {
            // 如果没有 front matter，直接使用内容
            const htmlContent = convertMarkdownToHTML(articleContent);
            const metadata = {
                title: `Connections ${req.params.date}`,
                description: `NYT Connections puzzle solution for ${req.params.date}`,
                date: req.params.date,
                keywords: 'NYT Connections, puzzle, solution, answers',
                canonical: `/connections-${req.params.date}`,
                schema: '{}'
            };
            return res.send(renderArticlePage(metadata, htmlContent));
        }
        
        const [, frontMatter, content] = frontMatterMatch;
        const metadata = parseFrontMatter(frontMatter);
        
        // Convert markdown to HTML (simple conversion)
        const htmlContent = convertMarkdownToHTML(content);
        
        // Render article page
        res.send(renderArticlePage(metadata, htmlContent));
    } catch (error) {
        console.error('Article not found:', error);
        res.status(404).send('Article not found');
    }
});

// Article archive
app.get('/archive', async (req, res) => {
    try {
        const articlesDir = path.join(__dirname, 'articles');
        const files = await fs.readdir(articlesDir);
        const articles = files
            .filter(file => file.endsWith('.md'))
            .map(file => {
                const slug = file.replace('.md', '');
                
                // 尝试多种日期格式
                let date = null;
                
                // 格式1: connections-2025-08-28
                const match1 = file.match(/connections-(\d{4}-\d{2}-\d{2})/);
                if (match1) {
                    date = match1[1];
                }
                
                // 格式2: connections-thursday,-august-28,-2025
                const match2 = file.match(/connections-[^,]+,-([^,]+)-(\d{1,2}),-(\d{4})/);
                if (match2 && !date) {
                    const monthName = match2[1].toLowerCase();
                    const day = match2[2].padStart(2, '0');
                    const year = match2[3];
                    
                    const monthMap = {
                        'january': '01', 'february': '02', 'march': '03', 'april': '04',
                        'may': '05', 'june': '06', 'july': '07', 'august': '08',
                        'september': '09', 'october': '10', 'november': '11', 'december': '12'
                    };
                    
                    const month = monthMap[monthName];
                    if (month) {
                        date = `${year}-${month}-${day}`;
                    }
                }
                
                return {
                    slug,
                    date,
                    title: date ? `Connections ${date}` : `Connections ${slug}`
                };
            })
            .filter(article => article.date) // 只保留有有效日期的文章
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.send(renderArchivePage(articles));
    } catch (error) {
        res.status(500).send('Error loading archive');
    }
});

// 启动定时任务
console.log('🕐 启动数据调度器...');
require('./scheduler.js');

// 缓存文件路径
const CACHE_FILE = 'connections_cache.json';

// 获取今日日期字符串
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD 格式
}

// 从缓存读取数据
async function readCache() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// 写入缓存
async function writeCache(data) {
    await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
}

// 解析 Connections 游戏数据的函数
async function scrapeConnectionsData() {
    console.log('开始获取 Connections 数据...');
    
    try {
        // 方法1: 尝试从第三方 API 获取
        const apiResponse = await tryThirdPartyAPI();
        if (apiResponse) {
            console.log('从第三方 API 获取数据成功');
            return apiResponse;
        }
        
        // 方法2: 尝试从 NYTimes 获取
        const nytResponse = await tryNYTimesAPI();
        if (nytResponse) {
            console.log('从 NYTimes 获取数据成功');
            return nytResponse;
        }
        
        throw new Error('所有数据源都失败了');
        
    } catch (error) {
        console.log('数据获取失败，使用备用方案:', error.message);
        return await getBackupData();
    }
}

// 尝试第三方 API
async function tryThirdPartyAPI() {
    try {
        console.log('尝试使用优化解析器获取数据...');
        
        // 使用优化后的解析器
        const FixedConnectionsParser = require('./fixed-parser.js');
        const parser = new FixedConnectionsParser();
        const data = await parser.fetchMashableData();
        
        if (data) {
            console.log('优化解析器获取数据成功:', data.source);
            return data;
        }
        
        // 备用：使用原有的自动爬虫
        const { fetchConnectionsData } = require('./auto-scraper.js');
        const fallbackData = await fetchConnectionsData();
        
        if (fallbackData) {
            console.log('备用爬虫获取数据成功:', fallbackData.source);
            return fallbackData;
        }
        
        return null;
        
    } catch (error) {
        console.log('自动获取失败:', error.message);
        return null;
    }
}

// 从 GitHub 开源数据源获取
async function tryGitHubDataSource() {
    try {
        // 很多开发者会在 GitHub 上维护 Connections 数据
        const response = await axios.get('https://api.github.com/repos/connections-puzzle/daily-data/contents/latest.json', {
            headers: {
                'User-Agent': 'Connections-Helper-Bot',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.data && response.data.content) {
            const content = Buffer.from(response.data.content, 'base64').toString();
            const data = JSON.parse(content);
            
            return {
                date: getTodayDateString(),
                words: data.words,
                groups: data.groups.map(group => ({
                    theme: group.category,
                    words: group.words,
                    difficulty: group.difficulty,
                    hint: generateHint(group.category, group.words)
                }))
            };
        }
        
        return null;
    } catch (error) {
        console.log('GitHub 数据源失败:', error.message);
        return null;
    }
}

// 从 Reddit 获取数据
async function tryRedditAPI() {
    try {
        // r/NYTConnections 经常有人发布答案
        const response = await axios.get('https://www.reddit.com/r/NYTConnections/new.json?limit=10', {
            headers: {
                'User-Agent': 'Connections-Helper-Bot'
            }
        });
        
        const posts = response.data?.data?.children || [];
        const today = new Date().toISOString().split('T')[0];
        
        for (const post of posts) {
            const title = post.data.title.toLowerCase();
            const content = post.data.selftext;
            
            // 查找今日答案帖子
            if (title.includes('answer') || title.includes('solution') || title.includes(today)) {
                const parsedData = parseRedditPost(content);
                if (parsedData) {
                    console.log('从 Reddit 获取数据成功');
                    return parsedData;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.log('Reddit API 失败:', error.message);
        return null;
    }
}

// 解析 Reddit 帖子内容
function parseRedditPost(content) {
    try {
        // 简单的正则匹配来提取分组信息
        const groupPattern = /(\w+):\s*([A-Z\s,]+)/g;
        const matches = [...content.matchAll(groupPattern)];
        
        if (matches.length >= 4) {
            const groups = matches.slice(0, 4).map((match, index) => ({
                theme: match[1],
                words: match[2].split(',').map(w => w.trim()).filter(w => w),
                difficulty: ['green', 'yellow', 'blue', 'purple'][index],
                hint: generateHint(match[1], match[2].split(',').map(w => w.trim()))
            }));
            
            const allWords = groups.flatMap(g => g.words);
            
            if (allWords.length === 16) {
                return {
                    date: getTodayDateString(),
                    words: allWords,
                    groups: groups
                };
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// 从其他游戏网站获取
async function tryGameSites() {
    try {
        // 尝试从一些游戏攻略网站获取数据
        const sites = [
            'https://www.gamespot.com/connections-answers',
            'https://www.polygon.com/games/connections',
            'https://www.rockpapershotgun.com/connections-answers'
        ];
        
        for (const site of sites) {
            try {
                const response = await axios.get(site, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 5000
                });
                
                // 这里需要根据具体网站的结构来解析
                // Return null for now
                console.log(`尝试 ${site} - 需要具体实现解析逻辑`);
                
            } catch (error) {
                continue;
            }
        }
        
        return null;
    } catch (error) {
        console.log('游戏网站获取失败:', error.message);
        return null;
    }
}

// 尝试 NYTimes API
async function tryNYTimesAPI() {
    try {
        console.log('尝试 NYTimes 数据获取...');
        
        const response = await axios.get('https://www.nytimes.com/games/connections', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // 查找包含游戏数据的 script 标签
        let gameData = null;
        $('script').each((i, elem) => {
            const scriptContent = $(elem).html();
            if (scriptContent && (scriptContent.includes('window.gameData') || scriptContent.includes('connections'))) {
                console.log('找到可能的游戏数据脚本');
                
                // 尝试多种数据提取模式
                const patterns = [
                    /window\.gameData\s*=\s*({.*?});/s,
                    /gameData\s*:\s*({.*?})/s,
                    /"categories"\s*:\s*\[(.*?)\]/s
                ];
                
                for (const pattern of patterns) {
                    const match = scriptContent.match(pattern);
                    if (match) {
                        try {
                            gameData = JSON.parse(match[1]);
                            console.log('成功解析游戏数据');
                            break;
                        } catch (e) {
                            console.log('解析失败，尝试下一个模式');
                        }
                    }
                }
            }
        });

        if (gameData) {
            return parseNYTimesData(gameData);
        }

        return null;
        
    } catch (error) {
        console.log('NYTimes 获取失败:', error.message);
        return null;
    }
}

// 解析 NYTimes 数据格式
function parseNYTimesData(rawData) {
    // 根据实际的数据结构调整解析逻辑
    const groups = rawData.categories || rawData.groups || [];
    
    return {
        date: getTodayDateString(),
        words: groups.flatMap(group => group.cards || group.words || []),
        groups: groups.map(group => ({
            theme: group.title || group.category,
            words: group.cards || group.words || [],
            difficulty: group.difficulty || 'unknown',
            hint: generateHint(group.title || group.category, group.cards || group.words || [])
        }))
    };
}

// Generate smart hints
function generateHint(theme, words) {
    const hintTemplates = {
        'animals': 'These are all members of the animal kingdom',
        'colors': 'These are all colors in the visible spectrum',
        'food': 'These can all be found in the kitchen',
        'sports': 'These are all sports activities',
        'music': 'These are all related to music',
        'movies': 'These are all part of the entertainment industry',
        'fish': 'These are all types of fish',
        'seasons': 'These are the four seasons of the year',
        'candy': 'These are all candy bar brands',
        'tech': 'These are all technology companies'
    };
    
    return hintTemplates[theme.toLowerCase()] || `These words are all related to "${theme}"`;
}

// Backup data source (when real-time data is unavailable)
async function getBackupData() {
    // This can connect to other data sources or use preset puzzles
    const backupPuzzles = [
        {
            date: getTodayDateString(),
            words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT', 'SPRING', 'SUMMER', 'FALL', 'WINTER', 'MARS', 'SNICKERS', 'TWIX', 'KITKAT', 'APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
            groups: [
                {
                    theme: 'Fish',
                    words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT'],
                    difficulty: 'yellow',
                    hint: 'These are all seafood you can see on restaurant menus'
                },
                {
                    theme: 'Seasons',
                    words: ['SPRING', 'SUMMER', 'FALL', 'WINTER'],
                    difficulty: 'green',
                    hint: 'The four periods of the year cycle'
                },
                {
                    theme: 'Candy brands',
                    words: ['MARS', 'SNICKERS', 'TWIX', 'KITKAT'],
                    difficulty: 'blue',
                    hint: 'These are all chocolate bar brands'
                },
                {
                    theme: 'Tech companies',
                    words: ['APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
                    difficulty: 'purple',
                    hint: 'These companies all have their own operating systems or platforms'
                }
            ]
        }
    ];
    
    return backupPuzzles[0];
}

// API 端点：获取今日谜题
app.get('/api/today', async (req, res) => {
    try {
        const today = getTodayDateString();
        const cache = await readCache();
        
        // 检查缓存中是否有今日数据
        if (cache[today]) {
            console.log('Returning cached data for today');
            return res.json(cache[today]);
        }
        
        console.log('获取新的谜题数据...');
        const puzzleData = await scrapeConnectionsData();
        
        // 缓存数据
        cache[today] = puzzleData;
        await writeCache(cache);
        
        res.json(puzzleData);
        
    } catch (error) {
        console.error('获取谜题数据失败:', error);
        res.status(500).json({ error: '无法获取今日谜题数据' });
    }
});

// API 端点：手动刷新数据
app.post('/api/refresh', async (req, res) => {
    try {
        console.log('手动触发数据刷新...');
        await scheduler.manualFetch();
        
        // 获取最新数据
        const cache = await readCache();
        const today = getTodayDateString();
        const data = cache[today];
        
        if (data) {
            res.json({ message: '数据刷新成功', data: data });
        } else {
            res.status(500).json({ error: '刷新后仍无法获取数据' });
        }
        
    } catch (error) {
        console.error('刷新数据失败:', error);
        res.status(500).json({ error: '刷新数据失败' });
    }
});

// API 端点：获取系统状态
app.get('/api/status', (req, res) => {
    const status = scheduler.getStatus();
    res.json(status);
});

// API 端点：手动输入今日数据
app.post('/api/manual-input', async (req, res) => {
    try {
        const { words, groups } = req.body;
        
        if (!words || !groups || words.length !== 16 || groups.length !== 4) {
            return res.status(400).json({ error: '数据格式不正确' });
        }
        
        const puzzleData = {
            date: getTodayDateString(),
            words: words,
            groups: groups.map(group => ({
                theme: group.theme,
                words: group.words,
                difficulty: group.difficulty || 'unknown',
                hint: group.hint || generateHint(group.theme, group.words)
            }))
        };
        
        const cache = await readCache();
        cache[getTodayDateString()] = puzzleData;
        await writeCache(cache);
        
        console.log('手动输入数据成功');
        res.json({ message: '数据输入成功', data: puzzleData });
        
    } catch (error) {
        console.error('手动输入失败:', error);
        res.status(500).json({ error: '手动输入失败' });
    }
});

// 辅助函数：解析 front matter
function parseFrontMatter(frontMatter) {
    const lines = frontMatter.split('\n');
    const metadata = {};
    
    for (const line of lines) {
        const match = line.match(/^(\w+):\s*"?([^"]*)"?$/);
        if (match) {
            metadata[match[1]] = match[2];
        }
    }
    
    return metadata;
}

// 辅助函数：改进的 Markdown 转 HTML
function convertMarkdownToHTML(markdown) {
    return markdown
        // 标题处理
        .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold text-gray-900 mb-6 leading-tight">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-800 mb-4 mt-8 border-b-2 border-blue-100 pb-2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-700 mb-3 mt-6">$1</h3>')
        
        // 文本格式
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
        
        // 列表处理
        .replace(/^- (.*$)/gim, '<li class="mb-2 text-gray-700">$1</li>')
        
        // 段落处理
        .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
        .replace(/^(.*)$/gim, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>')
        
        // 清理
        .replace(/<p class="mb-4 text-gray-700 leading-relaxed"><h/g, '<h')
        .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
        .replace(/<p class="mb-4 text-gray-700 leading-relaxed"><li/g, '<li')
        .replace(/<\/li><\/p>/g, '</li>')
        
        // 包装列表
        .replace(/(<li.*?<\/li>)/gs, '<ul class="list-disc list-inside mb-6 space-y-2 ml-4">$1</ul>');
}

// 辅助函数：渲染文章页面
function renderArticlePage(metadata, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <meta name="description" content="${metadata.description}">
    <meta name="keywords" content="${metadata.keywords}">
    <link rel="canonical" href="https://yoursite.com${metadata.canonical}">
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="application/ld+json">${metadata.schema}</script>
    <style>
        /* 自定义样式改善可读性 */
        .article-content h1 { @apply text-4xl font-bold text-gray-900 mb-6 leading-tight; }
        .article-content h2 { @apply text-2xl font-semibold text-gray-800 mb-4 mt-8 border-b-2 border-blue-100 pb-2; }
        .article-content h3 { @apply text-xl font-semibold text-gray-700 mb-3 mt-6; }
        .article-content p { @apply mb-4 text-gray-700 leading-relaxed; }
        .article-content ul { @apply list-disc list-inside mb-6 space-y-2 ml-4; }
        .article-content li { @apply mb-2 text-gray-700; }
        .article-content strong { @apply font-semibold text-gray-900; }
        .article-content em { @apply italic text-gray-700; }
        
        /* 特殊样式 */
        .difficulty-green { @apply bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium; }
        .difficulty-yellow { @apply bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium; }
        .difficulty-blue { @apply bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium; }
        .difficulty-purple { @apply bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- 导航栏 -->
        <nav class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="flex items-center justify-between">
                <a href="/" class="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back to Game
                </a>
                <a href="/archive" class="text-blue-600 hover:text-blue-800 transition-colors">
                    📚 Archive
                </a>
            </div>
        </nav>

        <!-- 文章头部 -->
        <header class="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">${metadata.title}</h1>
            <p class="text-gray-600 text-lg">${metadata.date}</p>
        </header>
        
        <!-- 文章内容 -->
        <article class="bg-white rounded-lg shadow-sm p-8 article-content">
            ${content}
        </article>
        
        <!-- 底部操作 -->
        <div class="mt-8 text-center space-y-4">
            <a href="/" class="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                🎮 Play Today's Puzzle
            </a>
            <div class="flex justify-center space-x-4 text-sm">
                <a href="/archive" class="text-blue-600 hover:text-blue-800">View All Solutions</a>
                <span class="text-gray-400">•</span>
                <a href="/help" class="text-blue-600 hover:text-blue-800">How to Play</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// 辅助函数：渲染归档页面
function renderArchivePage(articles) {
    const articlesList = articles.map(article => {
        const formattedDate = article.date ? 
            new Date(article.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }) : 'Invalid Date';
            
        return `
        <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold mb-2">
                <a href="/${article.slug}" class="text-blue-600 hover:text-blue-800">
                    ${article.title}
                </a>
            </h3>
            </p>
        </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections Archive - All Daily Solutions</title>
    <meta name="description" content="Complete archive of NYT Connections daily puzzle solutions, answers, and hints.">
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
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log('📊 Connections 数据服务已启动');
});

module.exports = app;