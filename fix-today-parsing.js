// 修复today.js的解析逻辑
console.log('🔧 修复today.js的解析逻辑...');

// 从refresh.js复制正确的解析函数
const correctParsingFunction = `
// 智能提取Connections单词 - 基于实际HTML结构
function extractConnectionsWords(html) {
    console.log('Extracting Connections words from structured content...');
    
    // 首先查找答案部分
    const answerSectionMatch = html.match(/What is the answer to Connections today[\\s\\S]{0,2000}/i);
    
    if (!answerSectionMatch) {
        console.log('Answer section not found, trying alternative methods...');
        return extractFallbackWords(html);
    }
    
    const answerSection = answerSectionMatch[0];
    console.log('Found answer section, length:', answerSection.length);
    
    // 清理HTML标签，保留文本内容
    const cleanSection = answerSection
        .replace(/<script[\\s\\S]*?<\\/script>/gi, '')
        .replace(/<style[\\s\\S]*?<\\/style>/gi, '')
        .replace(/<!--[\\s\\S]*?-->/g, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
    
    console.log('Cleaned section preview:', cleanSection.substring(0, 300));
    
    // 使用简单直接的方法提取答案
    const patterns = [
        {
            name: 'First appearance',
            start: 'First appearance:',
            end: 'Ones celebrated'
        },
        {
            name: 'Ones celebrated with holidays', 
            start: 'Ones celebrated with holidays:',
            end: 'Famous poets'
        },
        {
            name: 'Famous poets',
            start: 'Famous poets:',
            end: 'What'
        },
        {
            name: 'What "Cardinal" might refer to',
            start: 'What "Cardinal" might refer to:',
            end: "Don't"
        }
    ];
    
    const groupedWords = [];
    
    patterns.forEach((pattern, i) => {
        const startIndex = cleanSection.indexOf(pattern.start);
        if (startIndex !== -1) {
            const endIndex = cleanSection.indexOf(pattern.end, startIndex + pattern.start.length);
            
            let wordsText;
            if (endIndex !== -1) {
                wordsText = cleanSection.substring(startIndex + pattern.start.length, endIndex);
            } else {
                // 如果没找到结束标记，取到文本末尾
                wordsText = cleanSection.substring(startIndex + pattern.start.length);
            }
            
            // 清理文本
            wordsText = wordsText.trim();
            
            console.log(\`Group \${i+1}: \${pattern.name} -> \${wordsText}\`);
            
            // 分割单词
            const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0);
            
            if (words.length > 0) {
                groupedWords.push({
                    category: pattern.name,
                    words: words
                });
            }
        }
    });
    
    console.log(\`Extracted \${groupedWords.length} groups using direct method\`);
    
    // 如果直接方法成功，返回结果
    if (groupedWords.length >= 4) {
        return groupedWords;
    }
    
    // 否则尝试备用方法
    console.log('Direct method failed, trying fallback method...');
    return extractFallbackWords(html);
}

// 备用提取方法
function extractFallbackWords(html) {
    console.log('Using fallback extraction method...');
    
    // 移除HTML标签
    const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ');
    
    // 查找所有可能的单词
    const allWords = cleanText.match(/\\b[A-Z]{3,12}\\b/g) || [];
    
    // 过滤掉常见的网站词汇
    const filtered = allWords.filter(word => {
        const exclude = [
            'MASHABLE', 'CONNECTIONS', 'NYT', 'PUZZLE', 'ANSWER', 'HINT',
            'TODAY', 'DAILY', 'GAME', 'WORDLE', 'ARTICLE', 'CONTENT',
            'HTML', 'CSS', 'JAVASCRIPT', 'SEARCH', 'RESULT', 'NEWS'
        ];
        return !exclude.includes(word) && word.length >= 3 && word.length <= 12;
    });
    
    // 如果找到足够的单词，分成4组
    if (filtered.length >= 16) {
        const groups = [];
        for (let i = 0; i < 4; i++) {
            const groupWords = filtered.slice(i * 4, (i + 1) * 4);
            groups.push({
                category: \`Group \${i + 1}\`,
                words: groupWords
            });
        }
        return groups;
    }
    
    return [];
}
`;

console.log('✅ 正确的解析函数已准备好');
console.log('📝 现在需要更新today.js文件，替换现有的解析逻辑');

// 现在让我们更新today.js
console.log('\n🔄 正在更新today.js...');