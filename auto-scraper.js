const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

// 自动获取 Connections 数据的核心类
class ConnectionsAutoScraper {
    constructor() {
        this.sources = [
            {
                name: 'Mashable Games',
                url: 'https://mashable.com/category/games',
                parser: this.parseMashableGames.bind(this)
            },
            {
                name: 'NYTimes Direct',
                url: 'https://www.nytimes.com/games/connections',
                parser: this.parseNYTimes.bind(this)
            },
            {
                name: 'Reddit API',
                url: 'https://www.reddit.com/r/NYTConnections/new.json',
                parser: this.parseReddit.bind(this)
            },
            {
                name: 'Game8',
                url: 'https://game8.co/games/NYT-Connections/archives/answers',
                parser: this.parseGame8.bind(this)
            }
        ];
        
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    // 获取随机 User-Agent
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    // 通用请求方法
    async makeRequest(url, options = {}) {
        const config = {
            headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...options.headers
            },
            timeout: 15000,
            ...options
        };

        try {
            const response = await axios.get(url, config);
            return response;
        } catch (error) {
            if (error.response?.status === 403 || error.response?.status === 429) {
                // 被限制了，等待后重试
                await this.delay(2000);
                return await axios.get(url, {
                    ...config,
                    headers: {
                        ...config.headers,
                        'User-Agent': this.getRandomUserAgent()
                    }
                });
            }
            throw error;
        }
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 解析 NYTimes 官网
    async parseNYTimes(url) {
        try {
            console.log('尝试从 NYTimes 官网获取...');
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response.data);
            
            // 查找游戏数据
            let gameData = null;
            
            // 方法1: 查找 script 标签中的数据
            $('script').each((i, elem) => {
                const content = $(elem).html();
                if (content && content.includes('window.gameData')) {
                    const match = content.match(/window\.gameData\s*=\s*({.*?});/s);
                    if (match) {
                        try {
                            gameData = JSON.parse(match[1]);
                        } catch (e) {}
                    }
                }
            });

            // 方法2: 查找 JSON-LD 数据
            if (!gameData) {
                $('script[type="application/ld+json"]').each((i, elem) => {
                    try {
                        const data = JSON.parse($(elem).html());
                        if (data.gameData || data.puzzle) {
                            gameData = data.gameData || data.puzzle;
                        }
                    } catch (e) {}
                });
            }

            if (gameData && gameData.categories) {
                return this.formatGameData(gameData, 'NYTimes Official');
            }

            return null;
        } catch (error) {
            console.log('NYTimes 解析失败:', error.message);
            return null;
        }
    }

