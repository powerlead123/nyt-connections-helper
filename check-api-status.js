// 检查API状态
console.log('🔍 检查API状态...');

async function checkApiStatus() {
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
        
        // 检查当前日期
        const today = new Date().toISOString().split('T')[0];
        console.log(`\n📅 今天日期: ${today}`);
        console.log(`📅 API数据日期: ${todayData.date}`);
        
        if (todayData.date === today) {
            console.log('✅ API数据是今天的');
        } else {
            console.log('⚠️ API数据不是今天的，可能需要刷新');
        }
        
        // 如果数据不是今天的，说明自动刷新可能有问题
        if (todayData.date !== today) {
            console.log('\n🔧 数据不是最新的，这说明：');
            console.log('1. 自动刷新功能可能还没生效');
            console.log('2. 或者今天的文章还没发布');
            console.log('3. 或者解析逻辑需要进一步调整');
        }
        
        // 显示当前数据内容
        if (todayData.groups && todayData.groups.length > 0) {
            console.log('\n📊 当前API返回的数据:');
            todayData.groups.forEach(group => {
                console.log(`${group.difficulty.toUpperCase()}: ${group.words.join(', ')}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkApiStatus();