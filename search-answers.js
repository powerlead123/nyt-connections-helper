const axios = require('axios');
const cheerio = require('cheerio');

// 搜索今日 Connections 答案
async function searchTodaysAnswers() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    console.log(`搜索 ${dateStr} 的 Connections 答案...`);
    
    // 搜索查询
    const queries = [
        `"NYT Connections answer" "${dateStr}"`,
        `"Connections puzzle" "${dateStr}" answer`,
        `"New York Times Connections" today answer`
    ];
    
    const searchEngines = [
        {
            name: 'DuckDuckGo',
            url: 'https://duckduckgo.com/html/',
            search: async (query) => {
                try {
                    const response = await axios.get('https://duckduckgo.com/html/', {
                        params: { q: query },
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    const $ = cheerio.load(response.data);
                    const results = [];
                    
                    $('.result__title a').each((i, elem) => {
                        const title = $(elem).text();
                        const url = $(elem).attr('href');
                        if (title && url) {
                            results.push({ title, url });
                        }
                    });
                    
                    return results.slice(0, 5); // 前5个结果
                    
                } catch (error) {
                    console.log('DuckDuckGo 搜索失败:', error.message);
                    return [];
                }
            }
        }
    ];
    
    // 执行搜索
    for (const query of queries) {
        console.log(`搜索: ${query}`);
        
        for (const engine of searchEngines) {
            const results = await engine.search(query);
            
            if (results.length > 0) {
                console.log(`${engine.name} 找到 ${results.length} 个结果:`);
                results.forEach((result, i) => {
                    console.log(`${i + 1}. ${result.title}`);
                    console.log(`   ${result.url}`);
                });
                
                // 尝试从第一个结果获取答案
                const firstResult = results[0];
                if (firstResult) {
                    const answers = await extractAnswersFromUrl(firstResult.url);
                    if (answers) {
                        return answers;
                    }
                }
            }
        }
    }
    
    return null;
}

// 从URL提取答案
async function extractAnswersFromUrl(url) {
    try {
        console.log(`尝试从 ${url} 提取答案...`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const groups = [];
        const words = [];
        
        // 通用的答案提取模式
        const patterns = [
            // 模式1: "主题: 单词1, 单词2, 单词3, 单词4"
            /([^:]+):\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/g,
            // 模式2: "主题 - 单词1, 单词2, 单词3, 单词4"
            /([^-]+)-\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/g
        ];
        
        const text = $.text();
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null && groups.length < 4) {
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
        }
        
        if (groups.length === 4 && words.length === 16) {
            console.log('成功提取答案!');
            return {
                date: getTodayDateString(),
                words: words,
                groups: groups,
                source: url
            };
        }
        
        return null;
        
    } catch (error) {
        console.log('提取答案失败:', error.message);
        return null;
    }
}

// 辅助函数
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getDifficultyByIndex(index) {
    const difficulties = ['green', 'yellow', 'blue', 'purple'];
    return difficulties[index] || 'unknown';
}

function generateHint(theme) {
    const hintTemplates = {
        'animals': 'These are all members of the animal kingdom',
        'colors': 'These are all colors in the visible spectrum',
        'food': 'These can all be found in the kitchen',
        'sports': 'These are all sports activities',
        'music': 'These are all related to music',
        'movies': 'These are all part of the entertainment industry'
    };
    
    return hintTemplates[theme.toLowerCase()] || `These words are all related to "${theme}"`;
}

// 主函数
async function main() {
    const answers = await searchTodaysAnswers();
    
    if (answers) {
        console.log('\n找到今日答案!');
        console.log('来源:', answers.source);
        answers.groups.forEach((group, index) => {
            console.log(`${index + 1}. ${group.theme}: ${group.words.join(', ')}`);
        });
    } else {
        console.log('\n未找到今日答案');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    searchTodaysAnswers
};