    // 解析 Mashable 游戏页面
    async parseMashableGames(url) {
        try {
            console.log('尝试从 Mashable 游戏页面获取...');
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response.data);
            
            // 查找最新的 Connections 文章
            const connectionsLinks = [];
            
            $('a[href*="connections"], a[href*="nyt-connections"]').each((i, elem) => {
                const href = $(elem).attr('href');
                const title = $(elem).text().toLowerCase();
                
                if (href && (title.includes('connections') || title.includes('answer') || title.includes('hint'))) {
                    const fullUrl = href.startsWith('http') ? href : `https://mashable.com${href}`;
                    connectionsLinks.push({
                        url: fullUrl,
                        title: $(elem).text().trim()
                    });
                }
            });

            // 也检查文章标题和链接
            $('.card-title a, .headline a, h2 a, h3 a').each((i, elem) => {
                const href = $(elem).attr('href');
                const title = $(elem).text().toLowerCase();
                
                if (href && title.includes('connections') && (title.includes('answer') || title.includes('hint') || title.includes('today'))) {
                    const fullUrl = href.startsWith('http') ? href : `https://mashable.com${href}`;
                    connectionsLinks.push({
                        url: fullUrl,
                        title: $(elem).text().trim()
                    });
                }
            });

            console.log(`Found ${connectionsLinks.length} Connections related links`);

            // 尝试从最新的文章中提取答案
            for (const link of connectionsLinks.slice(0, 3)) { // 只检查前3个最新的
                console.log(`检查文章: ${link.title}`);
                const articleData = await this.parseConnectionsArticle(link.url);
                if (articleData) {
                    return articleData;
                }
                
                // 每个请求之间等待一下
                await this.delay(1000);
            }

            return null;
        } catch (error) {
            console.log('Mashable 游戏页面解析失败:', error.message);
            return null;
        }
    }

    // 解析 Connections 文章内容
    async parseConnectionsArticle(url) {
        try {
            console.log(`解析文章: ${url}`);
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response.data);
            
            const groups = [];
            const articleText = $('article, .article-content, .post-content, .entry-content').text();
            
            // 先尝试找到答案区域
            let answerSection = '';
            
            // 查找包含答案的段落
            $('p, div, section').each((i, elem) => {
                const text = $(elem).text();
                if (text.includes('answer') && text.includes(':') && text.length > 100) {
                    answerSection += text + '\n';
                }
            });
            
            if (!answerSection) {
                answerSection = articleText;
            }

            // 多种解析模式
            const patterns = [
                // 模式1: "Green (easiest): Theme - WORD1, WORD2, WORD3, WORD4"
                /(Green|Yellow|Blue|Purple)\s*\([^)]+\):\s*([^-\n]+)\s*[-–]\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/gi,
                
                // 模式2: "Theme: WORD1, WORD2, WORD3, WORD4"
                /([^:\n]{3,30}):\s*([A-Z]{2,}(?:\s*,\s*[A-Z]{2,}){3})/g,
                
                // 模式3: "Theme (difficulty): WORD1, WORD2, WORD3, WORD4"
                /([^(\n]{3,30})\s*\([^)]*\):\s*([A-Z]{2,}(?:\s*,\s*[A-Z]{2,}){3})/g,
                
                // 模式4: 在列表中查找
                /(?:•|\*|-|\d+\.)\s*([^:\n]{3,30}):\s*([A-Z]{2,}(?:\s*,\s*[A-Z]{2,}){3})/g
            ];

            for (const pattern of patterns) {
                let match;
                const tempGroups = [];
                
                while ((match = pattern.exec(answerSection)) !== null && tempGroups.length < 4) {
                    let theme, wordsStr;
                    
                    if (match.length === 4) { // 有难度信息的模式
                        theme = match[2].trim();
                        wordsStr = match[3].trim();
                    } else { // 普通模式
                        theme = match[1].trim();
                        wordsStr = match[2].trim();
                    }
                    
                    // 清理主题文本
                    theme = theme.replace(/^[•\*\-\d\.]\s*/, '').trim();
                    theme = theme.replace(/\s*\([^)]*\)\s*$/, '').trim(); // 移除末尾的括号
                    
                    const words = wordsStr.split(/[,，]/).map(w => w.trim().toUpperCase()).filter(w => w && w.length > 1);
                    
                    if (words.length === 4 && theme.length > 0 && theme.length < 50) {
                        tempGroups.push({
                            theme: theme,
                            words: words,
                            difficulty: this.getDifficultyByIndex(tempGroups.length)
                        });
                    }
                }
                
                if (tempGroups.length === 4) {
                    console.log('成功解析出4组答案!');
                    return this.formatGroups(tempGroups, `Mashable`);
                }
            }

            // 如果上面的模式都失败了，尝试更宽松的匹配
            const lines = articleText.split('\n');
            const looseGroups = [];
            
            for (const line of lines) {
                if (looseGroups.length >= 4) break;
                
                // 查找包含4个大写单词的行
                const upperWords = line.match(/\b[A-Z]{2,}\b/g);
                if (upperWords && upperWords.length === 4) {
                    // 尝试找到主题
                    const beforeColon = line.split(':')[0];
                    const theme = beforeColon.replace(/^[•\*\-\d\.]\s*/, '').trim();
                    
                    if (theme && theme.length > 0 && theme.length < 50) {
                        looseGroups.push({
                            theme: theme,
                            words: upperWords,
                            difficulty: this.getDifficultyByIndex(looseGroups.length)
                        });
                    }
                }
            }

            if (looseGroups.length === 4) {
                console.log('通过宽松匹配找到答案!');
                return this.formatGroups(looseGroups, `Mashable - ${url}`);
            }

            return null;
        } catch (error) {
            console.log('文章解析失败:', error.message);
            return null;
        }
    }

    // 解析 Game8
    async parseGame8(url) {
        try {
            console.log('尝试从 Game8 获取...');
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response.data);
            
            const groups = [];
            const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            // 查找今日答案
            $('h2, h3').each((i, header) => {
                const headerText = $(header).text();
                if (headerText.includes(today) || headerText.includes('Today')) {
                    const nextElements = $(header).nextAll().slice(0, 10);
                    
                    nextElements.find('li, p').each((j, elem) => {
                        const text = $(elem).text();
                        const match = text.match(/(.+?):\s*(.+)/);
                        
                        if (match && groups.length < 4) {
                            const theme = match[1].trim();
                            const wordsStr = match[2].trim();
                            const words = wordsStr.split(/[,，]/).map(w => w.trim().toUpperCase()).filter(w => w);
                            
                            if (words.length === 4) {
                                groups.push({
                                    theme,
                                    words,
                                    difficulty: this.getDifficultyByIndex(groups.length)
                                });
                            }
                        }
                    });
                }
            });

            if (groups.length === 4) {
                return this.formatGroups(groups, 'Game8');
            }

            return null;
        } catch (error) {
            console.log('Game8 解析失败:', error.message);
            return null;
        }
    }

    // 解析 Reddit
    async parseReddit(url) {
        try {
            console.log('尝试从 Reddit 获取...');
            const response = await this.makeRequest(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const posts = response.data.data.children;
            const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            for (const post of posts) {
                const title = post.data.title.toLowerCase();
                const selftext = post.data.selftext || '';
                
                if ((title.includes('answer') || title.includes('solution')) && 
                    (title.includes(today.toLowerCase()) || title.includes('today'))) {
                    
                    // 解析帖子内容中的答案
                    const groups = this.parseAnswerText(selftext);
                    if (groups.length === 4) {
                        return this.formatGroups(groups, 'Reddit Community');
                    }
                }
            }

            return null;
        } catch (error) {
            console.log('Reddit 解析失败:', error.message);
            return null;
        }
    }

    // 解析答案文本
    parseAnswerText(text) {
        const groups = [];
        const patterns = [
            /([^:]+):\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/g,
            /([^-]+)-\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/g,
            /(\w+)\s*\(.*?\):\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null && groups.length < 4) {
                const theme = match[1].trim();
                const wordsStr = match[2].trim();
                const words = wordsStr.split(/[,，]/).map(w => w.trim().toUpperCase()).filter(w => w);
                
                if (words.length === 4) {
                    groups.push({
                        theme,
                        words,
                        difficulty: this.getDifficultyByIndex(groups.length)
                    });
                }
            }
        }

        return groups;
    }

    // 格式化游戏数据
    formatGameData(gameData, source) {
        const groups = gameData.categories.map((category, index) => ({
            theme: category.title,
            words: category.cards,
            difficulty: this.getDifficultyByIndex(index),
            hint: this.generateHint(category.title)
        }));

        return {
            date: this.getTodayDateString(),
            words: groups.flatMap(g => g.words),
            groups,
            source
        };
    }

    // 格式化分组数据
    formatGroups(groups, source) {
        return {
            date: this.getTodayDateString(),
            words: groups.flatMap(g => g.words),
            groups: groups.map(g => ({
                ...g,
                hint: this.generateHint(g.theme)
            })),
            source
        };
    }

    // 获取难度
    getDifficultyByIndex(index) {
        const difficulties = ['green', 'yellow', 'blue', 'purple'];
        return difficulties[index] || 'unknown';
    }

    // 生成提示
    generateHint(theme) {
        const hintTemplates = {
            '动物': '这些都是动物王国的成员',
            '颜色': '这些都是可见光谱中的颜色',
            'food': 'These can all be found in the kitchen',
            'sports': 'These are all sports activities',
            'music': 'These are all related to music',
            'movies': 'These are all part of the entertainment industry',
            'animals': 'These are all animals',
            'colors': '这些都是颜色',
            'food': '这些都是食物',
            'sports': '这些都是运动'
        };
        
        const lowerTheme = theme.toLowerCase();
        for (const [key, hint] of Object.entries(hintTemplates)) {
            if (lowerTheme.includes(key)) {
                return hint;
            }
        }
        
        return `These words are all related to "${theme}"`;
    }

    // 获取今日日期
    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    // 主要的自动获取方法
    async autoFetch() {
        console.log('🤖 开始自动获取今日 Connections 数据...');
        
        for (const source of this.sources) {
            try {
                console.log(`尝试数据源: ${source.name}`);
                const data = await source.parser(source.url);
                
                if (data && data.groups.length === 4) {
                    console.log(`✅ 成功从 ${source.name} 获取数据!`);
                    return data;
                }
                
                // 每个数据源之间等待一下
                await this.delay(1000);
                
            } catch (error) {
                console.log(`❌ ${source.name} 失败:`, error.message);
            }
        }
        
        console.log('❌ 所有自动数据源都失败了');
        return null;
    }
}

module.exports = ConnectionsAutoScraper;