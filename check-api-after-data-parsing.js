// 检查解析数据后的API状态
console.log('🔍 检查API状态...');

async function checkAPIStatus() {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const data = await response.json();
        
        console.log('API响应状态:', response.status);
        console.log('API响应数据:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ 有可用数据！');
            console.log('数据来源:', data.source);
            console.log('实际日期:', data.actualDate);
            console.log('新鲜度:', data.freshness);
        } else {
            console.log('❌ 仍然没有可用数据');
            console.log('错误信息:', data.message);
            
            console.log('\n💡 我们已经成功解析了5天的数据，但需要找到方法存储到KV中');
            console.log('可能的解决方案:');
            console.log('1. 修改scheduled.js支持历史数据存储');
            console.log('2. 手动构造API请求来存储数据');
            console.log('3. 等待Mashable修复今天的数据，然后明天自动抓取');
        }
        
    } catch (error) {
        console.log('❌ 检查失败:', error.message);
    }
}

checkAPIStatus();