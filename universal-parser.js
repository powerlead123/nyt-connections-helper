// 真正通用的Connections解析器
console.log('🎯 创建真正通用的Connections解析器...');

// 通用解析策略：
// 1. 找到包含答案的核心区域
// 2. 识别4个颜色分组
// 3. 提取每组的4个单词
// 4. 验证结果的合理性

function universalConnectionsParser(html) {
    console.log('🔍 开始通用解析...');
    
    // 第一步：找到答案区域
    const answerRegions = findAnswerRegions(html);
    console.log(`找到 ${answerRegions.length} 个可能的答案区域`);
    
    for (let i = 0; i < answerRegions.length; i++) {
        console.log(`\n尝试解析区域 ${i + 1}...`);
        const result = parseAnswerRegion(answerRegions[i]);
        
        if (result && result.length === 4) {
            console.log('✅ 成功解析出4个分组!');
            return result;
        }
    }
    
    console.log('❌ 所有区域解析失败');
    return null;
}

// 查找可能包含答案的区域
function findAnswerRegions(html) {
    const regions = [];
    
    // 策略1: 查找包含"answer"关键词的区域
    const answerSections = [
        ...html.match(/<div[^>]*>[\s\S]*?answer[\s\S]*?<\/div>/gi) || [],
        ...html.match(/<section[^>]*>[\s\S]*?answer[\s\S]*?<\/section>/gi) || [],
        ...html.match(/<article[^>]*>[\s\S]*?answer[\s\S]*?<\/article>/gi) || [],
        ...html.match(/<p[^>]*>[\s\S]*?answer[\s\S]*?<\/p>/gi) || []
    ];
    
    regions.push(...answerSections);
    
    // 策略2: 查找包含所有4种颜色的区域
    const colorSections = html.match(/<[^>]*>[\s\S]*?yellow[\s\S]*?green[\s\S]*?blue[\s\S]*?purple[\s\S]*?<\/[^>]*>/gi) || [];
    regions.push(...colorSections);
    
    // 策略3: 查找包含大量大写单词的区域
    const wordDenseSections = [];
    const allSections = html.match(/<(?:div|section|article|p)[^>]*>[\s\S]*?<\/(?:div|section|article|p)>/gi) || [];
    
    allSections.forEach(section => {
        const uppercaseWords = (section.match(/\b[A-Z]{3,12}\b/g) || []).length;
        if (uppercaseWords >= 10) {
            wordDenseSections.push(section);
        }
    });
    
    regions.push(...wordDenseSections);
    
    // 去重并按长度排序（较长的区域可能包含更完整的信息）
    const uniqueRegions = [...new Set(regions)];
    return uniqueRegions.sort((a, b) => b.length - a.length);
}

// 解析单个答案区域
function parseAnswerRegion(region) {
    console.log(`解析区域，长度: ${region.length}`);
    
    // 清理HTML
    const cleanText = region
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    console.log('清理后文本预览:', cleanText.substring(0, 200));
    
    // 方法1: 查找颜色分组模式
    const colorGroups = extractColorGroups(cleanText, region);
    if (colorGroups && colorGroups.length === 4) {
        return colorGroups;
    }
    
    // 方法2: 查找列表模式
    const listGroups = extractListGroups(region);
    if (listGroups && listGroups.length === 4) {
        return listGroups;
    }
    
    // 方法3: 查找逗号分隔模式
    const commaGroups = extractCommaGroups(cleanText);
    if (commaGroups && commaGroups.length === 4) {
        return commaGroups;
    }
    
    return null;
}

// 提取颜色分组
function extractColorGroups(cleanText, originalHtml) {
    console.log('尝试颜色分组提取...');
    
    const colors = ['yellow', 'green', 'blue', 'purple'];
    const groups = [];
    
    for (const color of colors) {
        // 查找颜色提示
        const hintPattern = new RegExp(`${color}[:\\s]*<strong[^>]*>([^<]+)<\\/strong>`, 'i');
        const hintMatch = originalHtml.match(hintPattern);
        
        if (hintMatch) {
            const hint = hintMatch[1].trim();
            console.log(`${color} 提示: ${hint}`);
            
            // 在提示附近查找单词
            const wordsNearHint = findWordsNearHint(cleanText, hint);
            if (wordsNearHint.length >= 4) {
                groups.push({
                    category: hint,
                    words: wordsNearHint.slice(0, 4)
                });
            }
        }
    }
    
    return groups.length === 4 ? groups : null;
}

