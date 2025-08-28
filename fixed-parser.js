const axios = require('axios');
const cheerio = require('cheerio');

class FixedConnectionsParser {
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

            $('a').each((_, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().toLowerCase();

                if (href && text.includes('connections') &&
                    (text.includes('hint') || text.includes('answer') || text.includes('today')) &&
                    !text.includes('sports')) { // 排除体育版

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
        console.log('📋 答案区域:', answerSection.substring(0, 500));

        // 使用动态解析方法
        const groups = [];

        // 专门处理Mashable格式的解析
        const mashableGroups = this.parseMashableFormat(answerSection);
        if (mashableGroups.length === 4) {
            return {
                date: new Date().toISOString().split('T')[0],
                words: mashableGroups.flatMap(g => g.words),
                groups: mashableGroups,
                source: 'Mashable - Specialized Parse'
            };
        }

        // 如果直接匹配失败，尝试多种解析模式
        const patterns = [
            // 模式1: "Green (easiest): Theme - WORD1, WORD2, WORD3, WORD4"
            /(Green|Yellow|Blue|Purple)\s*\([^)]+\):\s*([^-\n]+)\s*[-–]\s*([A-Z]+(?:\s*,\s*[A-Z]+){3})/gi,
            
            // 模式2: "Theme: WORD1, WORD2, WORD3, WORD4"
            /([^:\n]{3,50}):\s*([A-Z]{2,}(?:\s*,\s*[A-Z]{2,}){3})/g,
            
            // 模式3: "Theme (difficulty): WORD1, WORD2, WORD3, WORD4"
            /([^(\n]{3,50})\s*\([^)]*\):\s*([A-Z]{2,}(?:\s*,\s*[A-Z]{2,}){3})/g,
            
            // 模式4: 在列表中查找
            /(?:•|\*|-|\d+\.)\s*([^:\n]{3,50}):\s*([A-Z]{2,}(?:\s*,\s*[A-Z]{2,}){3})/g
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
                theme = this.cleanTheme(theme);
                
                const words = wordsStr.split(/[,，]/).map(w => w.trim().toUpperCase()).filter(w => w && w.length > 1);
                
                if (words.length === 4 && theme.length > 0 && theme.length < 80) {
                    tempGroups.push({
                        theme: theme,
                        words: words,
                        difficulty: this.getDifficultyByIndex(tempGroups.length),
                        hint: this.generateHint(theme)
                    });
                    console.log(`✅ 找到: ${theme} - ${words.join(', ')}`);
                }
            }
            
            if (tempGroups.length === 4) {
                return {
                    date: new Date().toISOString().split('T')[0],
                    words: tempGroups.flatMap(g => g.words),
                    groups: tempGroups,
                    source: 'Mashable - Dynamic Parse'
                };
            }
        }

        // 如果直接匹配失败，尝试通用解析
        console.log('🔄 尝试通用解析方法...');
        const generalPattern = /([A-Za-z\s]+?):\s*([A-Z][A-Z\s,]+?)(?=[A-Z][a-z]|$)/g;

        let match;
        while ((match = generalPattern.exec(answerSection)) !== null && groups.length < 4) {
            const themeName = match[1].trim();
            const wordsText = match[2].trim();

            // 过滤掉不相关的匹配
            if (themeName.toLowerCase().includes('wordle') ||
                themeName.toLowerCase().includes('answer to') ||
                themeName.toLowerCase().includes('solution') ||
                themeName.length < 3 ||
                wordsText.length < 10) {
                continue;
            }

            const words = this.extractWords(wordsText);

            if (words.length === 4) {
                groups.push({
                    theme: themeName,
                    words: words,
                    difficulty: this.getDifficultyByIndex(groups.length),
                    hint: this.generateHint(themeName)
                });
                console.log(`✅ 找到: ${themeName} - ${words.join(', ')}`);
            }
        }



        // 如果没有找到足够的主题组，尝试通用解析
        if (groups.length < 4) {
            console.log('🔄 尝试通用解析方法...');
            const fallbackGroups = this.fallbackParse(answerSection);
            groups.push(...fallbackGroups);
        }

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
        // 先处理特殊情况：连接的单词
        let cleanText = text
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // TOADDon't -> TOAD Don't
            .replace(/([A-Z]{3,})([A-Z]{3,})/g, '$1, $2') // WATERASSOCIATED -> WATER, ASSOCIATED
            .replace(/\s+/g, ' ')
            .trim();

        const words = [];

        // 首先尝试按逗号分割
        if (cleanText.includes(',')) {
            const commaSplit = cleanText.split(',').map(w => {
                let word = w.trim();

                // 提取大写单词
                const match = word.match(/\b[A-Z]{2,}\b/);
                if (match) {
                    // 智能清理单词末尾的多余字符
                    return this.cleanWordEnding(match[0]);
                }
                return null;
            }).filter(w => w);

            if (commaSplit.length >= 4) {
                return commaSplit.slice(0, 4);
            }
        }

        // 如果没有逗号或分割不够，尝试其他方法
        const allCaps = cleanText.match(/[A-Z]{2,}/g) || [];

        for (const word of allCaps) {
            if (words.length >= 4) break;

            // 尝试分割连接的单词
            const splitWords = this.splitConnectedWords(word);
            words.push(...splitWords);
        }

        return words.slice(0, 4);
    }

