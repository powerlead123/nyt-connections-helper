// 手动抓取昨天的数据
console.log('📅 手动抓取昨天的数据...');

async function manualPopulateYesterday() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        console.log('目标日期:', dateStr);
        
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[yesterday.getMonth()];
        const day = yesterday.getDate();
        const year = yesterday.getFullYear();
        
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
        console.log('URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('响应状态:', response.status);
        
        if (!response.ok) {
            console.log('❌ 请求失败');
            return;
        }
        
        const html = await response.text();
        console.log('HTML长度:', html.length);
        
        // 检查内容完整性
        const hasContent = html.includes("Today's connections fall into the following categories:") &&
                         html.includes("Looking for Wordle today?") &&
                         html.includes("What is the answer to Connections today");
        
        console.log('内容完整性:', hasContent ? '✅' : '❌');
        
        if (hasContent) {
            console.log('✅ 昨天的数据看起来完整，尝试通过API存储...');
            
            // 注意：我们的scheduled API不支持指定日期，所以这里只是测试
            // 实际需要修改scheduled.js来支持历史日期抓取
            console.log('💡 需要修改scheduled.js来支持历史日期抓取');
        } else {
            console.log('❌ 昨天的数据也不完整');
        }
        
    } catch (error) {
        console.log('❌ 失败:', error.message);
    }
}

manualPopulateYesterday();