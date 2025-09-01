// 使用之前成功的方法获取今天的数据
async function useWorkingMethod() {
    console.log('🔄 使用之前成功的方法获取今天的数据...\n');
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthName = monthNames[today.getMonth()];
    const dayNum = today.getDate();
    const year = today.getFullYear();
    
    console.log(`📅 目标: ${monthName} ${dayNum}, ${year}`);
    
    // 使用之前成功的URL格式
    const urls = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${dayNum}-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${dayNum}-${year}`,
        `https://mashable.com/article/connections-hint-answer-today-${monthName}-${dayNum}-${year}`
    ];
    
    for (const baseUrl of urls) {
        console.log(`\n🌐 尝试: ${baseUrl}`);
        
        try {
            // 使用allorigins代理 (之前成功的方法)
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(15000)
            });
            
            if (!response.ok) {
                console.log(`   ❌ 代理请求失败: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const html = data.contents;
            
            if (!html || html.length < 1000) {
                console.log(`   ❌ HTML内容不足: ${html?.length || 0} 字符`);
                continue;
            }
            
            console.log(`   ✅ 获取HTML成功: ${html.length} 字符`);
            
            // 使用之前成功的解析方法
            const puzzleData = parseWithWorkingMethod(html, dateStr);
            
            if (puzzleData && puzzleData.groups && puzzleData.groups.length === 4) {
                console.log(`   🎉 解析成功！`);
                console.log(`   📅 日期: ${puzzleData.date}`);
                console.log(`   🔗 来源: ${puzzleData.source}`);
                
                console.log('\n🎯 今天的答案:');
                puzzleData.groups.forEach((group, i) => {
                    console.log(`${i+1}. ${group.theme}: ${group.words.join(', ')}`);
                });
                
                // 现在更新API文件
                await updateAPIFile(puzzleData);
                return puzzleData;
            } else {
                console.log(`   ❌ 解析失败`);
                
                // 调试信息
                console.log('   🔍 调试HTML内容:');
                console.log(`   包含"Yellow": ${html.includes('Yellow')}`);
                console.log(`   包含"Green": ${html.includes('Green')}`);
                console.log(`   包含"Blue": ${html.includes('Blue')}`);
                console.log(`   包含"Purple": ${html.includes('Purple')}`);
                console.log(`   包含"<strong>": ${html.includes('<strong>')}`);
                
                // 显示HTML片段用于调试
                const strongMatches = html.match(/<strong[^>]*>([^<]+)<\/strong>/gi) || [];
                console.log(`   找到 ${strongMatches.length} 个<strong>标签:`);
                strongMatches.slice(0, 10).forEach((match, i) => {
                    console.log(`   ${i+1}. ${match}`);
                });
            }
            
        } catch (error) {
            console.log(`   ❌ 请求失败: ${error.message}`);
        }
    }
    
    console.log('\n❌ 所有URL都失败了');
    return null;
}

// 使用之前成功的解析方法
function parseWithWorkingMethod(html, dateStr) {
    try {
        console.log('   🔍 开始解析HTML...');
        
        // 方法1: 查找颜色+strong标签的模式 (之前成功的方法)
        const colorPattern = /(Yellow|Green|Blue|Purple):\s*<strong>([^<]+)<\/strong>/gi;
        const colorMatches = [...html.matchAll(colorPattern)];
        
        console.log(`   找到 ${colorMatches.length} 个颜色匹配`);
        
        if (colorMatches.length >= 4) {
            const hints = {};
            colorMatches.forEach(match => {
                const color = match[1];
                const hint = match[2].trim();
                hints[color] = hint;
                console.log(`   ${color}: ${hint}`);
            });
            
            // 现在查找实际的单词
            // 方法A: 查找所有大写单词
            const allWords = extractAllUppercaseWords(html);
            console.log(`   提取到 ${allWords.length} 个大写单词:`, allWords.slice(0, 20));
            
            if (allWords.length >= 16) {
                // 创建分组 - 使用找到的提示
                const groups = [];
                const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
                const difficulties = ['yellow', 'green', 'blue', 'purple'];
                
                for (let i = 0; i < 4; i++) {
                    const color = colors[i];
                    const difficulty = difficulties[i];
                    const theme = hints[color] || `${color} Group`;
                    const words = allWords.slice(i * 4, (i + 1) * 4);
                    
                    if (words.length === 4) {
                        groups.push({
                            theme: theme,
                            words: words,
                            difficulty: difficulty,
                            hint: theme
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
            
            // 方法B: 查找特定的单词列表格式
            const listPatterns = [
                // 查找逗号分隔的单词列表
                /([A-Z][A-Z\s\-']*[A-Z]),\s*([A-Z][A-Z\s\-']*[A-Z]),\s*([A-Z][A-Z\s\-']*[A-Z]),\s*([A-Z][A-Z\s\-']*[A-Z])/g,
                // 查找其他格式
                /\b([A-Z]{2,})\b[,\s]*\b([A-Z]{2,})\b[,\s]*\b([A-Z]{2,})\b[,\s]*\b([A-Z]{2,})\b/g
            ];
            
            for (const pattern of listPatterns) {
                const matches = [...html.matchAll(pattern)];
                console.log(`   模式匹配到 ${matches.length} 组`);
                
                if (matches.length >= 4) {
                    const groups = [];
                    const colors = ['Yellow', 'Green', 'Blue', 'Purple'];
                    const difficulties = ['yellow', 'green', 'blue', 'purple'];
                    
                    for (let i = 0; i < Math.min(4, matches.length); i++) {
                        const match = matches[i];
                        const words = [match[1], match[2], match[3], match[4]].map(w => w.trim());
                        const color = colors[i];
                        const theme = hints[color] || `${color} Group`;
                        
                        groups.push({
                            theme: theme,
                            words: words,
                            difficulty: difficulties[i],
                            hint: theme
                        });
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
            }
        }
        
        // 方法2: 通用解析 (如果颜色方法失败)
        console.log('   尝试通用解析方法...');
        
        const allWords = extractAllUppercaseWords(html);
        if (allWords.length >= 16) {
            const groups = [];
            for (let i = 0; i < 4; i++) {
                groups.push({
                    theme: `Group ${i + 1}`,
                    words: allWords.slice(i * 4, (i + 1) * 4),
                    difficulty: ['yellow', 'green', 'blue', 'purple'][i],
                    hint: `These words share a common theme`
                });
            }
            
            return {
                date: dateStr,
                words: allWords.slice(0, 16),
                groups: groups,
                source: 'Mashable'
            };
        }
        
        return null;
        
    } catch (error) {
        console.log(`   ❌ 解析错误: ${error.message}`);
        return null;
    }
}

// 提取所有大写单词
function extractAllUppercaseWords(html) {
    // 清理HTML标签
    const cleanText = html.replace(/<[^>]*>/g, ' ');
    
    // 查找大写单词
    const patterns = [
        /\b[A-Z]{2,}(?:[A-Z\s\-']*[A-Z])?\b/g,  // 全大写单词
        /\b[A-Z][A-Z\-']+\b/g,                   // 大写开头的单词
    ];
    
    const allWords = [];
    
    for (const pattern of patterns) {
        const matches = cleanText.match(pattern) || [];
        allWords.push(...matches);
    }
    
    // 清理和去重
    const cleanWords = allWords
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2 && word.length <= 15)
        .filter(word => !/^(THE|AND|OR|OF|TO|IN|FOR|WITH|ON|AT|BY|FROM|A|AN|IS|ARE|WAS|WERE|THIS|THAT|THESE|THOSE|BUT|NOT|ALL|ANY|CAN|HAD|HER|HIM|HIS|HOW|ITS|MAY|NEW|NOW|OLD|SEE|TWO|WHO|BOY|DID|GET|HAS|LET|PUT|SAY|SHE|TOO|USE|YOU|WILL|ABOUT|AFTER|AGAIN|BEFORE|HERE|JUST|LIKE|MAKE|MOST|OVER|SUCH|TAKE|THAN|THEM|WELL|WERE|WHAT|WHERE|WHICH|WHILE|WHO|WILL|WITH|WOULD|YOUR|ALSO|BACK|BECAUSE|BEEN|BEING|BETWEEN|BOTH|CAME|COME|COULD|EACH|FIRST|FROM|GOOD|GREAT|GROUP|HAVE|INTO|KNOW|LAST|LIFE|LONG|LOOK|MADE|MANY|MORE|MUCH|MUST|NEVER|ONLY|OTHER|OUR|OUT|OWN|PART|PEOPLE|RIGHT|SAME|SHOULD|SINCE|SOME|STILL|SUCH|SYSTEM|THEIR|THERE|THESE|THEY|THINK|THIS|THOSE|THREE|THROUGH|TIME|UNDER|UNTIL|VERY|WANT|WATER|WAY|WE|WELL|WENT|WHAT|WHEN|WHERE|WHICH|WHILE|WHO|WHY|WILL|WITH|WORK|WORLD|WOULD|YEAR|YOU|YOUR)$/.test(word))
        .filter((word, index, arr) => arr.indexOf(word) === index);
    
    return cleanWords;
}

// 更新API文件
async function updateAPIFile(puzzleData) {
    console.log('\n🔄 更新API文件...');
    
    const apiContent = `// Cloudflare Pages Function for today's puzzle
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试从KV存储获取数据
        let puzzleData = null;
        
        if (env.CONNECTIONS_KV) {
            try {
                puzzleData = await env.CONNECTIONS_KV.get(\`puzzle-\${today}\`, 'json');
            } catch (error) {
                console.log('KV fetch error:', error);
            }
        }
        
        // 如果KV中没有数据，使用最新获取的数据
        if (!puzzleData || !puzzleData.groups || puzzleData.groups.length !== 4) {
            puzzleData = ${JSON.stringify(puzzleData, null, 12)};
        }
        
        return new Response(JSON.stringify(puzzleData), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
            }
        });
        
    } catch (error) {
        console.error('Today API error:', error);
        
        // 返回备用数据
        const backupData = ${JSON.stringify(puzzleData, null, 12)};
        
        return new Response(JSON.stringify(backupData), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}`;

    // 写入文件
    const fs = require('fs').promises;
    await fs.writeFile('functions/api/today.js', apiContent, 'utf8');
    console.log('   ✅ API文件已更新');
    
    return true;
}

// 运行
useWorkingMethod().catch(console.error);