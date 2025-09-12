// 修复解析逻辑
async function fixParsingLogic() {
    console.log('=== 修复解析逻辑 ===');
    
    try {
        // 获取HTML
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-12-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 修复后的解析逻辑
        const result = parseWithFixedLogic(html, '2025-09-12');
        
        if (result) {
            console.log('\n🎉 修复后解析成功！');
            console.log('分组数量:', result.groups.length);
            
            result.groups.forEach((group, index) => {
                console.log(`${index + 1}. ${group.theme} (${group.difficulty})`);
                console.log(`   单词: ${group.words.join(', ')}`);
            });
        } else {
            console.log('❌ 修复后仍然失败');
        }
        
    } catch (error) {
        console.error('修复测试失败:', error);
    }
}

function parseWithFixedLogic(html, dateStr) {
    try {
        console.log('🔧 使用修复后的解析逻辑...');
        
        // 1. 查找关键短语
        const targetPhrase = "Today's connections fall into the following categories:";
        const phraseIndex = html.indexOf(targetPhrase);
        
        if (phraseIndex === -1) {
            console.log('❌ 未找到关键短语');
            return null;
        }
        
        // 2. 提取颜色提示，但限制长度避免截断
        const afterPhrase = html.substring(phraseIndex + targetPhrase.length);
        const searchContent = afterPhrase.substring(0, 500); // 增加搜索范围
        
        const colorHints = {};
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        
        colors.forEach(color => {
            const patterns = [
                new RegExp(`${color}:\\s*([^\\n<]{1,30})`, 'i') // 限制在30字符内
            ];
            
            for (const pattern of patterns) {
                const match = searchContent.match(pattern);
                if (match) {
                    let hint = match[1].trim();
                    
                    // 更智能的截断逻辑
                    const nextColorIndex = ['Green:', 'Blue:', 'Purple:', 'Looking'].findIndex(marker => 
                        hint.includes(marker)
                    );
                    
                    if (nextColorIndex !== -1) {
                        const marker = ['Green:', 'Blue:', 'Purple:', 'Looking'][nextColorIndex];
                        hint = hint.substring(0, hint.indexOf(marker)).trim();
                    }
                    
                    colorHints[color] = hint;
                    console.log(`   ${color}: "${hint}"`);
                    break;
                }
            }
        });
        
        if (Object.keys(colorHints).length < 4) {
            console.log('❌ 未找到4个分组');
            return null;
        }
        
        // 3. 查找答案区域
        let answerAreaStart = html.indexOf('What is the answer to Connections today');
        if (answerAreaStart === -1) {
            answerAreaStart = html.indexOf('"You should know better!"');
        }
        
        if (answerAreaStart === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        const answerArea = html.substring(answerAreaStart);
        
        // 4. 使用更灵活的边界匹配
        const groups = [];
        const difficulties = ['yellow', 'green', 'blue', 'purple'];
        
        for (let i = 0; i < 4; i++) {
            const color = colors[i];
            const difficulty = difficulties[i];
            const hint = colorHints[color];
            
            console.log(`\n解析 ${color} 组: "${hint}"`);
            
            // 查找这个提示在答案区域中的位置
            const hintIndex = answerArea.indexOf(hint);
            if (hintIndex === -1) {
                console.log(`  ❌ 未找到提示 "${hint}"`);
                continue;
            }
            
            // 查找冒号后的内容
            const afterHint = answerArea.substring(hintIndex + hint.length);
            const colonIndex = afterHint.indexOf(':');
            
            if (colonIndex === -1) {
                console.log(`  ❌ 未找到冒号`);
                continue;
            }
            
            // 提取冒号后到下一个提示之前的内容
            const afterColon = afterHint.substring(colonIndex + 1);
            
            // 查找下一个分组的开始位置
            let nextGroupStart = afterColon.length;
            for (let j = i + 1; j < 4; j++) {
                const nextHint = colorHints[colors[j]];
                const nextIndex = afterColon.indexOf(nextHint);
                if (nextIndex !== -1 && nextIndex < nextGroupStart) {
                    nextGroupStart = nextIndex;
                }
            }
            
            // 如果没找到下一个分组，查找其他结束标记
            if (nextGroupStart === afterColon.length) {
                const endMarkers = ["Don't feel down", "Looking for Wordle", "Ready for the answers"];
                for (const marker of endMarkers) {
                    const markerIndex = afterColon.indexOf(marker);
                    if (markerIndex !== -1 && markerIndex < nextGroupStart) {
                        nextGroupStart = markerIndex;
                    }
                }
            }
            
            const groupContent = afterColon.substring(0, nextGroupStart).trim();
            console.log(`  内容: "${groupContent.substring(0, 50)}..."`);
            
            // 提取单词
            const words = groupContent.split(',').map(w => w.trim()).filter(w => w.length > 0);
            
            if (words.length >= 4) {
                const finalWords = words.slice(0, 4);
                console.log(`  ✅ 成功: ${finalWords.join(', ')}`);
                
                groups.push({
                    theme: hint,
                    words: finalWords,
                    difficulty: difficulty,
                    hint: hint
                });
            } else {
                console.log(`  ❌ 单词不足: ${words.length} 个`);
            }
        }
        
        if (groups.length === 4) {
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable (Fixed Logic)'
            };
        } else {
            console.log(`❌ 只解析出 ${groups.length} 个分组`);
            return null;
        }
        
    } catch (error) {
        console.error('Fixed parsing error:', error);
        return null;
    }
}

// 运行修复测试
fixParsingLogic();