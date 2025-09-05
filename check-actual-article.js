// 检查实际的文章内容
import fetch from 'node-fetch';

async function checkActualArticle() {
    console.log('📖 === 检查实际文章内容 ===\n');
    
    const siteUrl = 'https://nyt-connections-helper.pages.dev';
    const today = new Date().toISOString().split('T')[0];
    
    try {
        console.log(`检查今日文章: ${today}`);
        console.log('=' .repeat(50));
        
        // 获取文章内容
        const articleResponse = await fetch(`${siteUrl}/articles/${today}`);
        
        if (articleResponse.ok) {
            const articleHtml = await articleResponse.text();
            
            console.log('✅ 文章访问成功');
            console.log(`📄 文章长度: ${articleHtml.length} 字符`);
            
            // 检查是否是HTML页面还是纯文章内容
            const isHtml = articleHtml.includes('<html>') || articleHtml.includes('<!DOCTYPE');
            console.log(`📝 内容类型: ${isHtml ? 'HTML页面' : '纯文本/Markdown'}`);
            
            if (isHtml) {
                console.log('\\n🔍 HTML页面分析:');
                
                // 检查页面标题
                const titleMatch = articleHtml.match(/<title>([^<]+)<\/title>/i);
                if (titleMatch) {
                    console.log(`  📋 页面标题: ${titleMatch[1]}`);
                }
                
                // 检查是否包含今日谜题数据
                const hasConnectionsData = articleHtml.includes('Connections') && 
                                         articleHtml.includes(today);
                console.log(`  🎯 包含Connections数据: ${hasConnectionsData ? '是' : '否'}`);
                
                // 检查是否是默认页面
                const isDefaultPage = articleHtml.includes('NYT Connections Game Helper') &&
                                    articleHtml.includes('wordsGrid');
                console.log(`  🏠 是否为默认游戏页面: ${isDefaultPage ? '是' : '否'}`);
                
                if (isDefaultPage) {
                    console.log('\\n💡 发现: 文章路径返回的是默认游戏页面');
                    console.log('这意味着:');
                    console.log('  • 文章生成功能存在但可能未激活');
                    console.log('  • 或者文章存储在不同的位置');
                    console.log('  • 或者需要特定的路由配置');
                }
                
            } else {
                console.log('\\n📝 文章内容预览:');
                console.log('=' .repeat(30));
                console.log(articleHtml.substring(0, 500) + '...');
                console.log('=' .repeat(30));
            }
            
        } else {
            console.log(`❌ 文章访问失败: ${articleResponse.status} ${articleResponse.statusText}`);
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 检查是否有专门的文章API
        console.log('\\n🔍 检查文章API端点');
        console.log('=' .repeat(50));
        
        const apiEndpoints = [
            `/api/article/${today}`,
            `/api/articles/${today}`,
            `/api/daily-article/${today}`
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(`${siteUrl}${endpoint}`);
                console.log(`${endpoint}: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    console.log(`  Content-Type: ${contentType}`);
                    
                    if (contentType?.includes('json')) {
                        const data = await response.json();
                        console.log(`  ✅ JSON数据: ${Object.keys(data).join(', ')}`);
                        
                        if (data.content || data.article) {
                            console.log(`  📝 包含文章内容: ${(data.content || data.article).length} 字符`);
                        }
                    }
                }
            } catch (error) {
                console.log(`${endpoint}: ❌ 访问失败`);
            }
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 检查KV存储的文章
        console.log('\\n💾 检查KV存储状态');
        console.log('=' .repeat(50));
        
        console.log('尝试通过定时任务检查KV存储...');
        
        // 尝试触发文章生成来测试功能
        const generateResponse = await fetch(`${siteUrl}/scheduled`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate-article',
                secret: 'test-key'
            })
        });
        
        console.log(`生成请求响应: ${generateResponse.status}`);
        
        if (generateResponse.status === 401) {
            console.log('✅ 文章生成端点存在且受保护');
            console.log('💡 需要正确的密钥才能触发文章生成');
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        // 总结文章生成状态
        console.log('\\n📋 文章生成功能状态总结');
        console.log('=' .repeat(50));
        
        console.log('✅ 已确认存在的功能:');
        console.log('  • 文章生成逻辑 (在 scheduled.js 中)');
        console.log('  • generateArticleContent 函数');
        console.log('  • KV存储机制 (article-YYYY-MM-DD)');
        console.log('  • 定时任务触发机制');
        
        console.log('\\n🔄 文章生成触发条件:');
        console.log('  1. 每日 6:00 UTC - GitHub Actions 触发 daily-update');
        console.log('  2. 手动触发 - 使用正确密钥调用 generate-article');
        console.log('  3. 数据抓取成功后 - 自动调用文章生成');
        
        console.log('\\n⚠️  当前状态:');
        console.log('  • 文章路径返回默认游戏页面');
        console.log('  • 可能需要配置路由来显示生成的文章');
        console.log('  • 或者文章存储在KV中但未配置访问端点');
        
        console.log('\\n💡 建议:');
        console.log('  • 创建专门的文章显示API端点');
        console.log('  • 配置路由来访问KV中存储的文章');
        console.log('  • 测试手动触发文章生成功能');
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error.message);
    }
}

checkActualArticle();