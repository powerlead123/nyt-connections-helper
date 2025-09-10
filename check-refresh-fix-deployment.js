// 检查refresh修复的部署状态
async function checkRefreshFixDeployment() {
    console.log('🔍 Checking refresh fix deployment status...');
    
    try {
        // 首先检查当前的API状态
        console.log('\n1. Testing current refresh API...');
        const refreshResponse = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Refresh API status:', refreshResponse.status);
        
        if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            console.log('Refresh result:', {
                success: refreshResult.success,
                message: refreshResult.message,
                timestamp: refreshResult.timestamp,
                hasData: !!refreshResult.data,
                dataKeys: refreshResult.data ? Object.keys(refreshResult.data) : []
            });
            
            if (refreshResult.success && refreshResult.data) {
                console.log('✅ Refresh API is working and returned data!');
                console.log('📊 Data summary:');
                console.log('  - Date:', refreshResult.data.date);
                console.log('  - Source:', refreshResult.data.source);
                console.log('  - Words:', refreshResult.data.words?.length || 0);
                console.log('  - Groups:', refreshResult.data.groups?.length || 0);
            } else {
                console.log('⚠️ Refresh API responded but with issues:', refreshResult.message);
            }
        } else {
            console.log('❌ Refresh API returned error status');
            const errorText = await refreshResponse.text();
            console.log('Error response:', errorText.substring(0, 500));
        }
        
        // 检查today API是否有数据
        console.log('\n2. Checking today API for current data...');
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
        
        if (todayResponse.ok) {
            const todayData = await todayResponse.json();
            console.log('Today API data:', {
                date: todayData.date,
                source: todayData.source,
                wordsCount: todayData.words?.length || 0,
                groupsCount: todayData.groups?.length || 0
            });
            
            if (todayData.groups && todayData.groups.length === 4) {
                console.log('✅ Today API has complete puzzle data');
                todayData.groups.forEach((group, i) => {
                    console.log(`  Group ${i+1}: ${group.theme} (${group.difficulty})`);
                });
            } else {
                console.log('⚠️ Today API data is incomplete');
            }
        } else {
            console.log('❌ Today API failed');
        }
        
        // 检查部署时间戳
        console.log('\n3. Checking deployment timestamp...');
        const deployTime = new Date().toISOString();
        console.log('Current time:', deployTime);
        console.log('Check completed at:', new Date().toLocaleString());
        
    } catch (error) {
        console.error('❌ Deployment check failed:', error);
    }
}

// 运行检查
checkRefreshFixDeployment();