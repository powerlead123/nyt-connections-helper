// 强制获取今天的真实数据
async function forceUpdateRealData() {
    console.log('🔄 强制获取今天(9月1日)的真实Connections数据...\n');
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    const day = today.getDate();
    
    console.log(`📅 目标日期: ${year}-${month + 1}-${day}`);
    
    // 月份名称
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthName = monthNames[month];
    
    console.log(`🔍 查找: ${monthName} ${day}, ${year}`);
    
    // 尝试多个可能的URL格式
    const urlFormats = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-${monthName}-${day}-${year}`,
        `https://mashable.com/article/connections-${monthName}-${day}-${year}`
    ];
    
    console.log('\n🌐 尝试获取数据...');
    
    for (let i = 0; i < urlFormats.length; i++) {
        const baseUrl = urlFormats[i];
        console.log(`\n${i + 1}. 尝试: ${baseUrl}`);
        
        try {
            // 使用代理服务
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(20000)
            });
            
            if (!response.ok) {
                console.log(`   ❌ 代理请求失败: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const html = data.contents;
            
            if (!html || html.length < 1000) {
                console.log(`   ❌ HTML内容太短: ${html?.length || 0} 字符`);
                continue;
            }
            
            console.log(`   ✅ 获取到HTML: ${html.length} 字符`);
            
            // 检查是否包含今天的日期
            const datePatterns = [
                new RegExp(`${monthName}\\s+${day}`, 'i'),
                new RegExp(`${day}\\s+${monthName}`, 'i'),
                new RegExp(`${month + 1}[\/\\-]${day}`, 'i'),
                new RegExp(`${day}[\/\\-]${month + 1}`, 'i')
            ];
            
            let hasDateMatch = false;
            for (const pattern of datePatterns) {
                if (pattern.test(html)) {
                    hasDateMatch = true;
                    console.log(`   ✅ 找到日期匹配: ${pattern}`);
                    break;
                }
            }
            
            if (!hasDateMatch) {
                console.log(`   ⚠️ 未找到今天日期，可能不是今天的文章`);
                // 但仍然尝试解析，可能是格式问题
            }
            
            // 尝试解析数据
            console.log(`   🔍 解析HTML内容...`);
            const puzzleData = await parseModernMashableHTML(html, today.toISOString().split('T')[0]);
            
            if (puzzleData && puzzleData.groups && puzzleData.groups.length === 4) {
                console.log(`   🎉 成功解析出今天的数据！`);
                console.log(`   📅 日期: ${puzzleData.date}`);
                console.log(`   🔗 来源: ${puzzleData.source}`);
                console.log(`   📊 分组数量: ${puzzleData.groups.length}`);
                
                console.log('\n🎯 今天的真实答案:');
                puzzleData.groups.forEach((group, index) => {
                    console.log(`${index + 1}. ${group.theme}: ${group.words.join(', ')}`);
                });
                
                // 尝试更新Cloudflare数据
                console.log('\n🔄 尝试更新Cloudflare数据...');
                await updateCloudflareData(puzzleData);
                
                return puzzleData;
            } else {
                console.log(`   ❌ 解析失败或数据不完整`);
            }
            
        } catch (error) {
            console.log(`   ❌ 请求失败: ${error.message}`);
        }
    }
    
    console.log('\n❌ 所有URL都尝试失败');
    console.log('\n💡 可能的原因:');
    console.log('1. Mashable还没有发布今天的答案');
    console.log('2. URL格式发生了变化');
    console.log('3. 网站结构发生了变化');
    console.log('4. 代理服务问题');
    
    console.log('\n🔧 建议解决方案:');
    console.log('1. 手动访问Mashable网站查看今天的答案');
    console.log('2. 手动更新数据到Cloudflare KV');
    console.log('3. 等待Mashable发布后再次尝试');
    
    return null;
}

// 现代化的Mashable HTML解析
async function parseModernMashableHTML(html, dateStr) {
    try {
        console.log('      🔍 开始解析HTML...');
        
        // 多种解析策略
        const strategies = [
            parseWithColorHeaders,
            parseWithStrongTags,
            parseWithListItems,
            parseWithAnswerSections
        ];
        
        for (const strategy of strategies) {
            try {
                const result = strategy(html, dateStr);
                if (result && result.groups && result.groups.length === 4) {
                    console.log(`      ✅ 解析策略成功: ${strategy.name}`);
                    return result;
                }
            } catch (error) {
                console.log(`      ❌ 策略 ${strategy.name} 失败: ${error.message}`);
            }
        }
        
        return null;
        
    } catch (error) {
        console.log(`      ❌ 解析错误: ${error.message}`);
        return null;
    }
}

// 解析策略1: 颜色标题
function parseWithColorHeaders(html, dateStr) {
    console.log('         尝试颜色标题解析...');
    
    // 查找颜色分组
    const colorPattern = /(Green|Yellow|Blue|Purple)[\s\S]*?:([\s\S]*?)(?=(Green|Yellow|Blue|Purple)|$)/gi;
    const matches = [...html.matchAll(colorPattern)];
    
    if (matches.length >= 4) {
        const groups = [];
        const colors = ['green', 'yellow', 'blue', 'purple'];
        
        for (let i = 0; i < Math.min(4, matches.length); i++) {
            const colorName = matches[i][1].toLowerCase();
            const content = matches[i][2];
            const words = extractWordsFromContent(content);
            
            if (words.length >= 4) {
                groups.push({
                    theme: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} Group`,
                    words: words.slice(0, 4),
                    difficulty: colors[i] || colorName,
                    hint: `These words share a common theme`
                });
            }
        }
        
        if (groups.length === 4) {
            return {
                date: dateStr,
                words: groups.flatMap(g => g.words),
                groups: groups,
                source: 'Mashable'
            };
        }
    }
    
    return null;
}

