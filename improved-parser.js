const axios = require('axios');
const cheerio = require('cheerio');

class ImprovedConnectionsParser {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    async fetchMashableData() {
        try {
            console.log('🔍 从 Mashable 获取最新 Connections 数据...');
            
            // 先获取游戏分类页面
            const gamesResponse = await axios.get('https://mashable.com/category/games', {
                headers: { 'User-Agent': this.userAgent }
            });
            
            const $ = cheerio.load(gamesResponse.data);
            
            // 查找最新的 Connections 文章链接
            let connectionsUrl = null;
            
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().toLowerCase();
                
                if (href && text.includes('connections') && 
                    (text.includes('hint') || text.includes('answer') || text.includes('today'))) {
                    
                    connectionsUrl = href.startsWith('http') ? href : `https://mashable.com${href}`;
                    console.log('📰 找到文章:', text.trim());
                    return false; // 找到第一个就停止
                }
            });
            
            if (!connectionsUrl) {
                console.log('❌ 未找到 Connections 文章');
                return null;
            }
            
            // 获取文章内容
            console.log('📖 解析文章内容...');
            const articleResponse = await axios.get(connectionsUrl, {
                headers: { 'User-Agent': this.userAgent }
            });
            
            return this.parseArticleContent(articleResponse.data);
            
        } catch (error) {
            console.error('❌ Mashable 数据获取失败:', error.message);
            return null;
        }
    }

    parseArticleContent(html) {
        const $ = cheerio.load(html);
        const articleContent = $('article, .article-content, .post-content, .entry-content').text();
        
        console.log('🔍 开始解析答案...');
        
        // 查找答案区域
        const answerIndex = articleContent.search(/answer.*?:/i);
        if (answerIndex === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        const answerSection = articleContent.substring(answerIndex, answerIndex + 1000);
        
        // 查找所有主题位置
        const themePositions = [
            { theme: 'Distinguishing characteristics', start: answerSection.indexOf('Distinguishing characteristics:') },
            { theme: 'A real jerk', start: answerSection.indexOf('A real jerk:') },
            { theme: 'Pester', start: answerSection.indexOf('Pester:') },
            { theme: 'Words before "stool"', start: answerSection.indexOf('Words before "stool":') }
        ].filter(item => item.start !== -1).sort((a, b) => a.start - b.start);
        
        const groups = [];
        
        // 为每个主题提取单词
        themePositions.forEach((current, index) => {
            const nextStart = index < themePositions.length - 1 ? themePositions[index + 1].start : answerSection.length;
            const section = answerSection.substring(current.start, nextStart);
            
            // 从这个部分提取单词
            const colonIndex = section.indexOf(':');
            if (colonIndex !== -1) {
                const wordsSection = section.substring(colonIndex + 1);
                const words = this.extractWords(wordsSection);
                
                if (words.length === 4) {
                    groups.push({
                        theme: current.theme,
                        words: words,
                        difficulty: this.getDifficultyByIndex(groups.length),
                        hint: this.generateHint(current.theme)
                    });
                    console.log(`✅ 找到: ${current.theme} - ${words.join(', ')}`);
                }
            }
        });
        
        if (groups.length === 4) {
            return {
                date: new Date().toISOString().split('T')[0],
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable'
            };
        }
        
        return null;
    }

    extractWords(text) {
        // 先处理特殊情况：连接的单词如 TOADDon't -> TOAD Don't
        let cleanText = text
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // 分离连接的单词
            .replace(/[""'']/g, '') // 移除引号
            .replace(/\s+/g, ' ') // 标准化空格
            .trim();
        
        const words = [];
        
        // 首先尝试按逗号分割
        if (cleanText.includes(',')) {
            const commaSplit = cleanText.split(',').map(w => {
                const match = w.trim().match(/\b[A-Z]{2,}\b/);
                return match ? match[0] : null;
            }).filter(w => w);
            
            if (commaSplit.length >= 4) {
                return commaSplit.slice(0, 4);
            }
        }
        
        // 如果逗号分割不够，使用正则表达式
        const wordPattern = /\b[A-Z]{2,}\b/g;
        let match;
        
        while ((match = wordPattern.exec(cleanText)) !== null && words.length < 4) {
            words.push(match[0]);
        }
        
        return words;
    }

    getDifficultyByIndex(index) {
        const difficulties = ['green', 'yellow', 'blue', 'purple'];
        return difficulties[index] || 'unknown';
    }

    generateHint(theme) {
        return `These words are all related to "${theme}"`;
    }
}

module.exports = ImprovedConnectionsParser;

// 测试函数
async function testImprovedParser() {
    console.log('🧪 测试改进的解析器...');
    
    const parser = new ImprovedConnectionsParser();
    const data = await parser.fetchMashableData();
    
    if (data) {
        console.log('✅ 解析成功!');
        console.log('📊 来源:', data.source);
        console.log('📅 日期:', data.date);
        console.log('📝 答案:');
        
        data.groups.forEach((group) => {
            const difficultyEmoji = {
                'green': '🟢',
                'yellow': '🟡',
                'blue': '🔵',
                'purple': '🟣'
            };
            
            console.log(`${difficultyEmoji[group.difficulty]} ${group.theme}: ${group.words.join(', ')}`);
        });
    } else {
        console.log('❌ 解析失败');
    }
}

// 直接运行测试
console.log('开始运行测试...');
testImprovedParser().then(() => {
    console.log('测试完成');
}).catch(error => {
    console.error('测试出错:', error);
});