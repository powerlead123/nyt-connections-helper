// 手动刷新并检查数据
console.log('手动触发刷新获取数据...');

async function refreshAndCheck() {
    try {
        // 1. 先触发手动刷新
        console.log('1. 触发手动刷新...');
        const refreshResponse = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST'
        });
        
        if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('刷新结果:', refreshData.success ? '成功' : '失败');
            console.log('刷新消息:', refreshData.message);
        }
        
        // 2. 等待几秒后检查数据
        console.log('2. 等待5秒后检查数据...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 3. 检查今日数据
        console.log('3. 检查今日数据...');
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const todayData = await todayResponse.json();
        
        console.log('今日数据状态:', todayResponse.status);
        console.log('今日数据:', JSON.stringify(todayData, null, 2));
        
        if (todayData.success) {
            console.log('✅ 成功获取数据！');
            console.log('数据源:', todayData.source);
            console.log('实际日期:', todayData.actualDate);
        } else {
            console.log('❌ 仍然没有数据');
        }
        
    } catch (error) {
        console.log('❌ 操作失败:', error.message);
    }
}

refreshAndCheck();