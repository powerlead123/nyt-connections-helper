// 抓取最近5天的谜题数据并存储到KV
console.log('📅 抓取最近5天的谜题数据...');

// 复制scheduled.js中的解析函数
function parseMashableHTML(html, dateStr) {
    try {
        console.log('🎯 开始解析...');
        
        const startPhrase = "Today's connections fall into the following categories:";
        const startPos = html.indexOf(startPhrase);
        
        if (startPos === -1) {
            console.log('❌ 未找到开始边界');
            return null;
        }
        
        const endPhrase = "Looking for Wordle today?";
        const endPos = html.indexOf(endPhrase, startPos);
        
        if (endPos === -1) {
            console.log('❌ 未找到结束边界');
            return null;
        }
        
        const hintSection = html.substring(startPos + startPhrase.length, endPos);
        const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
        const colorPositions = [];
        
        let currentPos = 0;
        for (const color of colors) {
            const colorPos = hintSection.indexOf(color + ':', currentPos);
            if (colorPos === -1) {
                console.log(`❌ 未找到 ${color} 位置`);
                return null;
            }
            colorPositions.push({ color, pos: colorPos });
            currentPos = colorPos + 1;
        }
        
        const colorHints = {};
        
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            const startPos = colorPositions[i].pos + color.length + 1;
            const endPos = i < colors.length - 1 ? colorPositions[i + 1].pos : hintSection.length;
            
            let themeContent = hintSection.substring(startPos, endPos);
            
            themeContent = themeContent
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/^\s*[:\-\s]*/, '')
                .replace(/\s*$/, '')
                .trim();
            
            if (themeContent.length > 0 && themeContent.length < 100) {
                colorHints[color] = themeContent;
            } else {
                console.log(`❌ ${color} 主题提取失败`);
                return null;
            }
        }
        
        if (Object.keys(colorHints).length < 4) {
            console.log('❌ 未找到4个完整分组');
            return null;
        }
        
        // 找到答案区域
        let answerAreaStart = html.indexOf('What is the answer to Connections today');
        if (answerAreaStart === -1) {
            answerAreaStart = html.indexOf('"You should know better!"');
        }
        
        if (answerAreaStart === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerArea = html.substring(answerAreaStart);
        answerArea = answerArea.replace(/\\"/g, '"');
        
        Object.keys(colorHints).forEach(color => {
            colorHints[color] = colorHints[color].replace(/\\"/g, '"');
        });
        
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
            
            const startIndex = answerArea.indexOf(startBoundary);
            if (startIndex === -1) continue;
            
            const endIndex = answerArea.indexOf(endBoundary, startIndex + startBoundary.length);
            if (endIndex === -1) continue;
            
            const betweenContent = answerArea.substring(startIndex + startBoundary.length, endIndex);
            const commas = (betweenContent.match(/,/g) || []).length;
            
            if (commas >= 3) {
                const colonIndex = betweenContent.indexOf(':');
                if (colonIndex !== -1) {
                    const afterColon = betweenContent.substring(colonIndex + 1);
                    const afterColonClean = afterColon.trim();
                    const allParts = afterColonClean.split(',').map(part => part.trim());
                    
                    if (allParts.length >= 4) {
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
            console.log('🎉 解析成功!');
            return {
                date: dateStr,
                timestamp: new Date().toISOString(),
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable (Manual Historical Fetch)'
            };
        }
        
        console.log(`❌ 只解析出 ${groups.length} 个分组`);
        return null;
        
    } catch (error) {
        console.error('解析错误:', error);
        return null;
    }
}

async function populateRecent5Days() {
    try {
        const dates = [];
        for (let i = 1; i <= 5; i++) { // 最近5天（不包括今天）
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push({
                dateStr: date.toISOString().split('T')[0],
                date: date
            });
        }
        
        console.log('目标日期:', dates.map(d => d.dateStr));
        
        let successCount = 0;
        
        for (const {dateStr, date} of dates) {
            try {
                console.log(`\n📅 处理 ${dateStr}...`);
                
                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                                   'july', 'august', 'september', 'october', 'november', 'december'];
                const monthName = monthNames[date.getMonth()];
                const day = date.getDate();
                const year = date.getFullYear();
                
                const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
                console.log('URL:', url);
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!response.ok) {
                    console.log(`❌ ${dateStr}: HTTP ${response.status}`);
                    continue;
                }
                
                const html = await response.text();
                const puzzleData = parseMashableHTML(html, dateStr);
                
                if (puzzleData) {
                    console.log(`✅ ${dateStr}: 解析成功，尝试存储到KV...`);
                    
                    // 通过API存储到KV
                    const storeResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'store-historical-data',
                            secret: 'your-secret-key-here',
                            date: dateStr,
                            data: puzzleData
                        })
                    });
                    
                    // 注意：我们的API可能不支持这个action，但先试试
                    if (storeResponse.ok) {
                        const storeData = await storeResponse.json();
                        console.log(`🎉 ${dateStr}: 存储成功!`);
                        successCount++;
                    } else {
                        console.log(`❌ ${dateStr}: 存储失败，但数据已解析`);
                        console.log('解析的数据:', JSON.stringify(puzzleData, null, 2));
                    }
                } else {
                    console.log(`❌ ${dateStr}: 解析失败`);
                }
                
            } catch (error) {
                console.log(`❌ ${dateStr}: 处理失败 -`, error.message);
            }
        }
        
        console.log(`\n📊 总结:`);
        console.log(`- 尝试处理: ${dates.length} 个日期`);
        console.log(`- 成功存储: ${successCount} 个`);
        
        if (successCount > 0) {
            console.log('\n🔍 检查结果...');
            const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
            const todayData = await todayResponse.json();
            
            if (todayData.success) {
                console.log('🎉 成功！现在有可用数据了:');
                console.log('- 日期:', todayData.actualDate);
                console.log('- 数据源:', todayData.source);
                console.log('- 新鲜度:', todayData.freshness);
            } else {
                console.log('❌ 仍然没有可用数据:', todayData.message);
            }
        }
        
    } catch (error) {
        console.log('❌ 整体处理失败:', error.message);
    }
}

populateRecent5Days();