// 修复自动抓取系统
async function fixAutoScraping() {
    console.log('🔧 修复自动抓取系统...\n');
    
    // 测试多个数据源
    const dataSources = [
        {
            name: 'Mashable',
            test: testMashable
        },
        {
            name: 'NYT Games API',
            test: testNYTAPI
        },
        {
            name: 'Alternative Sources',
            test: testAlternativeSources
        }
    ];
    
    for (const source of dataSources) {
        console.log(`\n🔍 测试 ${source.name}...`);
        try {
            const result = await source.test();
            if (result) {
                console.log(`✅ ${source.name} 成功获取数据!`);
                console.log('数据:', result);
                
                // 更新API文件
                await updateAPIWithNewData(result);
                return result;
            } else {
                console.log(`❌ ${source.name} 无法获取数据`);
            }
        } catch (error) {
            console.log(`❌ ${source.name} 错误: ${error.message}`);
        }
    }
    
    console.log('\n❌ 所有数据源都失败了');
    return null;
}

// 测试Mashable (改进版)
async function testMashable() {
    const today = new Date();
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthName = monthNames[today.getMonth()];
    const day = today.getDate();
    const year = today.getFullYear();
    
    const urls = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/connections-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-${monthName}-${day}-${year}`
    ];
    
    // 使用多个代理服务
    const proxyServices = [
        (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url) => `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    for (const baseUrl of urls) {
        for (const proxyFn of proxyServices) {
            try {
                const proxyUrl = proxyFn(baseUrl);
                console.log(`   尝试: ${baseUrl}`);
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(15000)
                });
                
                if (!response.ok) continue;
                
                let html;
                if (proxyUrl.includes('allorigins.win')) {
                    const data = await response.json();
                    html = data.contents;
                } else {
                    html = await response.text();
                }
                
                if (!html || html.length < 1000) continue;
                
                console.log(`   获取HTML成功: ${html.length} 字符`);
                
                // 使用改进的解析方法
                const result = parseWithImprovedMethod(html, today.toISOString().split('T')[0]);
                if (result) {
                    return result;
                }
                
            } catch (error) {
                console.log(`   代理失败: ${error.message}`);
                continue;
            }
        }
    }
    
    return null;
}

// 改进的解析方法
function parseWithImprovedMethod(html, dateStr) {
    try {
        console.log('   🔍 使用改进的解析方法...');
        
        // 策略1: 查找所有可能的答案文本
        const answerSections = [
            // 查找包含"answer"的段落
            ...html.match(/<p[^>]*>[\s\S]*?answer[\s\S]*?<\/p>/gi) || [],
            // 查找包含颜色的段落
            ...html.match(/<p[^>]*>[\s\S]*?(?:green|yellow|blue|purple)[\s\S]*?<\/p>/gi) || [],
            // 查找列表
            ...html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [],
            // 查找包含答案的div
            ...html.match(/<div[^>]*>[\s\S]*?(?:answer|solution)[\s\S]*?<\/div>/gi) || []
        ];
        
        console.log(`   找到 ${answerSections.length} 个可能的答案区域`);
        
        // 从所有区域提取单词
        const allWords = new Set();
        
        for (const section of answerSections) {
            const words = extractAllPossibleWords(section);
            words.forEach(word => allWords.add(word));
        }
        
        const wordArray = Array.from(allWords);
        console.log(`   提取到 ${wordArray.length} 个候选单词:`, wordArray.slice(0, 20));
        
        // 策略2: 智能分组
        if (wordArray.length >= 16) {
            // 尝试找到最可能的16个单词
            const bestWords = selectBestWords(wordArray, html);
            
            if (bestWords.length >= 16) {
                const groups = createIntelligentGroups(bestWords, html);
                
                if (groups.length === 4) {
                    return {
                        date: dateStr,
                        words: groups.flatMap(g => g.words),
                        groups: groups,
                        source: 'Mashable (Auto-Improved)'
                    };
                }
            }
        }
        
        // 策略3: 基于HTML结构的解析
        const structuredResult = parseByStructure(html, dateStr);
        if (structuredResult) {
            return structuredResult;
        }
        
        return null;
        
    } catch (error) {
        console.log(`   解析错误: ${error.message}`);
        return null;
    }
}

