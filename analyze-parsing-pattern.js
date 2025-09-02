// 分析Mashable的解析模式
console.log('🔍 分析Mashable文章的HTML结构模式...');

// 根据你提供的图片，HTML结构应该是：
const expectedPattern = `
<li>First appearance: DEBUT, INTRODUCTION, LAUNCH, PREMIERE</li>
<li>Ones celebrated with holidays: MOTHER, PRESIDENT, SAINT PATRICK, SAINT VALENTINE</li>
<li>Famous poets: BISHOP, BURNS, LORDE, POPE</li>
<li>What "Cardinal" might refer to: BIRD, CLERGY MEMBER, M.L.B. PLAYER, N.F.L. PLAYER</li>
`;

console.log('预期的HTML模式:');
console.log(expectedPattern);

// 正确的解析逻辑应该是：
function parseCorrectPattern(html) {
    console.log('\n🎯 正确的解析逻辑:');
    
    // 1. 查找所有包含答案的列表项
    const listItemPattern = /<li[^>]*>([^:]+):\s*([^<]+)<\/li>/gi;
    
    // 2. 或者查找段落中的模式
    const paragraphPattern = /([^:]+):\s*([A-Z][^.]*)/gi;
    
    // 3. 或者查找黑体字后跟冒号的模式
    const boldPattern = /<(?:strong|b)>([^<]+)<\/(?:strong|b)>:\s*([^<\n]+)/gi;
    
    console.log('模式1: <li>题目: 答案</li>');
    console.log('模式2: 段落中的 题目: 答案');
    console.log('模式3: <strong>题目</strong>: 答案');
    
    return {
        listItemPattern,
        paragraphPattern, 
        boldPattern
    };
}

// 测试解析函数
function testParsingLogic() {
    console.log('\n🧪 测试解析逻辑:');
    
    const testHtml = `
    <li>First appearance: DEBUT, INTRODUCTION, LAUNCH, PREMIERE</li>
    <li>Ones celebrated with holidays: MOTHER, PRESIDENT, SAINT PATRICK, SAINT VALENTINE</li>
    <li>Famous poets: BISHOP, BURNS, LORDE, POPE</li>
    <li>What "Cardinal" might refer to: BIRD, CLERGY MEMBER, M.L.B. PLAYER, N.F.L. PLAYER</li>
    `;
    
    const pattern = /<li[^>]*>([^:]+):\s*([^<]+)<\/li>/gi;
    const matches = [...testHtml.matchAll(pattern)];
    
    console.log(`找到 ${matches.length} 个匹配项:`);
    
    matches.forEach((match, i) => {
        const theme = match[1].trim();
        const wordsText = match[2].trim();
        const words = wordsText.split(',').map(w => w.trim());
        
        console.log(`组 ${i+1}: ${theme}`);
        console.log(`单词: ${words.join(', ')}`);
        console.log('---');
    });
    
    return matches;
}

// 改进的解析函数
function improvedParsingFunction(html) {
    console.log('\n🚀 改进的解析函数:');
    
    const patterns = [
        // 模式1: <li>题目: 答案</li>
        /<li[^>]*>([^:]+):\s*([^<]+)<\/li>/gi,
        
        // 模式2: <strong>题目</strong>: 答案
        /<(?:strong|b)>([^<]+)<\/(?:strong|b)>:\s*([^<\n]+)/gi,
        
        // 模式3: 段落中的题目: 答案
        /^([^:]+):\s*([A-Z][^.\n]*)/gmi
    ];
    
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const matches = [...html.matchAll(pattern)];
        
        console.log(`模式 ${i+1}: 找到 ${matches.length} 个匹配`);
        
        if (matches.length >= 4) {
            console.log('✅ 找到足够的分组，使用此模式');
            
            const groups = matches.slice(0, 4).map((match, idx) => {
                const theme = match[1].trim();
                const wordsText = match[2].trim();
                
                // 智能分割单词，保持复合词完整
                const words = smartSplitWords(wordsText);
                
                return {
                    theme: theme,
                    words: words,
                    difficulty: ['yellow', 'green', 'blue', 'purple'][idx],
                    hint: theme
                };
            });
            
            return groups;
        }
    }
    
    console.log('❌ 所有模式都失败了');
    return null;
}

// 智能分割单词函数
function smartSplitWords(wordsText) {
    console.log(`\n🧠 智能分割: "${wordsText}"`);
    
    // 先按逗号分割
    let parts = wordsText.split(',').map(p => p.trim());
    
    console.log('初始分割:', parts);
    
    // 处理复合词，如 "SAINT PATRICK", "M.L.B. PLAYER"
    const words = [];
    
    for (const part of parts) {
        // 如果包含空格，可能是复合词
        if (part.includes(' ')) {
            // 检查是否是有效的复合词
            if (isValidCompoundWord(part)) {
                words.push(part);
            } else {
                // 如果不是有效复合词，按空格分割
                const subWords = part.split(' ').filter(w => w.length > 0);
                words.push(...subWords);
            }
        } else {
            words.push(part);
        }
    }
    
    console.log('最终单词:', words);
    return words;
}

// 判断是否是有效的复合词
function isValidCompoundWord(word) {
    const compoundPatterns = [
        /^SAINT\s+[A-Z]+$/,           // SAINT PATRICK, SAINT VALENTINE
        /^[A-Z]+\.\s*[A-Z]+\.\s*[A-Z]+$/,  // M.L.B. PLAYER, N.F.L. PLAYER
        /^[A-Z]+\s+[A-Z]+$/           // 其他两个单词的组合
    ];
    
    return compoundPatterns.some(pattern => pattern.test(word));
}

// 运行测试
parseCorrectPattern();
testParsingLogic();

console.log('\n📝 总结:');
console.log('1. 使用多种模式匹配: <li>, <strong>, 段落');
console.log('2. 智能处理复合词: SAINT PATRICK, M.L.B. PLAYER');
console.log('3. 按优先级尝试不同解析方法');
console.log('4. 确保每组正好4个单词/短语');