// 第二步：验证本地完美逻辑
console.log('🧪 第二步：验证本地完美逻辑');
console.log('='.repeat(50));

async function verifyLocalLogic() {
    try {
        console.log('正在测试本地完美逻辑...');
        
        const today = new Date();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[today.getMonth()];
        const day = today.getDate();
        const year = today.getFullYear();
        
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
        console.log(`📡 测试URL: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
            console.log(`❌ 无法获取Mashable数据: ${response.status}`);
            return false;
        }
        
        const html = await response.text();
        console.log(`📄 HTML长度: ${html.length} 字符`);
        
        // 使用完美逻辑解析
        const result = parsePerfectLogic(html, today.toISOString().split('T')[0]);
        
        if (result && result.groups && result.groups.length === 4) {
            console.log('✅ 完美逻辑测试成功！');
            console.log(`📊 解析结果:`);
            console.log(`   - 分组数量: ${result.groups.length}`);
            console.log(`   - 单词总数: ${result.words.length}`);
            console.log(`   - 数据源: ${result.source}`);
            
            console.log(`\n📋 解析的分组:`);
            result.groups.forEach((group, i) => {
                const emoji = {
                    'yellow': '🟡',
                    'green': '🟢', 
                    'blue': '🔵',
                    'purple': '🟣'
                }[group.difficulty] || '⚪';
                
                console.log(`   ${emoji} ${group.theme}`);
                console.log(`      ${group.words.join(', ')}`);
            });
            
            return true;
            
        } else {
            console.log('❌ 完美逻辑测试失败');
            console.log('   可能的原因：');
            console.log('   - 网站结构发生变化');
            console.log('   - 网络连接问题');
            console.log('   - 解析逻辑需要调整');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ 测试过程出错: ${error.message}`);
        return false;
    }
}

// 完美逻辑解析函数（与scheduled.js中相同）
function parsePerfectLogic(html, dateStr) {
    try {
        console.log('🎯 开始完美逻辑解析...');
        
        // 3. 查找关键短语
        const targetPhrase = "Today's connections fall into the following categories:";
        const phraseIndex = html.indexOf(targetPhrase);
        
        if (phraseIndex === -1) {
            console.log('❌ 未找到关键短语');
            return null;
        }
        
        console.log('✅ 找到关键短语');
        
        // 4. 提取关键短语之后的内容
        const afterPhrase = html.substring(phraseIndex + targetPhrase.length);
        
        // 5. 在关键短语之后提取4个分组名称
        const searchContent = afterPhrase.substring(0, 1000);
        const colorHints = {};
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        
        colors.forEach(color => {
            const patterns = [
                new RegExp(`${color}:\\s*"([^"]{1,50})"`, 'i'),
                new RegExp(`${color}:\\s*([^\\n<]{1,50})`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = searchContent.match(pattern);
                if (match) {
                    let hint = match[1].trim();
                    if (hint.length > 30) {
                        const cutPoints = ['Green:', 'Blue:', 'Purple:', 'Looking', 'Ready'];
                        for (const cutPoint of cutPoints) {
                            const cutIndex = hint.indexOf(cutPoint);
                            if (cutIndex > 0 && cutIndex < 30) {
                                hint = hint.substring(0, cutIndex).trim();
                                break;
                            }
                        }
                    }
                    colorHints[color] = hint;
                    break;
                }
            }
        });
        
        if (Object.keys(colorHints).length < 4) {
            console.log('❌ 未找到4个分组');
            return null;
        }
        
        console.log('✅ 找到4个分组名称');
        
        // 6. 找到答案区域
        let answerAreaStart = html.indexOf('What is the answer to Connections today');
        if (answerAreaStart === -1) {
            answerAreaStart = html.indexOf('"You should know better!"');
        }
        
        if (answerAreaStart === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        const answerArea = html.substring(answerAreaStart);
        console.log('✅ 找到答案区域');
        
        // 7. 严格按照完美逻辑：在答案区域中查找分组名称之间的内容
        const boundaries = [
            colorHints['Yellow'],
            colorHints['Green'],
            colorHints['Blue'], 
            colorHints['Purple'],
            "Don't feel down"
        ];
        
        const groups = [];
        const difficulties = ['yellow', 'green', 'blue', 'purple'];
        
        for (let i = 0; i < 4; i++) {
            const color = colors[i];
            const difficulty = difficulties[i];
            const hint = colorHints[color];
            const startBoundary = boundaries[i];
            const endBoundary = boundaries[i + 1];
            
            // 在答案区域中查找起始边界
            const startIndex = answerArea.indexOf(startBoundary);
            if (startIndex === -1) continue;
            
            // 在起始边界之后查找结束边界
            const endIndex = answerArea.indexOf(endBoundary, startIndex + startBoundary.length);
            if (endIndex === -1) continue;
            
            // 提取两个边界之间的内容
            const betweenContent = answerArea.substring(startIndex + startBoundary.length, endIndex);
            const commas = (betweenContent.match(/,/g) || []).length;
            
            if (commas >= 3) {
                // 查找冒号后的内容
                const colonIndex = betweenContent.indexOf(':');
                if (colonIndex !== -1) {
                    const afterColon = betweenContent.substring(colonIndex + 1);
                    const afterColonClean = afterColon.trim();
                    const allParts = afterColonClean.split(',').map(part => part.trim());
                    
                    if (allParts.length >= 4) {
                        // 取前4个逗号分隔的部分
                        const words = allParts.slice(0, 4);
                        
                        groups.push({
                            theme: hint,
                            words: words,
                            difficulty: difficulty,
                            hint: hint
                        });
                    }
                }
            }
        }
        
        if (groups.length === 4) {
            console.log('✅ 成功解析4个分组');
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable (Perfect Logic)'
            };
        } else {
            console.log(`❌ 只解析出 ${groups.length} 个分组`);
            return null;
        }
        
    } catch (error) {
        console.log(`❌ 解析过程出错: ${error.message}`);
        return null;
    }
}

// 运行验证
verifyLocalLogic().then(success => {
    console.log('\n' + '='.repeat(50));
    console.log('📋 第二步验证完成');
    
    if (success) {
        console.log('✅ 本地完美逻辑验证通过');
        console.log('🚀 准备进行第三步：触发部署');
        console.log('\n下一步运行: node step3-trigger-deployment.js');
    } else {
        console.log('❌ 本地逻辑验证失败');
        console.log('💡 需要检查和修复逻辑后再部署');
        console.log('🔧 建议检查网站结构是否有变化');
    }
});