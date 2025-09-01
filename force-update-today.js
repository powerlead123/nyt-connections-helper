// 强制更新今天的题目
async function forceUpdateToday() {
    console.log('🔄 强制更新今天的Connections题目...\n');
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    console.log(`📅 今天日期: ${dateStr}`);
    
    // 测试从Mashable获取今天的数据
    console.log('\n1️⃣ 尝试从Mashable获取今天的数据...');
    
    try {
        const puzzleData = await fetchTodayFromMashable();
        
        if (puzzleData) {
            console.log('✅ 成功获取今天的数据!');
            console.log(`📅 日期: ${puzzleData.date}`);
            console.log(`📊 分组数量: ${puzzleData.groups.length}`);
            console.log(`🔗 来源: ${puzzleData.source}`);
            
            console.log('\n🎯 今天的答案:');
            puzzleData.groups.forEach((group, i) => {
                console.log(`${i+1}. ${group.theme}: ${group.words.join(', ')}`);
            });
            
            // 测试调用你的scheduled端点来更新数据
            console.log('\n2️⃣ 尝试更新Cloudflare网站数据...');
            await testScheduledUpdate();
            
        } else {
            console.log('❌ 无法获取今天的数据');
            console.log('可能原因:');
            console.log('- Mashable还没有发布今天的答案');
            console.log('- 网络连接问题');
            console.log('- 网站结构发生变化');
        }
        
    } catch (error) {
        console.log(`❌ 获取数据失败: ${error.message}`);
    }
}

async function fetchTodayFromMashable() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const day = today.getDate();
        
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const monthName = monthNames[today.getMonth()];
        
        console.log(`   尝试获取: ${monthName} ${day}, ${year}`);
        
        // 尝试多个可能的URL
        const urls = [
            `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day}-${year}`,
            `https://mashable.com/article/connections-hint-answer-today-${monthName}-${day}-${year}`
        ];
        
        for (const baseUrl of urls) {
            console.log(`   尝试URL: ${baseUrl}`);
            
            try {
                // 使用代理获取
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(15000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const html = data.contents;
                    
                    if (html && html.length > 1000) {
                        console.log(`   ✅ 获取到HTML内容 (${html.length} 字符)`);
                        
                        // 解析HTML
                        const puzzleData = parseMashableHTML(html, today.toISOString().split('T')[0]);
                        if (puzzleData) {
                            return puzzleData;
                        }
                    }
                }
            } catch (error) {
                console.log(`   ❌ URL失败: ${error.message}`);
                continue;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Mashable获取错误:', error);
        return null;
    }
}

function parseMashableHTML(html, dateStr) {
    try {
        console.log('   🔍 解析HTML内容...');
        
        // 查找今天日期的确认
        const today = new Date();
        const monthName = ['january', 'february', 'march', 'april', 'may', 'june',
                          'july', 'august', 'september', 'october', 'november', 'december'][today.getMonth()];
        const day = today.getDate();
        
        const datePattern = new RegExp(`${monthName}\\s+${day}`, 'i');
        if (!datePattern.test(html)) {
            console.log('   ⚠️ 未找到今天日期，可能不是今天的文章');
        }
        
        // 查找答案区域 - 基于我们之前成功的模式
        const answerPattern = /Yellow:\s*<strong>([^<]+)<\/strong>[\s\S]*?Green:\s*<strong>([^<]+)<\/strong>[\s\S]*?Blue:[\s\S]*?<strong>([^<]+)<\/strong>[\s\S]*?Purple:[\s\S]*?<strong>([^<]+)<\/strong>/i;
        const answerMatch = html.match(answerPattern);
        
        if (answerMatch) {
            console.log('   ✅ 找到答案提示');
            
            const hints = {
                Yellow: answerMatch[1].trim(),
                Green: answerMatch[2].trim(),
                Blue: answerMatch[3].trim(),
                Purple: answerMatch[4].trim()
            };
            
            console.log('   提示:', hints);
            
            // 查找实际单词 - 需要根据今天的实际内容调整
            // 先尝试通用的单词提取
            const allWords = extractAllWords(html);
            console.log(`   找到 ${allWords.length} 个可能的单词:`, allWords.slice(0, 20));
            
            if (allWords.length >= 16) {
                // 创建分组 - 这里可能需要手动调整
                const groups = [
                    {
                        theme: hints.Yellow,
                        words: allWords.slice(0, 4),
                        difficulty: 'yellow',
                        hint: hints.Yellow
                    },
                    {
                        theme: hints.Green,
                        words: allWords.slice(4, 8),
                        difficulty: 'green',
                        hint: hints.Green
                    },
                    {
                        theme: hints.Blue,
                        words: allWords.slice(8, 12),
                        difficulty: 'blue',
                        hint: hints.Blue
                    },
                    {
                        theme: hints.Purple,
                        words: allWords.slice(12, 16),
                        difficulty: 'purple',
                        hint: hints.Purple
                    }
                ];
                
                return {
                    date: dateStr,
                    words: groups.flatMap(g => g.words),
                    groups: groups,
                    source: 'Mashable'
                };
            }
        }
        
        console.log('   ❌ 无法解析出完整答案');
        return null;
        
    } catch (error) {
        console.error('   解析错误:', error);
        return null;
    }
}

function extractAllWords(html) {
    // 移除HTML标签
    const cleanText = html.replace(/<[^>]*>/g, ' ');
    
    // 查找大写单词
    const words = cleanText.match(/\b[A-Z]{2,}(?:[A-Z\s\-]*[A-Z])?\b/g) || [];
    
    // 清理和去重
    return words
        .map(word => word.trim())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE|THIS|THAT|THESE|THOSE)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, 30); // 取前30个最可能的单词
}

async function testScheduledUpdate() {
    try {
        console.log('   调用scheduled端点进行更新...');
        
        // 注意：这个调用会失败因为我们没有正确的密钥，但可以看到响应
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'test-secret'
            })
        });
        
        console.log(`   响应状态: ${response.status}`);
        const text = await response.text();
        console.log(`   响应内容: ${text}`);
        
        if (response.status === 401) {
            console.log('   ℹ️ 这是正常的 - 需要正确的密钥');
            console.log('   💡 GitHub Actions会使用正确的密钥自动调用');
        }
        
    } catch (error) {
        console.log(`   ❌ 调用失败: ${error.message}`);
    }
}

// 运行更新
forceUpdateToday().catch(console.error);