// 提取所有可能的单词
function extractAllPossibleWords(text) {
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    const patterns = [
        /\b[A-Z]{2,15}\b/g,           // 全大写单词
        /\b[A-Z][a-z]{1,14}\b/g,     // 首字母大写
        /\b[A-Z][\w\-']{1,14}\b/g,   // 大写开头，可能包含连字符
        /"([^"]{2,15})"/g,            // 引号中的内容
        /\b\d+[\-\/]\d+\b/g          // 数字组合 (如 7-ELEVEN)
    ];
    
    const words = [];
    for (const pattern of patterns) {
        const matches = cleanText.match(pattern) || [];
        words.push(...matches);
    }
    
    // 清理和过滤
    return words
        .map(word => word.replace(/['"]/g, '').trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE|THIS|THAT|THESE|THOSE|BUT|NOT|ALL|ANY|CAN|HAD|HER|HIM|HIS|HOW|ITS|MAY|NEW|NOW|OLD|SEE|TWO|WHO|BOY|DID|GET|HAS|LET|PUT|SAY|SHE|TOO|USE|YOU|WILL|ABOUT|AFTER|AGAIN|BEFORE|HERE|JUST|LIKE|MAKE|MOST|OVER|SUCH|TAKE|THAN|THEM|WELL|WERE|WHAT|WHERE|WHICH|WHILE|WHO|WILL|WITH|WOULD|YOUR|ALSO|BACK|BECAUSE|BEEN|BEING|BETWEEN|BOTH|CAME|COME|COULD|EACH|FIRST|FROM|GOOD|GREAT|GROUP|HAVE|INTO|KNOW|LAST|LIFE|LONG|LOOK|MADE|MANY|MORE|MUCH|MUST|NEVER|ONLY|OTHER|OUR|OUT|OWN|PART|PEOPLE|RIGHT|SAME|SHOULD|SINCE|SOME|STILL|SUCH|SYSTEM|THEIR|THERE|THESE|THEY|THINK|THIS|THOSE|THREE|THROUGH|TIME|UNDER|UNTIL|VERY|WANT|WATER|WAY|WE|WELL|WENT|WHAT|WHEN|WHERE|WHICH|WHILE|WHO|WHY|WILL|WITH|WORK|WORLD|WOULD|YEAR|YOU|YOUR)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);
}

// 选择最佳单词
function selectBestWords(words, html) {
    // 根据在HTML中的出现频率和上下文来评分
    const wordScores = words.map(word => {
        let score = 0;
        
        // 基础分数
        score += 1;
        
        // 如果单词出现在答案相关的上下文中，加分
        const contextPatterns = [
            new RegExp(`answer[\\s\\S]{0,200}${word}`, 'gi'),
            new RegExp(`${word}[\\s\\S]{0,200}answer`, 'gi'),
            new RegExp(`solution[\\s\\S]{0,200}${word}`, 'gi'),
            new RegExp(`(green|yellow|blue|purple)[\\s\\S]{0,200}${word}`, 'gi')
        ];
        
        for (const pattern of contextPatterns) {
            if (pattern.test(html)) {
                score += 2;
            }
        }
        
        // 如果单词长度合适，加分
        if (word.length >= 3 && word.length <= 10) {
            score += 1;
        }
        
        // 如果是常见的Connections单词类型，加分
        if (/^[A-Z]+$/.test(word)) {
            score += 1;
        }
        
        return { word, score };
    });
    
    // 按分数排序，取前20个
    return wordScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(item => item.word);
}

// 创建智能分组
function createIntelligentGroups(words, html) {
    // 尝试根据HTML中的提示创建分组
    const groups = [];
    const colors = ['green', 'yellow', 'blue', 'purple'];
    const difficulties = ['green', 'yellow', 'blue', 'purple'];
    
    // 查找颜色相关的提示
    const colorHints = {};
    for (const color of colors) {
        const hintPattern = new RegExp(`${color}[\\s\\S]{0,300}<strong>([^<]+)</strong>`, 'gi');
        const match = hintPattern.exec(html);
        if (match) {
            colorHints[color] = match[1].trim();
        }
    }
    
    console.log('   找到的颜色提示:', colorHints);
    
    // 创建4个组，每组4个单词
    for (let i = 0; i < 4; i++) {
        const color = colors[i];
        const difficulty = difficulties[i];
        const theme = colorHints[color] || `${color.charAt(0).toUpperCase() + color.slice(1)} Group`;
        const groupWords = words.slice(i * 4, (i + 1) * 4);
        
        if (groupWords.length === 4) {
            groups.push({
                theme: theme,
                words: groupWords,
                difficulty: difficulty,
                hint: theme
            });
        }
    }
    
    return groups;
}

// 基于结构的解析
function parseByStructure(html, dateStr) {
    // 查找结构化的答案列表
    const structurePatterns = [
        // 有序列表
        /<ol[^>]*>([\s\S]*?)<\/ol>/gi,
        // 无序列表
        /<ul[^>]*>([\s\S]*?)<\/ul>/gi,
        // 表格
        /<table[^>]*>([\s\S]*?)<\/table>/gi
    ];
    
    for (const pattern of structurePatterns) {
        const matches = html.match(pattern) || [];
        for (const match of matches) {
            const listItems = match.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
            const cellItems = match.match(/<td[^>]*>(.*?)<\/td>/gi) || [];
            
            const items = [...listItems, ...cellItems];
            
            if (items.length >= 16) {
                const words = items
                    .map(item => extractAllPossibleWords(item))
                    .flat()
                    .slice(0, 16);
                
                if (words.length >= 16) {
                    const groups = [];
                    for (let i = 0; i < 4; i++) {
                        groups.push({
                            theme: `Group ${i + 1}`,
                            words: words.slice(i * 4, (i + 1) * 4),
                            difficulty: ['green', 'yellow', 'blue', 'purple'][i],
                            hint: 'These words share a common theme'
                        });
                    }
                    
                    return {
                        date: dateStr,
                        words: words.slice(0, 16),
                        groups: groups,
                        source: 'Mashable (Structure-based)'
                    };
                }
            }
        }
    }
    
    return null;
}

// 测试NYT API
async function testNYTAPI() {
    console.log('   尝试NYT Games API...');
    
    // NYT可能有内部API
    const nytUrls = [
        'https://www.nytimes.com/svc/connections/v2/puzzle.json',
        'https://www.nytimes.com/games-assets/connections/puzzle.json',
        'https://www.nytimes.com/puzzles/connections'
    ];
    
    for (const url of nytUrls) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json,text/html,*/*'
                },
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('   NYT API响应:', data);
                
                // 尝试解析NYT数据格式
                const parsed = parseNYTData(data);
                if (parsed) {
                    return parsed;
                }
            }
        } catch (error) {
            console.log(`   NYT API错误: ${error.message}`);
        }
    }
    
    return null;
}

// 解析NYT数据
function parseNYTData(data) {
    // NYT数据格式可能不同，需要适配
    if (data && data.groups && Array.isArray(data.groups)) {
        const today = new Date().toISOString().split('T')[0];
        
        return {
            date: today,
            words: data.groups.flatMap(g => g.words || []),
            groups: data.groups.map(g => ({
                theme: g.theme || g.title || 'Unknown',
                words: g.words || [],
                difficulty: g.difficulty || 'unknown',
                hint: g.hint || g.description || 'These words share a common theme'
            })),
            source: 'NYT Official API'
        };
    }
    
    return null;
}

// 测试其他数据源
async function testAlternativeSources() {
    console.log('   尝试其他数据源...');
    
    const sources = [
        'https://connectionsanswers.org',
        'https://gamerant.com',
        'https://dotesports.com'
    ];
    
    // 这里可以添加其他网站的解析逻辑
    // 暂时返回null，表示未实现
    return null;
}

// 更新API文件
async function updateAPIWithNewData(puzzleData) {
    console.log('\n🔄 更新API文件...');
    
    const apiContent = `// Cloudflare Pages Function for today's puzzle - Auto-updated
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试从KV存储获取数据
        let puzzleData = null;
        
        if (env.CONNECTIONS_KV) {
            try {
                puzzleData = await env.CONNECTIONS_KV.get(\`puzzle-\${today}\`, 'json');
                console.log('KV data found:', puzzleData ? 'yes' : 'no');
            } catch (error) {
                console.log('KV fetch error:', error);
            }
        }
        
        // 如果KV中没有数据，使用自动获取的数据
        if (!puzzleData || !puzzleData.groups || puzzleData.groups.length !== 4) {
            console.log('Using auto-scraped data');
            puzzleData = ${JSON.stringify(puzzleData, null, 12)};
        }
        
        return new Response(JSON.stringify(puzzleData), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
            }
        });
        
    } catch (error) {
        console.error('Today API error:', error);
        
        // 返回自动获取的数据作为备用
        const autoData = ${JSON.stringify(puzzleData, null, 12)};
        
        return new Response(JSON.stringify(autoData), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}`;

    // 写入文件
    const fs = require('fs').promises;
    await fs.writeFile('functions/api/today.js', apiContent, 'utf8');
    console.log('   ✅ API文件已更新');
    
    return true;
}

// 运行修复
fixAutoScraping().then(result => {
    if (result) {
        console.log('\n🎉 自动抓取修复成功！');
        console.log('现在推送更改...');
        
        // 这里可以添加git推送逻辑
    } else {
        console.log('\n❌ 自动抓取仍然失败');
        console.log('需要进一步调试数据源');
    }
}).catch(console.error);