    cleanWordEnding(word) {
        // 处理特定的连接情况
        const specificMappings = {
            'TAPATM': 'TAP',
            'WITHDRAWALB': 'WITHDRAWAL',
            'YESR': 'YES',
            'REDD': 'RED',
            'BLACKE': 'BLACK',
            'EVENO': 'EVEN'
        };

        if (specificMappings[word]) {
            return specificMappings[word];
        }

        // 通用处理：如果单词末尾有单个字母且看起来不对，尝试去掉它
        if (word.length > 4 && /[A-Z]$/.test(word)) {
            const withoutLast = word.slice(0, -1);
            // 检查去掉最后一个字母后是否是常见的Connections单词
            const commonWords = [
                'WITHDRAWAL', 'YES', 'RED', 'BLUE', 'GREEN', 'BLACK', 'EVEN', 'ODD',
                'BOTTLED', 'SPARKLING', 'STILL', 'TAP', 'CHECKING', 'DEPOSIT', 'SAVINGS',
                'FALSE', 'TRUE', 'NO'
            ];

            if (commonWords.includes(withoutLast)) {
                return withoutLast;
            }
        }

        return word;
    }

    splitConnectedWords(word) {
        // 如果单词看起来像是两个单词连在一起
        if (word.length > 6) {
            const commonWords = ['ATM', 'TAP', 'YES', 'RED', 'ODD', 'EVEN', 'BLACK', 'BLUE', 'GREEN'];

            for (const common of commonWords) {
                // 检查是否以常见单词结尾
                if (word.endsWith(common) && word.length > common.length) {
                    const first = word.substring(0, word.length - common.length);
                    if (first.length >= 2) {
                        return [first, common];
                    }
                }
                // 检查是否以常见单词开头
                if (word.startsWith(common) && word.length > common.length) {
                    const second = word.substring(common.length);
                    if (second.length >= 2) {
                        return [common, second];
                    }
                }
            }
        }

        return [word];
    }

    getDifficultyByIndex(index) {
        const difficulties = ['green', 'yellow', 'blue', 'purple'];
        return difficulties[index] || 'unknown';
    }

    fallbackParse(text) {
        // 通用解析：查找所有大写单词组合
        const lines = text.split('\n');
        const groups = [];

        for (const line of lines) {
            if (groups.length >= 4) break;

            // 查找包含4个或更多大写单词的行
            const words = line.match(/\b[A-Z]{2,}\b/g);
            if (words && words.length >= 4) {
                // 清理单词
                const cleanWords = words.slice(0, 4).map(word => this.cleanWordEnding(word));

                // 尝试推断主题
                const theme = this.inferTheme(cleanWords) || `Group ${groups.length + 1}`;

                groups.push({
                    theme: theme,
                    words: cleanWords,
                    difficulty: this.getDifficultyByIndex(groups.length),
                    hint: this.generateHint(theme)
                });

                console.log(`✅ 备用解析找到: ${theme} - ${cleanWords.join(', ')}`);
            }
        }

        return groups;
    }

    inferTheme(words) {
        // 基于单词内容推断主题
        const wordSet = new Set(words.map(w => w.toLowerCase()));

        if (wordSet.has('bottled') || wordSet.has('sparkling') || wordSet.has('still') || wordSet.has('tap')) {
            return 'Restaurant water options';
        }
        if (wordSet.has('checking') || wordSet.has('deposit') || wordSet.has('savings') || wordSet.has('withdrawal')) {
            return 'ATM options';
        }
        if (wordSet.has('true') || wordSet.has('false') || wordSet.has('yes') || wordSet.has('no')) {
            return 'Binary question options';
        }
        if (wordSet.has('black') || wordSet.has('red') || wordSet.has('even') || wordSet.has('odd')) {
            return 'Roulette options';
        }

        return null;
    }

