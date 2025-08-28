// Cloudflare Pages Function for /api/today
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        // 获取今日日期
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试从KV存储获取缓存数据
        let cachedData = null;
        if (env.CONNECTIONS_KV) {
            cachedData = await env.CONNECTIONS_KV.get(`puzzle-${today}`, 'json');
        }
        
        if (cachedData) {
            return new Response(JSON.stringify(cachedData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // 如果没有缓存，获取新数据
        const puzzleData = await fetchTodaysPuzzle();
        
        // 存储到KV
        if (env.CONNECTIONS_KV && puzzleData) {
            await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(puzzleData), {
                expirationTtl: 86400 // 24小时过期
            });
        }
        
        return new Response(JSON.stringify(puzzleData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('API Error:', error);
        
        // 返回备用数据
        const backupData = getBackupPuzzle();
        
        return new Response(JSON.stringify(backupData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 获取今日谜题数据
async function fetchTodaysPuzzle() {
    try {
        // 尝试从Mashable获取数据
        const mashableData = await fetchFromMashable();
        if (mashableData) return mashableData;
        
        // 备用数据源
        return getBackupPuzzle();
        
    } catch (error) {
        console.error('Fetch error:', error);
        return getBackupPuzzle();
    }
}

// 从多个数据源获取数据
async function fetchFromMashable() {
    try {
        // 尝试从NYT官方API获取（如果可用）
        const nytData = await fetchFromNYT();
        if (nytData) return nytData;
        
        // 尝试从Mashable获取
        const mashableData = await fetchFromMashableSource();
        if (mashableData) return mashableData;
        
        // 尝试从本地文章文件获取
        const localData = await fetchFromLocalArticles();
        if (localData) return localData;
        
        return null;
        
    } catch (error) {
        console.error('All data sources failed:', error);
        return null;
    }
}

// 尝试从NYT官方获取数据
async function fetchFromNYT() {
    try {
        // NYT Connections 游戏页面
        const response = await fetch('https://www.nytimes.com/games/connections', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) return null;
        
        const html = await response.text();
        
        // 查找游戏数据
        const gameDataMatch = html.match(/window\.gameData\s*=\s*({.*?});/s);
        if (gameDataMatch) {
            const gameData = JSON.parse(gameDataMatch[1]);
            if (gameData && gameData.today) {
                return parseNYTGameData(gameData.today);
            }
        }
        
        return null;
    } catch (error) {
        console.error('NYT fetch error:', error);
        return null;
    }
}

// 解析NYT游戏数据
function parseNYTGameData(todayData) {
    try {
        if (!todayData.groups || !todayData.startingGroups) return null;
        
        const groups = todayData.groups.map((group, index) => ({
            theme: group.theme || `Group ${index + 1}`,
            words: group.members || [],
            difficulty: ['green', 'yellow', 'blue', 'purple'][group.level] || 'green',
            hint: `These words are all related to "${group.theme}"`
        }));
        
        const words = groups.flatMap(g => g.words);
        
        return {
            date: new Date().toISOString().split('T')[0],
            words: words,
            groups: groups,
            source: 'NYT Official'
        };
    } catch (error) {
        console.error('NYT data parsing error:', error);
        return null;
    }
}

// 从Mashable获取数据
async function fetchFromMashableSource() {
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');
        
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) return null;
        
        const html = await response.text();
        
        // 改进的解析逻辑
        const groups = [];
        
        // 查找答案部分
        const answerSection = html.match(/Connections answer for.*?(?=<\/div>|<div|$)/is);
        if (answerSection) {
            const groupPattern = /(?:Yellow|Green|Blue|Purple).*?:(.*?)(?=(?:Yellow|Green|Blue|Purple)|$)/gis;
            let match;
            
            while ((match = groupPattern.exec(answerSection[0])) !== null && groups.length < 4) {
                const wordsText = match[1];
                const words = wordsText.match(/[A-Z][A-Z\s]+/g);
                
                if (words && words.length >= 4) {
                    const cleanWords = words.slice(0, 4).map(w => w.trim());
                    groups.push({
                        theme: `Group ${groups.length + 1}`,
                        words: cleanWords,
                        difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                        hint: `These words share a common theme`
                    });
                }
            }
        }
        
        if (groups.length === 4) {
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable'
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Mashable fetch error:', error);
        return null;
    }
}

// 从本地文章文件获取数据
async function fetchFromLocalArticles() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试获取今天的文章文件
        const articleResponse = await fetch(`/articles/connections-${today}.md`);
        if (articleResponse.ok) {
            const articleText = await articleResponse.text();
            return parseLocalArticle(articleText, today);
        }
        
        // 尝试获取改进版文章
        const improvedResponse = await fetch(`/articles/connections-${today}-improved.md`);
        if (improvedResponse.ok) {
            const articleText = await improvedResponse.text();
            return parseLocalArticle(articleText, today);
        }
        
        return null;
    } catch (error) {
        console.error('Local article fetch error:', error);
        return null;
    }
}

// 解析本地文章文件
function parseLocalArticle(articleText, date) {
    try {
        const groups = [];
        
        // 查找分组信息
        const groupPattern = /##\s*(.*?)\n((?:- .*?\n)+)/g;
        let match;
        
        while ((match = groupPattern.exec(articleText)) !== null && groups.length < 4) {
            const theme = match[1].trim();
            const wordsText = match[2];
            const words = wordsText.match(/- (.*?)(?:\n|$)/g);
            
            if (words && words.length >= 4) {
                const cleanWords = words.slice(0, 4).map(w => w.replace(/^- /, '').trim());
                groups.push({
                    theme: theme,
                    words: cleanWords,
                    difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                    hint: `These words are all related to "${theme}"`
                });
            }
        }
        
        if (groups.length === 4) {
            return {
                date: date,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Local Article'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Local article parsing error:', error);
        return null;
    }
}

// 备用谜题数据 - 使用今天的真实数据
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
        source: 'Today\'s Puzzle'
    };
}