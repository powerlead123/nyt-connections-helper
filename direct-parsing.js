// 最直接的解析方法
console.log('🧪 最直接的解析方法...');

function parseConnectionsDirect(text) {
    console.log('使用最直接的解析方法...');
    
    // 1. 找到开头并截取答案部分
    const startMarker = 'What is the answer to Connections today';
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) {
        console.log('❌ 未找到开头标记');
        return null;
    }
    
    let answerText = text.substring(startIndex + startMarker.length);
    console.log('答案文本:', answerText.substring(0, 200) + '...');
    
    // 2. 直接查找冒号位置
    const groups = [];
    let currentPos = 0;
    
    for (let groupIndex = 0; groupIndex < 4; groupIndex++) {
        // 查找下一个冒号
        const colonIndex = answerText.indexOf(':', currentPos);
        if (colonIndex === -1) {
            console.log(`❌ 未找到第${groupIndex + 1}个冒号`);
            break;
        }
        
        // 向前查找分类名称的开始
        let categoryStart = colonIndex - 1;
        while (categoryStart > currentPos && answerText[categoryStart] !== answerText[categoryStart].toUpperCase()) {
            categoryStart--;
        }
        
        // 找到第一个大写字母
        while (categoryStart > currentPos && !/[A-Z]/.test(answerText[categoryStart])) {
            categoryStart++;
        }
        
        const category = answerText.substring(categoryStart, colonIndex).trim();
        console.log(`分类 ${groupIndex + 1}: "${category}"`);
        
        // 查找单词部分的结束位置（下一个大写字母开始的分类或文本结束）
        let wordsStart = colonIndex + 1;
        let wordsEnd = answerText.length;
        
        // 查找下一个分类的开始（大写字母后跟冒号的模式）
        for (let i = wordsStart + 10; i < answerText.length - 1; i++) {
            if (/[A-Z]/.test(answerText[i]) && answerText.indexOf(':', i) !== -1 && answerText.indexOf(':', i) < i + 50) {
                wordsEnd = i;
                break;
            }
        }
        
        let wordsText = answerText.substring(wordsStart, wordsEnd).trim();
        
        // 清理可能的干扰文本
        wordsText = wordsText.replace(/Don't.*$/i, '').trim();
        
        console.log(`单词文本: "${wordsText}"`);
        
        // 分割单词
        const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0 && w.length < 50);
        
        console.log(`提取的单词 (${words.length}个):`, words);
        
        if (words.length >= 4) {
            groups.push({
                category: category,
                words: words.slice(0, 4)
            });
        }
        
        // 移动到下一个位置
        currentPos = wordsEnd;
    }
    
    return groups;
}

// 测试
const testText1 = `What is the answer to Connections todayFirst appearance: DEBUT, INTRODUCTION, LAUNCH, PREMIEREOnes celebrated with holidays: MOTHER, PRESIDENT, SAINT PATRICK, SAINT VALENTINEFamous poets: BISHOP, BURNS, LORDE, POPEWhat "Cardinal" might refer to: BIRD, CLERGY MEMBER, M.L.B. PLAYER, N.F.L. PLAYERDon't feel down`;

console.log('--- 测试9月1日数据 ---');
const result1 = parseConnectionsDirect(testText1);

if (result1 && result1.length === 4) {
    console.log('\n✅ 解析成功！');
    result1.forEach((group, i) => {
        const colors = ['YELLOW', 'GREEN', 'BLUE', 'PURPLE'];
        console.log(`${colors[i]}: ${group.words.join(', ')}`);
    });
    
    // 验证结果
    const expected = [
        ['DEBUT', 'INTRODUCTION', 'LAUNCH', 'PREMIERE'],
        ['MOTHER', 'PRESIDENT', 'SAINT PATRICK', 'SAINT VALENTINE'],
        ['BISHOP', 'BURNS', 'LORDE', 'POPE'],
        ['BIRD', 'CLERGY MEMBER', 'M.L.B. PLAYER', 'N.F.L. PLAYER']
    ];
    
    let correctGroups = 0;
    result1.forEach((group, i) => {
        const matches = JSON.stringify(group.words.sort()) === JSON.stringify(expected[i].sort());
        if (matches) correctGroups++;
    });
    
    console.log(`\n🏆 匹配度: ${correctGroups}/4`);
    
    if (correctGroups === 4) {
        console.log('🎉 完全正确！');
    }
    
} else {
    console.log('❌ 解析失败');
}