// 生成缺失的文章
console.log('📝 生成缺失的文章...');

async function generateMissingArticles() {
    const missingDates = ['2025-09-10', '2025-09-09', '2025-09-07', '2025-09-06'];
    
    for (const date of missingDates) {
        console.log(`\n生成 ${date} 的文章...`);
        
        try {
            // 触发scheduled任务来生成文章
            const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'generate-article', 
                    secret: 'your-secret-key-here' 
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${date} 文章生成请求已发送`);
                
                // 等待一下再检查下一个
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } else {
                console.log(`❌ ${date} 文章生成失败: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ${date} 生成过程出错:`, error.message);
        }
    }
    
    console.log('\n⏳ 所有文章生成请求已发送，等待处理...');
    console.log('💡 文章生成可能需要几分钟时间');
}

generateMissingArticles();