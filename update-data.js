const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

// 获取今日日期字符串
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// 从 Reddit 获取数据
async function getFromReddit() {
    try {
        console.log('尝试从 Reddit 获取数据...');

        const response = await axios.get('https://www.reddit.com/r/NYTConnections/new.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const posts = response.data.data.children;

        // 查找今日答案帖子
        for (const post of posts) {
            const title = post.data.title.toLowerCase();
            const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

            if (title.includes('answer') && title.includes(today.toLowerCase())) {
                console.log('找到今日答案帖子:', post.data.title);

                // 这里可以进一步解析帖子内容
                // 由于 Reddit API 的限制，这里只是示例
                return null;
            }
        }

        return null;

    } catch (error) {
        console.log('Reddit 获取失败:', error.message);
        return null;
    }
}

// 从 Rock Paper Shotgun 获取数据
async function getFromRockPaperShotgun() {
    try {
        console.log('尝试从 Rock Paper Shotgun 获取数据...');

        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const response = await axios.get('https://www.rockpapershotgun.com/connections-answer', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // 查找今日答案
        const groups = [];
        const words = [];

        // 查找包含今日日期的文章
        const todayArticle = $(`h2:contains("${dateStr}"), h3:contains("${dateStr}")`).parent();

        if (todayArticle.length > 0) {
            todayArticle.find('ul li, .answer-group').each((i, elem) => {
                const text = $(elem).text();
                const match = text.match(/(.+?):\s*(.+)/);

                if (match) {
                    const theme = match[1].trim();
                    const wordsStr = match[2].trim();
                    const groupWords = wordsStr.split(/[,，]/).map(w => w.trim().toUpperCase()).filter(w => w);

                    if (groupWords.length === 4) {
                        groups.push({
                            theme: theme,
                            words: groupWords,
                            difficulty: getDifficultyByIndex(i),
                            hint: generateHint(theme)
                        });
                        words.push(...groupWords);
                    }
                }
            });
        }

        if (groups.length === 4 && words.length === 16) {
            console.log('从 Rock Paper Shotgun 获取数据成功');
            return {
                date: getTodayDateString(),
                words: words,
                groups: groups,
                source: 'Rock Paper Shotgun'
            };
        }

        return null;

    } catch (error) {
        console.log('Rock Paper Shotgun 获取失败:', error.message);
        return null;
    }
}

// 从 Forbes 获取数据
async function getFromForbes() {
    try {
        console.log('尝试从 Forbes 获取数据...');

        const response = await axios.get('https://www.forbes.com/sites/games/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // 查找 Connections 相关文章
        $('a[href*="connections"], a[href*="nyt"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes('connections')) {
                console.log('找到 Connections 文章:', href);
                // 这里可以进一步抓取具体文章内容
            }
        });

        return null;

    } catch (error) {
        console.log('Forbes 获取失败:', error.message);
        return null;
    }
}

// 从 WordFinder 获取数据
async function getFromWordFinder() {
    try {
        console.log('尝试从 WordFinder 获取数据...');

        const response = await axios.get('https://wordfinder.yourdictionary.com/blog/nyt-connections-answers/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // 查找今日答案
        const groups = [];
        const words = [];

        // 查找答案列表
        $('ul li, ol li').each((i, elem) => {
            const text = $(elem).text();
            const match = text.match(/(.+?):\s*(.+)/);

            if (match && groups.length < 4) {
                const theme = match[1].trim();
                const wordsStr = match[2].trim();
                const groupWords = wordsStr.split(/[,，]/).map(w => w.trim().toUpperCase()).filter(w => w);

                if (groupWords.length === 4) {
                    groups.push({
                        theme: theme,
                        words: groupWords,
                        difficulty: getDifficultyByIndex(groups.length),
                        hint: generateHint(theme)
                    });
                    words.push(...groupWords);
                }
            }
        });

        if (groups.length === 4 && words.length === 16) {
            console.log('从 WordFinder 获取数据成功');
            return {
                date: getTodayDateString(),
                words: words,
                groups: groups,
                source: 'WordFinder'
            };
        }

        return null;

    } catch (error) {
        console.log('WordFinder 获取失败:', error.message);
        return null;
    }
}

// 从 GitHub 开源数据获取
async function getFromGitHub() {
    try {
        console.log('尝试从 GitHub 开源数据获取...');

        // 尝试从一些开源的 Connections 数据仓库获取
        const repos = [
            'https://raw.githubusercontent.com/connections-game/data/main/puzzles.json',
            'https://raw.githubusercontent.com/nyt-connections/answers/main/data.json'
        ];

        for (const repo of repos) {
            try {
                const response = await axios.get(repo, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const data = response.data;
                const today = getTodayDateString();

                // 查找今日数据
                if (data[today] || data.puzzles?.[today]) {
                    const todayData = data[today] || data.puzzles[today];
                    console.log('从 GitHub 获取数据成功');
                    return {
                        date: today,
                        words: todayData.words,
                        groups: todayData.groups,
                        source: 'GitHub Open Source'
                    };
                }

            } catch (error) {
                console.log('GitHub 仓库访问失败:', repo);
            }
        }

        return null;

    } catch (error) {
        console.log('GitHub 获取失败:', error.message);
        return null;
    }
}

// 手动创建今日数据（基于常见模式）
async function createTodaysPuzzle() {
    console.log('创建今日谜题数据...');

    // 这里可以基于历史数据和常见模式创建新的谜题
    // 或者从用户输入获取
    const puzzleTemplates = [
        {
            theme: '水果',
            words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE'],
            difficulty: 'green',
            hint: '这些都是常见的水果'
        },
        {
            theme: '颜色',
            words: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
            difficulty: 'yellow',
            hint: '这些都是基本颜色'
        },
        {
            theme: '动物',
            words: ['CAT', 'DOG', 'BIRD', 'FISH'],
            difficulty: 'blue',
            hint: '这些都是常见的动物'
        },
        {
            theme: '运动',
            words: ['SOCCER', 'TENNIS', 'GOLF', 'BOXING'],
            difficulty: 'purple',
            hint: '这些都是体育运动'
        }
    ];

    const words = puzzleTemplates.flatMap(group => group.words);

    return {
        date: getTodayDateString(),
        words: words,
        groups: puzzleTemplates,
        source: 'Generated Template'
    };
}

// 从多个来源尝试获取数据
async function fetchTodaysData() {
    const sources = [
        getFromGitHub,
        getFromMashable,
        getFromRockPaperShotgun,
        getFromWordFinder,
        createTodaysPuzzle  // 最后的备用方案
    ];

    for (const source of sources) {
        try {
            const data = await source();
            if (data) {
                return data;
            }
        } catch (error) {
            console.log('数据源失败:', error.message);
        }
    }

    return null;
}

// 根据索引获取难度
function getDifficultyByIndex(index) {
    const difficulties = ['green', 'yellow', 'blue', 'purple'];
    return difficulties[index] || 'unknown';
}

// Generate hints
function generateHint(theme) {
    const hintTemplates = {
        'animals': 'These are all members of the animal kingdom',
        'colors': 'These are all colors in the visible spectrum',
        'food': 'These can all be found in the kitchen',
        'sports': 'These are all sports activities',
        'music': 'These are all related to music',
        'movies': 'These are all part of the entertainment industry',
        'countries': 'These are all countries in the world',
        'cities': 'These are all famous cities',
        'brands': 'These are all well-known brands',
        'jobs': 'These are all different professions'
    };

    // Try to match keywords
    for (const [key, hint] of Object.entries(hintTemplates)) {
        if (theme.toLowerCase().includes(key.toLowerCase())) {
            return hint;
        }
    }

    return `These words are all related to "${theme}"`;
}

// 更新缓存文件
async function updateCache(data) {
    try {
        let cache = {};
        try {
            const cacheContent = await fs.readFile('connections_cache.json', 'utf8');
            cache = JSON.parse(cacheContent);
        } catch (error) {
            // 缓存文件不存在，创建新的
        }

        cache[data.date] = data;
        await fs.writeFile('connections_cache.json', JSON.stringify(cache, null, 2));
        console.log('缓存更新成功');

    } catch (error) {
        console.error('更新缓存失败:', error);
    }
}

// 主函数
async function main() {
    console.log('开始获取今日 Connections 数据...');

    const data = await fetchTodaysData();

    if (data) {
        console.log('数据获取成功!');
        console.log('来源:', data.source);
        console.log('日期:', data.date);
        console.log('分组数:', data.groups.length);
        console.log('单词数:', data.words.length);

        await updateCache(data);

        // 显示获取到的数据
        data.groups.forEach((group, index) => {
            console.log(`${index + 1}. ${group.theme}: ${group.words.join(', ')}`);
        });

    } else {
        console.log('所有数据源都失败了，无法获取今日数据');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    fetchTodaysData,
    updateCache
};