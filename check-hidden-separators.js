// 检查HTML中的隐藏分隔符
async function checkHiddenSeparators() {
    console.log('=== 检查隐藏分隔符 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 找到答案区域
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            console.log('❌ 未找到答案区域');
            return;
        }
        
        const answerSection = html.substring(startIndex, endIndex);
        console.log('答案区域长度:', answerSection.length);
        
        // 查找关键边界位置
        const swearingIndex = answerSection.indexOf('SWEARING');
        const inIndex = answerSection.indexOf('In "A visit');
        
        if (swearingIndex !== -1 && inIndex !== -1) {
            console.log('\\n=== SWEARING 和 In 之间的字符分析 ===');
            
            const betweenText = answerSection.substring(swearingIndex + 8, inIndex); // 8 = "SWEARING".length
            console.log(`SWEARING后到In前的文本长度: ${betweenText.length}`);
            console.log(`原始文本: "${betweenText}"`);
            
            // 逐字符分析
            console.log('\\n字符编码分析:');
            for (let i = 0; i < betweenText.length; i++) {
                const char = betweenText[i];
                const code = char.charCodeAt(0);
                console.log(`位置 ${i}: "${char}" (编码: ${code}) ${getCharDescription(code)}`);
            }
        }
        
        // 查找其他边界
        const stirringIndex = answerSection.indexOf('STIRRING');
        const wornIndex = answerSection.indexOf('Worn by');
        
        if (stirringIndex !== -1 && wornIndex !== -1) {
            console.log('\\n=== STIRRING 和 Worn 之间的字符分析 ===');
            
            const betweenText = answerSection.substring(stirringIndex + 8, wornIndex);
            console.log(`STIRRING后到Worn前的文本长度: ${betweenText.length}`);
            console.log(`原始文本: "${betweenText}"`);
            
            for (let i = 0; i < betweenText.length; i++) {
                const char = betweenText[i];
                const code = char.charCodeAt(0);
                console.log(`位置 ${i}: "${char}" (编码: ${code}) ${getCharDescription(code)}`);
            }
        }
        
        // 查找第三个边界
        const vestIndex = answerSection.indexOf('VEST');
        const startingIndex = answerSection.indexOf('Starting with');
        
        if (vestIndex !== -1 && startingIndex !== -1) {
            console.log('\\n=== VEST 和 Starting 之间的字符分析 ===');
            
            const betweenText = answerSection.substring(vestIndex + 4, startingIndex);
            console.log(`VEST后到Starting前的文本长度: ${betweenText.length}`);
            console.log(`原始文本: "${betweenText}"`);
            
            for (let i = 0; i < betweenText.length; i++) {
                const char = betweenText[i];
                const code = char.charCodeAt(0);
                console.log(`位置 ${i}: "${char}" (编码: ${code}) ${getCharDescription(code)}`);
            }
        }
        
        // 查找常见的分隔符
        console.log('\\n=== 查找常见分隔符 ===');
        
        const separators = [
            { name: '换行符 \\n', char: '\\n', code: 10 },
            { name: '回车符 \\r', char: '\\r', code: 13 },
            { name: '制表符 \\t', char: '\\t', code: 9 },
            { name: '不间断空格', char: ' ', code: 160 },
            { name: '零宽空格', char: '​', code: 8203 },
            { name: '零宽不连字符', char: '‌', code: 8204 }
        ];
        
        for (const sep of separators) {
            const count = (answerSection.match(new RegExp(String.fromCharCode(sep.code), 'g')) || []).length;
            if (count > 0) {
                console.log(`✅ 找到 ${count} 个 ${sep.name} (编码: ${sep.code})`);
            } else {
                console.log(`❌ 未找到 ${sep.name}`);
            }
        }
        
    } catch (error) {
        console.error('检查出错:', error);
    }
}

function getCharDescription(code) {
    if (code === 10) return '(换行符 \\n)';
    if (code === 13) return '(回车符 \\r)';
    if (code === 9) return '(制表符 \\t)';
    if (code === 32) return '(普通空格)';
    if (code === 160) return '(不间断空格)';
    if (code >= 8192 && code <= 8207) return '(各种空格字符)';
    if (code >= 65 && code <= 90) return '(大写字母)';
    if (code >= 97 && code <= 122) return '(小写字母)';
    if (code >= 48 && code <= 57) return '(数字)';
    return '(其他字符)';
}

checkHiddenSeparators();