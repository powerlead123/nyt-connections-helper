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

// 从Mashable获取数据
async function fetchFromMashable() {
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
        
        // 简单的正则解析（实际部署时可能需要更复杂的解析）
        const groups = [];
        const groupPattern = /(\w+(?:\s+\w+)*?):\s*([A-Z\s,]+)/g;
        let match;
        
        while ((match = groupPattern.exec(html)) !== null && groups.length < 4) {
            const theme = match[1].trim();
            const words = match[2].split(',').map(w => w.trim()).filter(w => w);
            
            if (words.length === 4) {
                groups.push({
                    theme: theme,
                    words: words,
                    difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                    hint: `These words are all related to "${theme}"`
                });
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

// 备用谜题数据
function getBackupPuzzle() {
    const today = new Date().toISOString().split('T')[0];
    
    return {
        date: today,
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
        ],
        source: 'Backup'
    };
}