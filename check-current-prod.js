// 检查当前生产环境的数据
console.log('🔍 检查当前生产环境数据...');

async function checkCurrentProd() {
    try {
        // 检查today API
        console.log('📊 检查today API...');
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const todayData = await todayResponse.json();
        
        console.log('Today API状态:', todayResponse.status);
        console.log('Today API数据:', {
            date: todayData.date,
            source: todayData.source,
            groups: todayData.groups?.length || 0
        });
        
        if (todayData.groups) {
            console.log('\n📊 当前显示的数据:');
            todayData.groups.forEach(group => {
                console.log(`${group.difficulty.toUpperCase()}: ${group.words.join(', ')}`);
            });
        }
        
        // 测试refresh API
        console.log('\n🔄 测试refresh API...');
        const refreshResponse = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST'
        });
        const refreshData = await refreshResponse.json();
        
        console.log('Refresh API状态:', refreshResponse.status);
        console.log('Refresh API响应:', {
            success: refreshData.success,
            message: refreshData.message?.substring(0, 80) + '...'
        });
        
        if (refreshData.success && refreshData.data) {
            console.log('\n📊 刷新后的数据:');
            console.log('日期:', refreshData.data.date);
            console.log('来源:', refreshData.data.source);
            
            if (refreshData.data.groups) {
                refreshData.data.groups.forEach(group => {
                    console.log(`${group.difficulty.toUpperCase()}: ${group.words.join(', ')}`);
                });
            }
        }
        
        // 检查日期
        const today = new Date().toISOString().split('T')[0];
        console.log(`\n📅 今天日期: ${today}`);
        console.log(`📅 数据日期: ${todayData.date}`);
        
        if (todayData.date === today) {
            console.log('✅ 数据是今天的');
        } else {
            console.log('⚠️ 数据不是今天的，可能需要更新');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkCurrentProd();