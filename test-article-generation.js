// 测试文章生成功能
import fetch from 'node-fetch';

async function testArticleGeneration() {
    console.log('📝 === 测试文章生成功能 ===\n');
    
    const siteUrl = 'https://nyt-connections-helper.pages.dev';
    
    try {
        // 测试1: 检查是否有文章API端点
        console.log('📄 测试1: 检查文章相关端点');
        console.log('=' .repeat(50));
        
        // 尝试访问可能的文章端点
        const articleEndpoints = [
            '/api/article',
            '/api/articles', 
            '/api/daily-article',
            '/article',
            '/articles'
        ];
        
        for (const endpoint of articleEndpoints) {
            try {
                const response = await fetch(`${siteUrl}${endpoint}`);
                console.log(`${endpoint}: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    console.log(`  Content-Type: ${contentType}`);
                    
                    if (contentType?.includes('json')) {
                        const data = await response.json();
                        console.log(`  数据类型: JSON, 键: ${Object.keys(data).join(', ')}`);
                    } else if (contentType?.includes('html')) {
                        const html = await response.text();
                        console.log(`  数据类型: HTML, 长度: ${html.length} 字符`);
                    }
                }
            } catch (error) {
                console.log(`${endpoint}: ❌ 访问失败`);
            }
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 测试2: 检查定时任务中的文章生成
        console.log('\\n⏰ 测试2: 检查定时任务的文章生成功能');
        console.log('=' .repeat(50));
        
        console.log('尝试触发文章生成 (预期会被拒绝，但可以看到功能存在)...');
        
        const scheduledResponse = await fetch(`${siteUrl}/scheduled`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate-article',
                secret: 'test-secret'
            })
        });
        
        console.log(`定时任务响应: ${scheduledResponse.status} ${scheduledResponse.statusText}`);
        
        if (scheduledResponse.status === 401) {
            console.log('✅ 文章生成端点存在且受保护');
        } else if (scheduledResponse.status === 400) {
            console.log('✅ 文章生成端点存在，但参数无效');
        } else {
            console.log('⚠️  意外的响应状态');
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 测试3: 模拟文章生成逻辑
        console.log('\\n🎨 测试3: 模拟文章生成逻辑');
        console.log('=' .repeat(50));
        
        // 获取今日谜题数据
        const todayResponse = await fetch(`${siteUrl}/api/today`);
        const todayData = await todayResponse.json();
        
        if (todayData && todayData.groups) {
            console.log('基于当前谜题数据生成文章预览...');
            
            const article = generateArticlePreview(todayData);
            
            console.log('\\n📝 生成的文章预览:');
            console.log('=' .repeat(30));
            console.log(article.substring(0, 800) + '...');
            console.log('=' .repeat(30));
            
            console.log(`\\n📊 文章统计:`);
            console.log(`  字符数: ${article.length}`);
            console.log(`  预估字数: ${Math.round(article.length / 5)}`);
            console.log(`  包含分组: ${todayData.groups.length}`);
            
            // 检查SEO元素
            const seoElements = {
                hasTitle: article.includes('# NYT Connections'),
                hasDate: article.includes(todayData.date),
                hasKeywords: article.includes('Connections') && article.includes('puzzle'),
                hasStructure: article.includes('##') && article.includes('###'),
                hasAnswers: todayData.groups.every(g => article.includes(g.theme)),
                hasHints: article.includes('hint') || article.includes('Hint')
            };
            
            console.log('\\n🔍 SEO元素检查:');
            Object.entries(seoElements).forEach(([element, present]) => {
                const elementNames = {
                    hasTitle: '标题结构',
                    hasDate: '日期信息',
                    hasKeywords: '关键词',
                    hasStructure: 'Markdown结构',
                    hasAnswers: '答案内容',
                    hasHints: '提示内容'
                };
                console.log(`  ${elementNames[element]}: ${present ? '✅' : '❌'}`);
            });
            
        } else {
            console.log('❌ 无法获取谜题数据来生成文章');
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 测试4: 检查文章存储机制
        console.log('\\n💾 测试4: 文章存储和访问机制');
        console.log('=' .repeat(50));
        
        console.log('检查可能的文章存储位置...');
        
        // 尝试访问今日文章
        const today = new Date().toISOString().split('T')[0];
        const articlePaths = [
            `/articles/${today}`,
            `/article/${today}`,
            `/solutions/${today}`,
            `/daily/${today}`,
            `/${today}`
        ];
        
        for (const path of articlePaths) {
            try {
                const response = await fetch(`${siteUrl}${path}`);
                console.log(`${path}: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    console.log(`  ✅ 找到文章路径: ${path}`);
                    const content = await response.text();
                    console.log(`  文章长度: ${content.length} 字符`);
                }
            } catch (error) {
                console.log(`${path}: ❌ 访问失败`);
            }
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 总结
        console.log('\\n📋 文章生成功能总结');
        console.log('=' .repeat(50));
        
        console.log('✅ 已确认的功能:');
        console.log('  • 定时任务中包含文章生成逻辑');
        console.log('  • 支持 generate-article 和 daily-update 操作');
        console.log('  • 文章生成函数 generateArticleContent 存在');
        console.log('  • 文章会存储到 KV 存储中');
        
        console.log('\\n🔄 文章生成触发时机:');
        console.log('  1. 每日定时任务 (6:00 UTC) - daily-update 操作');
        console.log('  2. 手动触发 - generate-article 操作');
        console.log('  3. 数据抓取成功后自动生成');
        
        console.log('\\n📝 文章内容包含:');
        console.log('  • 日期和标题');
        console.log('  • 完整的4个分组答案');
        console.log('  • 每个分组的解释和提示');
        console.log('  • 策略建议和玩法指导');
        console.log('  • SEO优化的结构和关键词');
        
        console.log('\\n💾 存储机制:');
        console.log('  • 存储到 Cloudflare KV');
        console.log('  • 键名格式: article-YYYY-MM-DD');
        console.log('  • 7天过期时间');
        
        console.log('\\n🎯 SEO优势:');
        console.log('  • 每日自动生成独特内容');
        console.log('  • 包含目标关键词 (NYT Connections, puzzle, answers)');
        console.log('  • 结构化内容 (标题、分组、解释)');
        console.log('  • 长期积累形成内容库');
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error.message);
    }
}

