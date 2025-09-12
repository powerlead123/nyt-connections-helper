import fetch from 'node-fetch';

async function fixSept6ThemeExtraction() {
    console.log('🔧 修复9月6日主题提取问题...\n');
    
    const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-6-2025';
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        
        const targetPhrase = "Today's connections fall into the following categories:";
        const phraseIndex = html.indexOf(targetPhrase);
        const afterPhrase = html.substring(phraseIndex + targetPhrase.length);
        const searchContent = afterPhrase.substring(0, 1000);
        
        console.log('📝 搜索区域内容:');
        console.log(searchContent);
        
        const colorHints = {};
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        
        // 改进的主题提取逻辑
        colors.forEach(color => {
            console.log(`\n🎯 提取 ${color} 主题...`);
            
            // 更精确的模式匹配
            const patterns = [
                // 带引号的完整匹配
                new RegExp(`${color}:\\s*"([^"]+)"`, 'i'),
                // 不带引号，到下一个颜色或关键词为止
                new RegExp(`${color}:\\s*([^\\n]+?)(?=(?:Yellow|Green|Blue|Purple|Looking|Ready|Drumroll):)`, 'i'),
                // 不带引号，到换行为止
                new RegExp(`${color}:\\s*([^\\n<]+)`, 'i')
            ];
            
            for (let i = 0; i < patterns.length; i++) {
                const pattern = patterns[i];
                console.log(`  尝试模式 ${i + 1}: ${pattern}`);
                
                const match = searchContent.match(pattern);
                if (match) {
                    let hint = match[1].trim();
                    console.log(`  原始匹配: "${hint}"`);
                    
                    // 清理逻辑：移除常见的截断点
                    const cutPoints = [
                        'Looking for', 'Ready for', 'Drumroll',
                        'Yellow:', 'Green:', 'Blue:', 'Purple:',
                        'Here\'s the answer', 'This is your last'
                    ];
                    
                    for (const cutPoint of cutPoints) {
                        const cutIndex = hint.indexOf(cutPoint);
                        if (cutIndex > 0) {
                            hint = hint.substring(0, cutIndex).trim();
                            console.log(`  截断在 "${cutPoint}": "${hint}"`);
                            break;
                        }
                    }
                    
                    // 长度限制
                    if (hint.length > 50) {
                        hint = hint.substring(0, 50).trim();
                        console.log(`  长度截断: "${hint}"`);
                    }
                    
                    colorHints[color] = hint;
                    console.log(`  ✅ 最终结果: "${hint}"`);
                    break;
                } else {
                    console.log(`  ❌ 模式 ${i + 1} 无匹配`);
                }
            }
            
            if (!colorHints[color]) {
                console.log(`  ❌ ${color} 主题提取失败`);
            }
        });
        
        console.log('\n🎯 提取的所有主题:');
        Object.entries(colorHints).forEach(([color, hint]) => {
            console.log(`${color}: "${hint}"`);
        });
        
        // 测试修复后的边界匹配
        if (Object.keys(colorHints).length === 4) {
            console.log('\n🔍 测试修复后的边界匹配...');
            
            let answerAreaStart = html.indexOf('What is the answer to Connections today');
            let answerArea = html.substring(answerAreaStart);
            answerArea = answerArea.replace(/\\"/g, '"');
            
            Object.keys(colorHints).forEach(color => {
                colorHints[color] = colorHints[color].replace(/\\"/g, '"');
            });
            
            console.log('\n📝 答案区域开头:');
            console.log(answerArea.substring(0, 300));
            
            const boundaries = [
                colorHints['Yellow'],
                colorHints['Green'],
                colorHints['Blue'], 
                colorHints['Purple'],
                "Don't feel down"
            ];
            
            console.log('\n🔍 边界匹配测试:');
            boundaries.forEach((boundary, index) => {
                const pos = answerArea.indexOf(boundary);
                console.log(`${index}. "${boundary}" -> 位置: ${pos}`);
            });
            
            // 快速测试解析
            console.log('\n🎯 快速解析测试:');
            const difficulties = ['yellow', 'green', 'blue', 'purple'];
            let successCount = 0;
            
            for (let i = 0; i < 4; i++) {
                const color = colors[i];
                const hint = colorHints[color];
                const startBoundary = boundaries[i];
                const endBoundary = boundaries[i + 1];
                
                const startIndex = answerArea.indexOf(startBoundary);
                const endIndex = answerArea.indexOf(endBoundary, startIndex + startBoundary.length);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    const betweenContent = answerArea.substring(startIndex + startBoundary.length, endIndex);
                    const colonIndex = betweenContent.indexOf(':');
                    
                    if (colonIndex !== -1) {
                        const afterColon = betweenContent.substring(colonIndex + 1).trim();
                        const words = afterColon.split(',').map(w => w.trim()).filter(w => w);
                        
                        if (words.length === 4) {
                            console.log(`✅ ${color}: ${words.join(', ')}`);
                            successCount++;
                        } else {
                            console.log(`❌ ${color}: 单词数量 ${words.length}`);
                        }
                    } else {
                        console.log(`❌ ${color}: 无冒号`);
                    }
                } else {
                    console.log(`❌ ${color}: 边界问题 (${startIndex}, ${endIndex})`);
                }
            }
            
            console.log(`\n🎉 修复后成功率: ${successCount}/4`);
            
            if (successCount === 4) {
                console.log('✅ 9月6日修复成功！');
            } else {
                console.log('❌ 仍需进一步调试');
            }
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    }
}

fixSept6ThemeExtraction();