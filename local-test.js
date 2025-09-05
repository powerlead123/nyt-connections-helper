// 本地测试脚本 - 调试Mashable解析逻辑

async function testMashableParsing() {
    try {
        console.log('开始测试Mashable解析逻辑...');

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');

        // 今天的URL
        const testUrl = `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`;

        console.log(`测试日期: ${dateStr}`);
        console.log(`目标URL: ${testUrl}`);
        console.log(`代理URL: ${proxyUrl}`);

        const response = await fetch(proxyUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            console.error('代理请求失败:', response.status);
            return;
        }

        const data = await response.json();
        const html = data.contents;

        if (!html) {
            console.error('没有获取到HTML内容');
            return;
        }

        console.log(`HTML长度: ${html.length}`);
        console.log(`HTTP状态: ${data.status?.http_code || 'unknown'}`);

        // 基本内容检查
        const checks = {
            hasConnections: html.toLowerCase().includes('connections'),
            hasAnswer: html.toLowerCase().includes('answer'),
            hasToday: html.toLowerCase().includes('today'),
            hasGreen: html.toLowerCase().includes('green'),
            hasYellow: html.toLowerCase().includes('yellow'),
            hasBlue: html.toLowerCase().includes('blue'),
            hasPurple: html.toLowerCase().includes('purple')
        };

        console.log('内容检查:', checks);

        // 日期检查
        const dateChecks = {
            'august 29': html.toLowerCase().includes('august 29'),
            '29 august': html.toLowerCase().includes('29 august'),
            '8/29': html.includes('8/29'),
            '29/8': html.includes('29/8'),
            '08-29': html.includes('08-29'),
            '29-08': html.includes('29-08')
        };

        console.log('日期匹配:', dateChecks);

        // 颜色词统计
        const colorCounts = {
            green: (html.match(/green/gi) || []).length,
            yellow: (html.match(/yellow/gi) || []).length,
            blue: (html.match(/blue/gi) || []).length,
            purple: (html.match(/purple/gi) || []).length
        };

        console.log('颜色词出现次数:', colorCounts);

        // 表情符号统计
        const emojiCounts = {
            green: (html.match(/🟢/g) || []).length,
            yellow: (html.match(/🟡/g) || []).length,
            blue: (html.match(/🔵/g) || []).length,
            purple: (html.match(/🟣/g) || []).length
        };

        console.log('表情符号出现次数:', emojiCounts);

        // HTML结构分析
        const structure = {
            strongTags: (html.match(/<strong[^>]*>/gi) || []).length,
            listItems: (html.match(/<li[^>]*>/gi) || []).length,
            paragraphs: (html.match(/<p[^>]*>/gi) || []).length,
            headers: (html.match(/<h[1-6][^>]*>/gi) || []).length
        };

        console.log('HTML结构:', structure);

        // 查找大写单词
        const uppercaseWords = (html.match(/\b[A-Z]{2,}\b/g) || []).slice(0, 30);
        console.log('大写单词样本:', uppercaseWords);

        // 尝试解析
        console.log('\n开始解析...');
        const parseResult = parseMashableHTML(html, dateStr);

        if (parseResult) {
            console.log('✅ 解析成功!');
            console.log('解析结果:', JSON.stringify(parseResult, null, 2));
        } else {
            console.log('❌ 解析失败');

            // 显示HTML片段用于调试
            console.log('\nHTML预览 (前2000字符):');
            console.log(html.substring(0, 2000));

            // 查找可能的答案区域
            console.log('\n查找答案相关内容:');
            const answerSections = html.match(/answer[\s\S]{0,500}/gi) || [];
            answerSections.slice(0, 3).forEach((section, i) => {
                console.log(`答案区域 ${i + 1}:`, section.substring(0, 200));
            });
        }

    } catch (error) {
        console.error('测试出错:', error.message);
        console.error('错误堆栈:', error.stack);
    }
}