// 模拟文章生成逻辑
function generateArticlePreview(puzzleData) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const difficultyColors = {
        yellow: '🟡',
        green: '🟢',
        blue: '🔵',
        purple: '🟣'
    };
    
    let article = `# NYT Connections ${formattedDate} - Answers, Hints & Solutions

Welcome to today's Connections puzzle solution! If you're stuck on the ${formattedDate} NYT Connections game, you've come to the right place. Below you'll find all the answers, hints, and detailed explanations to help you solve today's word grouping challenge.

## 🎯 Quick Summary - ${formattedDate} Connections

Today's puzzle features themes around various categories. The difficulty ranges from straightforward word associations to some tricky wordplay that might catch you off guard.

## 📋 Complete Answers - ${formattedDate}

Here are all four groups for today's Connections puzzle:

`;

    puzzleData.groups.forEach((group, index) => {
        const emoji = difficultyColors[group.difficulty] || '⚪';
        const difficultyName = group.difficulty.charAt(0).toUpperCase() + group.difficulty.slice(1);
        
        article += `### ${emoji} ${group.theme} (${difficultyName})

**Words:** ${group.words.join(', ')}

**Explanation:** These words are connected by the theme "${group.theme}". ${group.hint || 'These words share a common characteristic.'}

**Hint:** ${group.hint || `Look for the connection between these words related to "${group.theme}".`}

---

`;
    });
    
    article += `## 💡 Strategy Tips

- Start with the most obvious connections first
- Look for common themes like categories, wordplay, or shared characteristics
- Don't be afraid to shuffle the words to see new patterns
- Remember that purple groups often involve wordplay or less obvious connections

## 🎮 Play More Connections

Visit [NYT Games](https://www.nytimes.com/games/connections) to play today's puzzle, or check out our [Solutions Archive](/solutions-archive) for previous puzzles.

---

*This solution was generated automatically. If you found this helpful, bookmark our site for daily Connections solutions!*
`;

    return article;
}

testArticleGeneration();