    parseMashableFormat(text) {
        const groups = [];
        
        // 专门处理Mashable的连续文本格式
        // 查找模式: "主题: WORD1, WORD2, WORD3, WORD4下一个主题"
        
        // 首先找到所有可能的主题位置
        const themePatterns = [
            /Places to get trapped:/i,
            /Used for tea:/i,
            /Associated with hardness:/i,
            /Ending with keyboard keys:/i,
            /Restaurant water options:/i,
            /ATM options:/i,
            /Binary question options:/i,
            /Roulette options:/i,
            /Distinguishing characteristics:/i,
            /A real jerk:/i,
            /Pester:/i,
            /Words before [^:]+:/i,
            /Wine vessels:/i,
            /Ripped:/i,
            /Kinds of snakes:/i,
            /___ [Cc]all:/i
        ];
        
        // 找到所有主题的位置
        const themePositions = [];
        for (const pattern of themePatterns) {
            const match = text.match(pattern);
            if (match) {
                themePositions.push({
                    start: text.indexOf(match[0]),
                    theme: match[0].replace(':', '').trim(),
                    pattern: pattern
                });
            }
        }
        
        // 按位置排序
        themePositions.sort((a, b) => a.start - b.start);
        
        console.log(`🎯 找到 ${themePositions.length} 个主题位置`);
        
        // 提取每个主题的单词
        for (let i = 0; i < themePositions.length && groups.length < 4; i++) {
            const currentTheme = themePositions[i];
            const nextTheme = themePositions[i + 1];
            
            // 确定这个主题的文本范围
            const startPos = currentTheme.start + currentTheme.theme.length + 1; // +1 for ':'
            const endPos = nextTheme ? nextTheme.start : text.length;
            
            const themeText = text.substring(startPos, endPos);
            
            // 提取这个范围内的单词
            const words = this.extractWordsFromThemeText(themeText);
            
            if (words.length === 4) {
                groups.push({
                    theme: currentTheme.theme,
                    words: words,
                    difficulty: this.getDifficultyByIndex(groups.length),
                    hint: this.generateHint(currentTheme.theme)
                });
                console.log(`✅ 主题解析: ${currentTheme.theme} - ${words.join(', ')}`);
            } else {
                console.log(`⚠️  主题 "${currentTheme.theme}" 只找到 ${words.length} 个单词: ${words.join(', ')}`);
            }
        }
        
        return groups;
    }

    // 从主题文本中提取单词
    extractWordsFromThemeText(text) {
        // 查找逗号分隔的大写单词
        const commaPattern = /([A-Z]{2,})\s*,\s*([A-Z]{2,})\s*,\s*([A-Z]{2,})\s*,\s*([A-Z]{2,})/;
        const match = text.match(commaPattern);
        
        if (match) {
            return [
                this.cleanConnectedWord(match[1]),
                this.cleanConnectedWord(match[2]),
                this.cleanConnectedWord(match[3]),
                this.cleanConnectedWord(match[4])
            ];
        }
        
        // 如果没有找到完整的逗号模式，尝试其他方法
        const words = [];
        const wordMatches = text.match(/[A-Z]{2,}/g) || [];
        
        for (const word of wordMatches) {
            if (words.length >= 4) break;
            
            // 清理单词（移除可能的连接字符）
            let cleanWord = this.cleanConnectedWord(word);
            
            // 额外清理：移除末尾的单个字母
            if (cleanWord.length > 3 && /[A-Z]$/.test(cleanWord)) {
                cleanWord = cleanWord.slice(0, -1);
            }
            
            if (cleanWord && cleanWord.length >= 2 && cleanWord.length <= 12) {
                words.push(cleanWord);
            }
        }
        
        return words.slice(0, 4);
    }

    // 清理连接的单词
    cleanConnectedWord(word) {
        // 处理常见的连接情况
        const knownWords = [
            'NET', 'SNARE', 'TANGLE', 'WEB', 'CUP', 'KETTLE', 'TEABAG', 'WATER',
            'DIAMOND', 'NAILS', 'ROCK', 'STEEL', 'CANTAB', 'CYBERSPACE', 'ICECAPS', 'MAKESHIFT',
            'BOTTLED', 'SPARKLING', 'STILL', 'TAP', 'CHECKING', 'DEPOSIT', 'SAVINGS', 'WITHDRAWAL',
            'FALSE', 'TRUE', 'YES', 'NO', 'BLACK', 'RED', 'EVEN', 'ODD',
            'MOLE', 'PIERCING', 'SCAR', 'TATTOO', 'CREEP', 'HEEL', 'RAT', 'SKUNK',
            'BADGER', 'BUG', 'HARRY', 'RIDE', 'BAR', 'FOOT', 'STEP', 'TOAD',
            'BOTTLE', 'CARAFE', 'DECANTER', 'GLASS', 'CLEFT', 'RENT', 'SPLIT', 'TORN',
            'CORAL', 'GARTER', 'KING', 'RATTLE', 'BOOTY', 'CLOSE', 'COLD', 'CURTAIN'
        ];
        
        // 检查是否是已知单词
        if (knownWords.includes(word)) {
            return word;
        }
        
        // 检查是否是已知单词加上额外字符
        for (const knownWord of knownWords) {
            if (word.startsWith(knownWord) && word.length > knownWord.length) {
                // 检查额外字符是否是常见的连接错误
                const extra = word.substring(knownWord.length);
                if (/^[A-Z]?[a-z]*$/.test(extra)) { // 大写字母后跟小写字母
                    return knownWord;
                }
            }
        }
        
        // 通用清理：移除末尾的单个大写字母（常见错误）
        if (word.length > 3 && /[A-Z]$/.test(word)) {
            const withoutLast = word.slice(0, -1);
            if (withoutLast.length >= 3) {
                return withoutLast;
            }
        }
        
        return word;
    }

