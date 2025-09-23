// 检查KV中的真实数据
console.log('检查KV中存储的真实数据...');

async function checkKVData() {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const data = await response.json();
        
        console.log('API响应状态:', response.status);
        console.log('API响应数据:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ 找到真实数据！');
            console.log('日期:', data.actualDate);
            console.log('数据源:', data.source);
            console.log('是否今日数据:', data.isToday);
            console.log('数据新鲜度:', data.freshness);
        } else {
            console.log('❌ 没有找到真实数据');
            console.log('错误信息:', data.message);
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
    }
}

checkKVData();