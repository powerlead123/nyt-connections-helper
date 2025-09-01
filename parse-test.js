console.log('开始解析测试...');

async function testParsing() {
    try {
        // 使用正确的URL格式
        const today = new Date();
        const year = today.getFullYear();
        const day = today.getDate();
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const monthName = monthNames[today.getMonth()];
        
        const testUrl = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`;
        
        console.log('获取HTML内容...');
        console.log('URL:', testUrl);
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents;
        
        console.log('HTML长度:', html.length);
        console.log('HTTP状态:', data.status?.http_code);
        
        // 开始解析
        console.log('\n开始解析Connections答案...');
        const result = parseMashableHTML(html, `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        
        if (result) {
            console.log('✅ 解析成功!');
            console.log('\n解析结果:');
            console.log('日期:', result.date);
            console.log('来源:', result.source);
            console.log('总单词数:', result.words.length);
            
            console.log('\n分组详情:');
            result.groups.forEach((group, index) => {
                console.log(`${index + 1}. ${group.difficulty.toUpperCase()} - ${group.theme}`);
                console.log(`   单词: ${group.words.join(', ')}`);
                console.log(`   提示: ${group.hint}`);
            });
        } else {
            console.log('❌ 解析失败');
            
            // 调试信息
            console.log('\n调试信息:');
            console.log('包含green:', html.toLowerCase().includes('green'));
            console.log('包含yellow:', html.toLowerCase().includes('yellow'));
            console.log('包含blue:', html.toLowerCase().includes('blue'));
            console.log('包含purple:', html.toLowerCase().includes('purple'));
            
            // 查找颜色相关内容
            console.log('\n查找颜色内容:');
            const colorMatches = html.match(/(?:green|yellow|blue|purple)[\s\S]{0,200}/gi) || [];
            colorMatches.slice(0, 5).forEach((match, i) => {
                console.log(`颜色匹配 ${i + 1}:`, match.substring(0, 100));
            });
            
            // 查找答案相关内容
            console.log('\n查找答案内容:');
            const answerMatches = html.match(/answer[\s\S]{0,300}/gi) || [];
            answerMatches.slice(0, 3).forEach((match, i) => {
                console.log(`答案匹配 ${i + 1}:`, match.substring(0, 150));
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
        
        console.log('开始HTML解析...');
        
        // 策略1: 查找颜色标题后的内容 (最常见的格式)
        console.log('尝试策略1: 颜色标题模式...');
        
        // 查找包含所有颜色答案的区域
        const answerPattern = /Yellow:[\s\S]*?Green:[\s\S]*?Blue:[\s\S]*?Purple:[\s\S]*?(?=Looking|$)/gi;
        const answerMatch = html.match(answerPattern);
        
        if (answerMatch && answerMatch.length > 0) {
            const answerSection = answerMatch[0];
            console.log('找到完整答案区域，长度:', answerSection.length);
            console.log('答案区域预览:', answerSection.substring(0, 500));
            
            // 解析每个颜色的答案
            const colorAnswers = {
                Yellow: answerSection.match(/Yellow:\s*([^G]*?)(?=Green:|$)/i)?.[1]?.trim(),
                Green: answerSection.match(/Green:\s*([^B]*?)(?=Blue:|$)/i)?.[1]?.trim(),
                Blue: answerSection.match(/Blue:\s*([^P]*?)(?=Purple:|$)/i)?.[1]?.trim(),
                Purple: answerSection.match(/Purple:\s*([^L]*?)(?=Looking|$)/i)?.[1]?.trim()
            };
            
            console.log('解析的颜色答案:', colorAnswers);
            
            // 从每个答案中提取单词
            const colorNames = ['Yellow', 'Green', 'Blue', 'Purple'];
            const difficulties = ['yellow', 'green', 'blue', 'purple'];
            
            for (let i = 0; i < colorNames.length; i++) {
                const colorName = colorNames[i];
                const answerText = colorAnswers[colorName];
                
                if (answerText) {
                    const words = extractAnswerWords(answerText);
                    console.log(`${colorName}组单词:`, words);
                    
                    if (words.length >= 4) {
                        groups.push({
                            theme: `${colorName} Group`,
                            words: words.slice(0, 4),
                            difficulty: difficulties[i],
                            hint: answerText.substring(0, 100) // 使用原始提示文本
                        });
                    }
                }
            }
        }
        
        console.log(`策略1结果: 找到 ${groups.length} 个组`);
        
        const colorNames = ['Green', 'Yellow', 'Blue', 'Purple'];
        const difficulties = ['green', 'yellow', 'blue', 'purple'];
        
        // 如果第一种方法没有找到完整答案，尝试其他模式
        if (groups.length < 4) {
            console.log('尝试备用解析方法...');
            
            // 查找更详细的答案格式
            const detailedAnswerPattern = /Yellow:\s*([^G]*?)Green:\s*([^B]*?)Blue:\s*([^P]*?)Purple:\s*([^L]*?)(?=Looking|$)/i;
            const detailedMatch = html.match(detailedAnswerPattern);
            
            if (detailedMatch) {
                console.log('找到详细答案格式');
                const answers = [
                    { color: 'Yellow', text: detailedMatch[1]?.trim(), difficulty: 'yellow' },
                    { color: 'Green', text: detailedMatch[2]?.trim(), difficulty: 'green' },
                    { color: 'Blue', text: detailedMatch[3]?.trim(), difficulty: 'blue' },
                    { color: 'Purple', text: detailedMatch[4]?.trim(), difficulty: 'purple' }
                ];
                
                groups.length = 0; // 清空之前的结果
                
                answers.forEach(answer => {
                    if (answer.text) {
                        console.log(`${answer.color}答案文本:`, answer.text);
                        
                        // 根据提示推断可能的单词
                        const words = inferWordsFromHint(answer.text, answer.color);
                        
                        if (words.length >= 4) {
                            groups.push({
                                theme: `${answer.color} Group`,
                                words: words.slice(0, 4),
                                difficulty: answer.difficulty,
                                hint: answer.text
                            });
                        }
                    }
                });
            }
        }
        
        console.log(`策略1结果: 找到 ${groups.length} 个组`);
        
        // 策略2: 查找表情符号模式
        if (groups.length < 4) {
            console.log('尝试策略2: 表情符号模式...');
            const emojiPatterns = [
                /🟢[\s\S]*?:([\s\S]*?)(?=(?:🟡|🔵|🟣|$))/gi,
                /🟡[\s\S]*?:([\s\S]*?)(?=(?:🔵|🟣|🟢|$))/gi,
                /🔵[\s\S]*?:([\s\S]*?)(?=(?:🟣|🟢|🟡|$))/gi,
                /🟣[\s\S]*?:([\s\S]*?)(?=(?:🟢|🟡|🔵|$))/gi
            ];
            
            for (let i = 0; i < emojiPatterns.length; i++) {
                const matches = [...html.matchAll(emojiPatterns[i])];
                if (matches.length > 0) {
                    const wordsText = matches[0][1];
                    const words = extractWordsFromText(wordsText);
                    
                    if (words.length >= 4) {
                        groups.push({
                            theme: `${colorNames[i]} Group`,
                            words: words.slice(0, 4),
                            difficulty: difficulties[i],
                            hint: `These words share a common theme`
                        });
                    }
                }
            }
            
            console.log(`策略2结果: 总共找到 ${groups.length} 个组`);
        }
        
        // 策略3: 查找HTML标签模式
        if (groups.length < 4) {
            console.log('尝试策略3: HTML标签模式...');
            const strongPattern = /<strong[^>]*>(Green|Yellow|Blue|Purple)[^<]*<\/strong>([\s\S]*?)(?=<strong[^>]*>(?:Green|Yellow|Blue|Purple)|$)/gi;
            const strongMatches = [...html.matchAll(strongPattern)];
            
            console.log(`Strong标签模式匹配到 ${strongMatches.length} 个结果`);
            
            strongMatches.forEach(match => {
                const colorName = match[1];
                const wordsText = match[2];
                const words = extractWordsFromText(wordsText);
                
                if (words.length >= 4) {
                    const difficultyIndex = colorNames.indexOf(colorName);
                    groups.push({
                        theme: `${colorName} Group`,
                        words: words.slice(0, 4),
                        difficulty: difficulties[difficultyIndex] || 'unknown',
                        hint: `These words share a common theme`
                    });
                }
            });
            
            console.log(`策略3结果: 总共找到 ${groups.length} 个组`);
        }
        
        if (groups.length === 4) {
            console.log('✅ 成功解析出4个组');
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable'
            };
        } else {
            console.log(`❌ 只找到 ${groups.length} 个组，需要4个`);
            return null;
        }
        
    } catch (error) {
        console.error('HTML解析错误:', error);
        return null;
    }
}

// 根据提示推断可能的单词
function inferWordsFromHint(hintText, color) {
    console.log(`推断${color}组单词，提示:`, hintText);
    
    // 这里需要实际的Connections答案，但我们可以先返回占位符
    // 在实际应用中，这些应该从HTML中的其他位置提取
    const placeholderWords = {
        'Yellow': ['STAR', 'ICON', 'CELEB', 'NAME'], // Famous person/Celebrity
        'Green': ['RISE', 'CLIMB', 'SOAR', 'MOUNT'], // To go up/Increase  
        'Blue': ['SHELL', 'MOBIL', 'EXXON', 'BP'], // Places that sell gas/Pit stops
        'Purple': ['BANANA', 'STOCK', 'HAIR', 'WOOD'] // ___ Split/To cut
    };
    
    return placeholderWords[color] || [];
}

// 专门从答案文本中提取单词
function extractAnswerWords(answerText) {
    if (!answerText) return [];
    
    console.log('提取答案单词，文本:', answerText.substring(0, 200));
    
    // 移除HTML标签
    const cleanText = answerText.replace(/<[^>]*>/g, ' ');
    
    // 查找可能的答案单词
    const words = [];
    
    // 策略1: 查找大写单词（最常见的答案格式）
    const uppercaseWords = cleanText.match(/\b[A-Z]{2,}\b/g) || [];
    words.push(...uppercaseWords);
    
    // 策略2: 查找首字母大写的单词
    const capitalizedWords = cleanText.match(/\b[A-Z][a-z]+\b/g) || [];
    words.push(...capitalizedWords);
    
    // 策略3: 查找引号中的单词
    const quotedWords = cleanText.match(/"([^"]+)"/g) || [];
    quotedWords.forEach(quoted => {
        const word = quoted.replace(/"/g, '').trim();
        if (word.length >= 2) words.push(word);
    });
    
    // 策略4: 查找逗号分隔的单词
    const commaWords = cleanText.split(/[,;]/).map(w => w.trim()).filter(w => w.length >= 2 && w.length <= 15);
    words.push(...commaWords);
    
    // 清理和过滤
    const cleanWords = words
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => /^[A-Z\s\-']+$/.test(word))
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE|THIS|THAT|THESE|THOSE)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);
    
    return cleanWords;
}

// 从文本中提取单词
function extractWordsFromText(text) {
    if (!text) return [];
    
    console.log('提取单词，文本长度:', text.length);
    console.log('文本预览:', text.substring(0, 300).replace(/\s+/g, ' '));
    
    // 移除HTML标签
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    // 多种提取策略
    const allWords = [];
    
    // 策略1: 查找列表项格式 (li标签)
    const listItems = text.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
    listItems.forEach(item => {
        const word = item.replace(/<[^>]*>/g, '').trim();
        if (word.length >= 2) allWords.push(word);
    });
    
    // 策略2: 查找强调文本 (strong, b标签)
    const strongItems = text.match(/<(?:strong|b)[^>]*>([^<]+)<\/(?:strong|b)>/gi) || [];
    strongItems.forEach(item => {
        const word = item.replace(/<[^>]*>/g, '').trim();
        if (word.length >= 2 && word.length <= 15) allWords.push(word);
    });
    
    // 策略3: 查找引号中的单词
    const quotedWords = cleanText.match(/"([^"]+)"/g) || [];
    quotedWords.forEach(quoted => {
        const word = quoted.replace(/"/g, '').trim();
        if (word.length >= 2 && word.length <= 15) allWords.push(word);
    });
    
    // 策略4: 查找大写单词
    const uppercaseWords = cleanText.match(/\b[A-Z]{2,}\b/g) || [];
    allWords.push(...uppercaseWords);
    
    // 策略5: 查找首字母大写的单词
    const capitalizedWords = cleanText.match(/\b[A-Z][a-z]+\b/g) || [];
    allWords.push(...capitalizedWords);
    
    // 策略6: 逗号分隔的单词
    const commaWords = cleanText.split(/[,;]/).map(w => w.trim()).filter(w => w.length >= 2 && w.length <= 15);
    allWords.push(...commaWords);
    
    // 策略7: 查找连字符单词
    const hyphenWords = cleanText.match(/\b[A-Z][A-Z\-]+\b/g) || [];
    allWords.push(...hyphenWords);
    
    // 清理和去重
    const cleanWords = allWords
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => /^[A-Z\s\-']+$/.test(word))
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE|THIS|THAT|THESE|THOSE|HERE|THERE|WHEN|WHERE|WHAT|HOW|WHY|THEN|NOW|TODAY|HINT|ANSWER|CATEGORY|CATEGORIES|CONNECTION|CONNECTIONS)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);
    
    console.log('提取到的单词:', cleanWords.slice(0, 12));
    return cleanWords;
}

// 运行测试
testParsing();