// Mashable HTML解析函数
function parseMashableHTML(html, dateStr) {
    try {
        const groups = [];

        console.log('开始Mashable HTML解析...');

        // 策略1: 查找颜色标题后的内容
        const colorPatterns = [
            /(?:Green|GREEN)[\s\S]*?:([\s\S]*?)(?=(?:Yellow|YELLOW|Blue|BLUE|Purple|PURPLE)|$)/gi,
            /(?:Yellow|YELLOW)[\s\S]*?:([\s\S]*?)(?=(?:Blue|BLUE|Purple|PURPLE|Green|GREEN)|$)/gi,
            /(?:Blue|BLUE)[\s\S]*?:([\s\S]*?)(?=(?:Purple|PURPLE|Green|GREEN|Yellow|YELLOW)|$)/gi,
            /(?:Purple|PURPLE)[\s\S]*?:([\s\S]*?)(?=(?:Green|GREEN|Yellow|YELLOW|Blue|BLUE)|$)/gi
        ];

        for (const pattern of colorPatterns) {
            const matches = [...html.matchAll(pattern)];
            console.log(`颜色模式匹配到 ${matches.length} 个结果`);

            if (matches.length >= 4) {
                for (let i = 0; i < Math.min(4, matches.length); i++) {
                    const wordsText = matches[i][1];
                    const words = extractWordsFromText(wordsText);

                    if (words.length >= 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: words.slice(0, 4),
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }

                if (groups.length === 4) break;
            }
        }

        // 策略2: 查找表情符号模式
        if (groups.length < 4) {
            console.log('尝试表情符号模式...');
            const emojiPattern = /(?:🟢|🟡|🔵|🟣)[\s\S]*?:([\s\S]*?)(?=(?:🟢|🟡|🔵|🟣)|$)/gi;
            const emojiMatches = [...html.matchAll(emojiPattern)];

            console.log(`表情符号模式匹配到 ${emojiMatches.length} 个结果`);

            if (emojiMatches.length >= 4) {
                for (let i = 0; i < Math.min(4, emojiMatches.length); i++) {
                    const wordsText = emojiMatches[i][1];
                    const words = extractWordsFromText(wordsText);

                    if (words.length >= 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: words.slice(0, 4),
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }
            }
        }

        // 策略3: 查找HTML标签模式
        if (groups.length < 4) {
            console.log('尝试HTML标签模式...');
            const strongPattern = /<strong[^>]*>(?:Green|Yellow|Blue|Purple)[^<]*<\/strong>([\s\S]*?)(?=<strong[^>]*>(?:Green|Yellow|Blue|Purple)|$)/gi;
            const strongMatches = [...html.matchAll(strongPattern)];

            console.log(`Strong标签模式匹配到 ${strongMatches.length} 个结果`);

            if (strongMatches.length >= 4) {
                for (let i = 0; i < Math.min(4, strongMatches.length); i++) {
                    const wordsText = strongMatches[i][1];
                    const words = extractWordsFromText(wordsText);

                    if (words.length >= 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: words.slice(0, 4),
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }
            }
        }

        // 策略4: 查找列表项
        if (groups.length < 4) {
            console.log('尝试列表项模式...');
            const listPattern = /<li[^>]*>(.*?)<\/li>/gi;
            const listMatches = [...html.matchAll(listPattern)];

            console.log(`列表项模式匹配到 ${listMatches.length} 个结果`);

            if (listMatches.length >= 16) {
                for (let i = 0; i < 4; i++) {
                    const groupWords = [];
                    for (let j = 0; j < 4; j++) {
                        const itemIndex = i * 4 + j;
                        if (itemIndex < listMatches.length) {
                            const words = extractWordsFromText(listMatches[itemIndex][1]);
                            if (words.length > 0) groupWords.push(words[0]);
                        }
                    }

                    if (groupWords.length === 4) {
                        groups.push({
                            theme: `Group ${groups.length + 1}`,
                            words: groupWords,
                            difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length],
                            hint: `These words share a common theme`
                        });
                    }
                }
            }
        }

        console.log(`解析完成，找到 ${groups.length} 个组`);

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
        console.error('Mashable HTML解析错误:', error);
        return null;
    }
}

// 从文本中提取单词
function extractWordsFromText(text) {
    if (!text) return [];

    console.log('提取单词，文本预览:', text.substring(0, 100));

    // 移除HTML标签
    const cleanText = text.replace(/<[^>]*>/g, ' ');

    // 多种提取策略
    const allWords = [];

    // 策略1: 大写单词
    const uppercaseWords = cleanText.match(/\b[A-Z]{2,}\b/g) || [];
    allWords.push(...uppercaseWords);

    // 策略2: 首字母大写的单词
    const capitalizedWords = cleanText.match(/\b[A-Z][a-z]+\b/g) || [];
    allWords.push(...capitalizedWords);

    // 策略3: 引号中的单词
    const quotedWords = cleanText.match(/"([^"]+)"/g) || [];
    quotedWords.forEach(quoted => {
        const word = quoted.replace(/"/g, '').trim();
        if (word.length >= 2) allWords.push(word);
    });

    // 策略4: 逗号分隔的单词
    const commaWords = cleanText.split(/[,;]/).map(w => w.trim()).filter(w => w.length >= 2 && w.length <= 15);
    allWords.push(...commaWords);

    // 清理和去重
    const cleanWords = allWords
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => /^[A-Z\s\-']+$/.test(word))
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);

    console.log('提取到的单词:', cleanWords.slice(0, 10));
    return cleanWords;
}

// 运行测试
console.log('启动测试脚本...');
testMashableParsing().catch(error => {
    console.error('测试脚本出错:', error);
});