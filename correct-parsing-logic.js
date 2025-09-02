// 正确的解析逻辑 - 基于你的描述
console.log('🧪 测试正确的解析逻辑...');

function parseConnectionsCorrectly(text) {
    console.log('使用正确的解析逻辑...');
    
    // 1. 找到"What is the answer to Connections today"开头
    const startPattern = /What is the answer to Connections today/i;
    const startMatch = text.match(startPattern);
    
    if (!startMatch) {
        console.log('❌ 未找到开头标记');
        return null;
    }
    
    // 2. 从开头标记后开始解析
    let remainingText = text.substring(startMatch.index + startMatch[0].length);
    console.log('剩余文本预览:', remainingText.substring(0, 200) + '...');
    
    const groups = [];
    
    // 3. 循环解析4个分组
    for (let i = 0; i < 4; i++) {
        // 查找分类名称（以冒号结尾）
        const categoryMatch = remainingText.match(/([^:]+?):\s*/);
        
        if (!categoryMatch) {
            console.log(`❌ 未找到第${i+1}个分类`);
            break;
        }
        
        const category = categoryMatch[1].trim();
        console.log(`找到分类 ${i+1}: "${category}"`);
        
        // 移动到分类名称后
        remainingText = remainingText.substring(categoryMatch.index + categoryMatch[0].length);
        
        // 提取4个单词（用逗号分隔，最后一个单词后没有逗号）
        const words = [];
        
        // 前3个单词（后面有逗号）
        for (let j = 0; j < 3; j++) {
            const wordMatch = remainingText.match(/^([^,]+?),\s*/);
            if (wordMatch) {
                words.push(wordMatch[1].trim());
                remainingText = remainingText.substring(wordMatch[0].length);
            }
        }
        
        // 第4个单词（后面没有逗号，到下一个分类或结束）
        const lastWordMatch = remainingText.match(/^([^A-Z]*?[A-Z][^A-Z]*?)(?=[A-Z][^:]*:|$)/);
        if (lastWordMatch) {
            words.push(lastWordMatch[1].trim());
            remainingText = remainingText.substring(lastWordMatch[0].length);
        }
        
        console.log(`分组 ${i+1} 单词:`, words);
        
        if (words.length === 4) {
            groups.push({
                category: category,
                words: words
            });
        }
    }
    
    return groups;
}

// 测试数据
const testTexts = [
    // 9月1日格式
    `What is the answer to Connections todayFirst appearance: DEBUT, INTRODUCTION, LAUNCH, PREMIEREOnes celebrated with holidays: MOTHER, PRESIDENT, SAINT PATRICK, SAINT VALENTINEFamous poets: BISHOP, BURNS, LORDE, POPEWhat "Cardinal" might refer to: BIRD, CLERGY MEMBER, M.L.B. PLAYER, N.F.L. PLAYERDon't feel down`,
    
    // 9月2日格式
    `What is the answer to Connections todayCurses: EXPLETIVES, FOUR-LETTER WORDS, PROFANITY, SWEARINGIn "A visit from St. Nicholas": CHRISTMAS, HOUSE, MOUSE, STIRRINGWorn by Earring Magic Ken: EARRING, MESH SHIRT, NECKLACE, PLEATHER VESTStarting with possessive determiners: HERRING, HISTAMINE, MYSTERY, OUROBOROSEnd of content`
];

testTexts.forEach((testText, index) => {
    console.log(`\n--- 测试文本 ${index + 1} ---`);
    
    const result = parseConnectionsCorrectly(testText);
    
    if (result && result.length === 4) {
        console.log('✅ 解析成功！');
        result.forEach((group, i) => {
            const colors = ['YELLOW', 'GREEN', 'BLUE', 'PURPLE'];
            console.log(`${colors[i]}: ${group.words.join(', ')}`);
        });
    } else {
        console.log('❌ 解析失败');
    }
});

console.log('\n🎯 如果两个测试都成功，说明解析逻辑正确！');