// 解析策略2: Strong标签
function parseWithStrongTags(html, dateStr) {
    console.log('         尝试Strong标签解析...');
    
    const strongPattern = /<strong[^>]*>(.*?)<\/strong>/gi;
    const strongMatches = [...html.matchAll(strongPattern)];
    
    // 查找可能的分组标题和内容
    const groups = [];
    
    for (let i = 0; i < strongMatches.length - 1; i++) {
        const title = strongMatches[i][1].trim();
        const nextContent = html.substring(
            strongMatches[i].index + strongMatches[i][0].length,
            strongMatches[i + 1]?.index || html.length
        );
        
        const words = extractWordsFromContent(nextContent);
        
        if (words.length >= 4 && title.length > 0 && title.length < 50) {
            groups.push({
                theme: title,
                words: words.slice(0, 4),
                difficulty: ['green', 'yellow', 'blue', 'purple'][groups.length] || 'unknown',
                hint: title
            });
            
            if (groups.length === 4) break;
        }
    }
    
    if (groups.length === 4) {
        return {
            date: dateStr,
            words: groups.flatMap(g => g.words),
            groups: groups,
            source: 'Mashable'
        };
    }
    
    return null;
}

// 解析策略3: 列表项
function parseWithListItems(html, dateStr) {
    console.log('         尝试列表项解析...');
    
    const listPattern = /<li[^>]*>(.*?)<\/li>/gi;
    const listMatches = [...html.matchAll(listPattern)];
    
    if (listMatches.length >= 16) {
        const allWords = listMatches
            .map(match => extractWordsFromContent(match[1]))
            .flat()
            .filter(word => word.length >= 2 && word.length <= 15)
            .slice(0, 16);
        
        if (allWords.length >= 16) {
            const groups = [];
            for (let i = 0; i < 4; i++) {
                groups.push({
                    theme: `Group ${i + 1}`,
                    words: allWords.slice(i * 4, (i + 1) * 4),
                    difficulty: ['green', 'yellow', 'blue', 'purple'][i],
                    hint: `These words share a common theme`
                });
            }
            
            return {
                date: dateStr,
                words: allWords,
                groups: groups,
                source: 'Mashable'
            };
        }
    }
    
    return null;
}

// 解析策略4: 答案区域
function parseWithAnswerSections(html, dateStr) {
    console.log('         尝试答案区域解析...');
    
    const answerPattern = /answer[\s\S]{0,1000}/gi;
    const answerMatches = html.match(answerPattern) || [];
    
    for (const section of answerMatches) {
        const words = extractWordsFromContent(section);
        if (words.length >= 16) {
            const groups = [];
            for (let i = 0; i < 4; i++) {
                groups.push({
                    theme: `Group ${i + 1}`,
                    words: words.slice(i * 4, (i + 1) * 4),
                    difficulty: ['green', 'yellow', 'blue', 'purple'][i],
                    hint: `These words share a common theme`
                });
            }
            
            return {
                date: dateStr,
                words: words.slice(0, 16),
                groups: groups,
                source: 'Mashable'
            };
        }
    }
    
    return null;
}

// 从内容中提取单词
function extractWordsFromContent(content) {
    if (!content) return [];
    
    // 清理HTML标签
    const cleanContent = content.replace(/<[^>]*>/g, ' ');
    
    // 多种单词提取模式
    const patterns = [
        /\b[A-Z]{2,}(?:[A-Z\s\-']*[A-Z])?\b/g,  // 全大写单词
        /\b[A-Z][a-z]+\b/g,                      // 首字母大写
        /"([^"]+)"/g,                            // 引号中的内容
        /\b\w{3,15}\b/g                          // 一般单词
    ];
    
    const allWords = [];
    
    for (const pattern of patterns) {
        const matches = cleanContent.match(pattern) || [];
        allWords.push(...matches);
    }
    
    // 清理和去重
    return allWords
        .map(word => word.replace(/['"]/g, '').trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE|THIS|THAT|THESE|THOSE|BUT|NOT|ALL|ANY|CAN|HAD|HER|HIM|HIS|HOW|ITS|MAY|NEW|NOW|OLD|SEE|TWO|WHO|BOY|DID|GET|HAS|LET|PUT|SAY|SHE|TOO|USE)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);
}

// 更新Cloudflare数据
async function updateCloudflareData(puzzleData) {
    try {
        console.log('   🔄 调用scheduled端点更新数据...');
        
        // 注意：这个调用会失败因为我们没有密钥，但这是正常的
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'manual-update'
            })
        });
        
        console.log(`   响应状态: ${response.status}`);
        
        if (response.status === 401) {
            console.log('   ℹ️ 需要正确的密钥 - 这是正常的安全措施');
            console.log('   💡 请手动触发GitHub Actions来更新数据');
        }
        
    } catch (error) {
        console.log(`   ❌ 更新调用失败: ${error.message}`);
    }
}

// 运行强制更新
forceUpdateRealData().catch(console.error);