// 在提示附近查找单词
function findWordsNearHint(text, hint) {
    const hintIndex = text.toLowerCase().indexOf(hint.toLowerCase());
    if (hintIndex === -1) return [];
    
    // 在提示前后500字符内查找单词
    const start = Math.max(0, hintIndex - 500);
    const end = Math.min(text.length, hintIndex + 500);
    const nearbyText = text.substring(start, end);
    
    // 提取大写单词
    const words = nearbyText.match(/\b[A-Z]{3,12}\b/g) || [];
    
    // 过滤掉常见的非答案词汇
    return words.filter(word => {
        const exclude = ['NYT', 'CONNECTIONS', 'MASHABLE', 'TODAY', 'ANSWER', 'PUZZLE', 'HINT', 'GAME', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE'];
        return !exclude.includes(word);
    });
}

// 提取列表分组
function extractListGroups(html) {
    console.log('尝试列表分组提取...');
    
    // 查找有序或无序列表
    const lists = html.match(/<(?:ul|ol)[^>]*>[\s\S]*?<\/(?:ul|ol)>/gi) || [];
    
    for (const list of lists) {
        const items = list.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
        
        if (items.length >= 16) {
            const words = items.map(item => {
                const text = item.replace(/<[^>]*>/g, '').trim();
                const word = text.match(/\b[A-Z]{3,12}\b/);
                return word ? word[0] : null;
            }).filter(w => w);
            
            if (words.length >= 16) {
                const groups = [];
                for (let i = 0; i < 4; i++) {
                    groups.push({
                        category: `Group ${i + 1}`,
                        words: words.slice(i * 4, (i + 1) * 4)
                    });
                }
                return groups;
            }
        }
    }
    
    return null;
}

// 提取逗号分隔分组
function extractCommaGroups(text) {
    console.log('尝试逗号分隔提取...');
    
    // 查找4个单词一组的模式
    const groupPattern = /([A-Z][A-Z\-\d]*),\s*([A-Z][A-Z\-\d]*),\s*([A-Z][A-Z\-\d]*),\s*([A-Z][A-Z\-\d]*)/g;
    const matches = [...text.matchAll(groupPattern)];
    
    if (matches.length >= 4) {
        return matches.slice(0, 4).map((match, i) => ({
            category: `Group ${i + 1}`,
            words: [match[1], match[2], match[3], match[4]]
        }));
    }
    
    return null;
}

// 测试解析器
async function testUniversalParser() {
    console.log('\n🧪 测试通用解析器...');
    
    // 测试HTML示例
    const testHtml = `
    <div class="content">
        <h2>What is the answer to Connections today?</h2>
        <p>Here are today's answers:</p>
        
        <p><strong>Yellow:</strong> <strong>Things that are round</strong></p>
        <p>BALL, CIRCLE, WHEEL, GLOBE</p>
        
        <p><strong>Green:</strong> <strong>Types of music</strong></p>
        <p>JAZZ, ROCK, BLUES, FOLK</p>
        
        <p><strong>Blue:</strong> <strong>Colors</strong></p>
        <p>RED, BLUE, GREEN, YELLOW</p>
        
        <p><strong>Purple:</strong> <strong>Animals</strong></p>
        <p>CAT, DOG, BIRD, FISH</p>
    </div>
    `;
    
    const result = universalConnectionsParser(testHtml);
    console.log('\n测试结果:', result);
    
    if (result && result.length === 4) {
        console.log('✅ 测试通过！');
        result.forEach((group, i) => {
            console.log(`组 ${i + 1}: ${group.category} - ${group.words.join(', ')}`);
        });
    } else {
        console.log('❌ 测试失败');
    }
}

// 导出函数
if (typeof module !== 'undefined') {
    module.exports = { universalConnectionsParser };
}

// 运行测试
testUniversalParser();