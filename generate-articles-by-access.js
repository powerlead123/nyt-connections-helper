// 通过访问文章页面来触发生成
console.log('🔄 通过访问文章页面来触发生成...');

async function generateArticlesByAccess() {
    const missingDates = ['2025-09-10', '2025-09-09', '2025-09-07', '2025-09-06'];
    
    console.log('📝 尝试通过访问来生成缺失的文章...');
    
    for (const date of missingDates) {
        console.log(`\n访问 ${date} 的文章页面...`);
        
        try {
            const response = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${date}`);
            
            console.log(`${date} 响应状态: ${response.status}`);
            
            if (response.ok) {
                const content = await response.text();
                console.log(`✅ ${date} 文章已生成，长度: ${content.length} 字符`);
                
                // 检查是否是真正的文章还是404页面
                if (content.includes('Complete Answers')) {
                    console.log(`🎉 ${date} 文章生成成功！`);
                } else if (content.includes('Article Not Found')) {
                    console.log(`❌ ${date} 文章生成失败 - 可能缺少谜题数据`);
                }
                
            } else {
                console.log(`❌ ${date} 访问失败: ${response.status}`);
            }
            
            // 等待一下避免请求过快
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ ${date} 访问出错:`, error.message);
        }
    }
    
    console.log('\n📊 重新检查所有文章状态...');
    
    // 重新检查所有文章
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
            const response = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${dateStr}`, {
                method: 'HEAD'
            });
            
            const status = response.ok ? '✅ 存在' : '❌ 不存在';
            console.log(`   ${dateStr}: ${status} (${response.status})`);
            
        } catch (error) {
            console.log(`   ${dateStr}: ❌ 检查失败`);
        }
    }
}

generateArticlesByAccess();