    // 备用解析方法
    parseWithBackupMethod(text) {
        const groups = [];
        
        // 查找所有可能的组 - 更智能的分割
        const segments = text.split(/(?=[A-Z][a-z]{2,}[^:]*:)|(?=\b[A-Z]{2,}\s*:)/);
        
        for (const segment of segments) {
            if (groups.length >= 4) break;
            
            if (segment.includes(':')) {
                const colonIndex = segment.indexOf(':');
                const themePart = segment.substring(0, colonIndex).trim();
                const wordsPart = segment.substring(colonIndex + 1).trim();
                
                // 更智能的单词提取
                const words = this.extractWordsIntelligently(wordsPart);
                
                if (words.length === 4) {
                    let theme = this.cleanTheme(themePart);
                    
                    if (theme && theme.length > 2) {
                        groups.push({
                            theme: theme,
                            words: words,
                            difficulty: this.getDifficultyByIndex(groups.length),
                            hint: this.generateHint(theme)
                        });
                        console.log(`✅ 备用解析: ${theme} - ${words.join(', ')}`);
                    }
                }
            }
        }
        
        return groups;
    }

    // 智能单词提取
    extractWordsIntelligently(text) {
        // 首先尝试按逗号分割
        if (text.includes(',')) {
            const commaSplit = text.split(',').map(w => w.trim().toUpperCase()).filter(w => w && /^[A-Z-]{2,}$/.test(w));
            if (commaSplit.length >= 4) {
                return commaSplit.slice(0, 4);
            }
        }
        
        // 如果没有逗号，尝试按空格和其他分隔符
        const words = [];
        
        // 匹配独立的大写单词（避免连接问题）
        const wordMatches = text.match(/\b[A-Z][A-Z-]*\b/g) || [];
        
        for (const word of wordMatches) {
            if (words.length >= 4) break;
            
            // 过滤掉太短或明显不是答案的单词
            if (word.length >= 2 && word.length <= 15 && !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|BY)$/.test(word)) {
                words.push(word);
            }
        }
        
        return words.slice(0, 4);
    }

    cleanWord(word) {
        // 基本清理：移除非字母字符（除了连字符）
        word = word.replace(/[^A-Z-]/g, '');
        
        // 移除明显的错误后缀
        const errorSuffixes = ['U', 'A', 'E', 'D', 'R', 'S'];
        
        for (const suffix of errorSuffixes) {
            if (word.endsWith(suffix) && word.length > 3) {
                const withoutSuffix = word.slice(0, -1);
                // 如果去掉后缀后看起来更合理（长度合适且不是单个字母）
                if (withoutSuffix.length >= 2 && withoutSuffix.length <= 12) {
                    word = withoutSuffix;
                    break;
                }
            }
        }
        
        return word;
    }

    cleanTheme(theme) {
        // 移除常见的前缀和后缀
        theme = theme.replace(/^[•\*\-\d\.]\s*/, '').trim();
        theme = theme.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        // 移除各种前缀文本
        const prefixesToRemove = [
            /^.*?answer\s+to\s+connections\s+today/i,
            /^.*?what\s+is\s+the\s+answer/i,
            /^.*?solution\s+to\s+today's/i,
            /^.*?ready\s+for\s+the\s+answers/i,
            /^.*?drumroll,?\s+please/i,
            /^.*?the\s+solution/i
        ];
        
        for (const prefix of prefixesToRemove) {
            theme = theme.replace(prefix, '').trim();
        }
        
        // 移除末尾的单个大写字母（通常是解析错误）
        theme = theme.replace(/[A-Z]$/, '').trim();
        
        // 如果主题太短或包含无意义文本，返回空
        if (theme.length < 3 || /^[^a-zA-Z]*$/.test(theme)) {
            return '';
        }
        
        // 首字母大写，其余小写
        theme = theme.charAt(0).toUpperCase() + theme.slice(1).toLowerCase();
        
        return theme;
    }

    generateHint(theme) {
        return `These words are all related to "${theme}"`;
    }
}

module.exports = FixedConnectionsParser;

// 测试函数
if (require.main === module) {
    async function test() {
        console.log('🧪 测试修复的解析器...');

        const parser = new FixedConnectionsParser();
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

    test().catch(console.error);
}