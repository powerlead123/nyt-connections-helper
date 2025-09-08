// 检查转义字符问题
async function checkEscapeIssue() {
    console.log('🔍 检查转义字符问题...');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-8-2025';
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 获取答案文本
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        let answerText = html.substring(startIndex + startMarker.length, endIndex);
        
        console.log('原始答案文本:');
        console.log(`"${answerText}"`);
        
        // 处理转义字符
        answerText = answerText.replace(/\\"/g, '"').trim();
        
        console.log('\n处理转义字符后:');
        console.log(`"${answerText}"`);
        
        const hints = ['Nonsense', 'Increase with "Up"', 'Fictional spies', 'Cat___'];
        
        console.log('\n测试正确的匹配策略:');
        
        for (let i = 0; i < hints.length; i++) {
            const currentHint = hints[i];
            console.log(`\n=== 分组 ${i + 1}: "${currentHint}" ===`);
            
            // 转义正则表达式特殊字符
            function escapeRegex(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
            
            // 正确的策略：匹配到下一个分组名称
            if (i < hints.length - 1) {
                const nextHint = hints[i + 1];
                console.log(`下一个分组: "${nextHint}"`);
                
                const pattern = new RegExp(escapeRegex(currentHint) + ':\\s*(.*?)(?=' + escapeRegex(nextHint) + ':)', 'i');
                console.log(`正则表达式: ${pattern}`);
                
                const match = answerText.match(pattern);
                if (match) {
                    console.log(`✅ 匹配成功: "${match[1]}"`);
                    
                    // 提取单词
                    const words = match[1].split(',')
                        .map(word => word.trim().toUpperCase())
                        .filter(word => word && /^[A-Z]/.test(word))
                        .slice(0, 4);
                    
                    console.log(`单词: [${words.join(', ')}]`);
                } else {
                    console.log('❌ 匹配失败');
                }
            } else {
                // 最后一个分组，匹配到结尾
                const pattern = new RegExp(escapeRegex(currentHint) + ':\\s*(.*?)$', 'i');
                console.log(`正则表达式: ${pattern}`);
                
                const match = answerText.match(pattern);
                if (match) {
                    console.log(`✅ 匹配成功: "${match[1]}"`);
                    
                    // 提取单词
                    const words = match[1].split(',')
                        .map(word => word.trim().toUpperCase())
                        .filter(word => word && /^[A-Z]/.test(word))
                        .slice(0, 4);
                    
                    console.log(`单词: [${words.join(', ')}]`);
                } else {
                    console.log('❌ 匹配失败');
                }
            }
        }
        
        console.log('\n🔍 检查today.js中的escapeRegex函数问题:');
        
        // 检查today.js中的escapeRegex函数
        function todayJsEscapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\ec7d90b9-f7a1-45f9-92e8-0cb6a90e24da');
        }
        
        const testString = 'Increase with "Up"';
        console.log(`原始字符串: "${testString}"`);
        console.log(`正确转义: "${escapeRegex(testString)}"`);
        console.log(`today.js转义: "${todayJsEscapeRegex(testString)}"`);
        
        if (escapeRegex(testString) !== todayJsEscapeRegex(testString)) {
            console.log('❌ 发现问题！today.js中的escapeRegex函数有错误！');
        } else {
            console.log('✅ escapeRegex函数正常');
        }
        
    } catch (error) {
        console.error('检查失败:', error);
    }
}

checkEscapeIssue();