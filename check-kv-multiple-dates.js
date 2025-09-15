// 检查 KV 中多个日期的数据状态
// 用于诊断连续三天相同谜题的问题

async function checkKVMultipleDates() {
    console.log('=== 检查 KV 中多个日期的数据 ===');
    
    const baseUrl = 'https://nyt-connections-helper.pages.dev';
    
    // 检查最近几天的数据
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('检查日期:', dates);
    
    for (const date of dates) {
        try {
            console.log(`\n--- 检查 ${date} ---`);
            
            // 尝试直接访问该日期的数据（如果有的话）
            const response = await fetch(`${baseUrl}/api/today`);
            const data = await response.json();
            
            console.log('API 返回的日期:', data.date);
            console.log('数据时间戳:', data.timestamp);
            console.log('数据来源:', data.source);
            
            if (data.categories && data.categories.length > 0) {
                console.log('第一个分类:', data.categories[0].theme);
            }
            
            // 检查数据年龄
            if (data.timestamp) {
                const dataTime = new Date(data.timestamp);
                const hoursAgo = (Date.now() - dataTime.getTime()) / (1000 * 60 * 60);
                console.log('数据年龄:', Math.round(hoursAgo * 10) / 10, '小时前');
                
                if (hoursAgo > 24) {
                    console.log('⚠️ 数据超过24小时，可能是旧数据');
                }
            }
            
        } catch (error) {
            console.error(`检查 ${date} 失败:`, error.message);
        }
    }
}

// 运行检查
checkKVMultipleDates();