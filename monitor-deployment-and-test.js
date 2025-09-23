// 监控部署状态并测试 API
async function monitorDeploymentAndTest() {
    console.log('=== 监控部署状态并测试 API ===');
    
    const maxAttempts = 10;
    const delayBetweenAttempts = 30000; // 30秒
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\n尝试 ${attempt}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
        
        try {
            // 测试基本连接
            console.log('测试基本连接...');
            const basicResponse = await fetch('https://nyt-connections-hint.pages.dev/', {
                method: 'HEAD',
                timeout: 10000
            });
            console.log('基本连接状态:', basicResponse.status);
            
            if (basicResponse.ok) {
                // 测试 debug-today API
                console.log('测试 debug-today API...');
                const debugResponse = await fetch('https://nyt-connections-hint.pages.dev/api/debug-today');
                console.log('Debug API 状态:', debugResponse.status);
                
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    console.log('✅ Debug API 响应成功!');
                    console.log('Debug 数据:', JSON.stringify(debugData, null, 2));
                    
                    // 如果 debug API 成功，测试普通 today API
                    console.log('\n测试普通 today API...');
                    const todayResponse = await fetch('https://nyt-connections-hint.pages.dev/api/today');
                    console.log('Today API 状态:', todayResponse.status);
                    
                    if (todayResponse.ok) {
                        const todayData = await todayResponse.json();
                        console.log('✅ Today API 响应成功!');
                        console.log('Today 数据:', JSON.stringify(todayData, null, 2));
                        
                        // 分析数据状态
                        if (todayData.success) {
                            console.log('\n🎉 系统运行正常!');
                            console.log(`数据日期: ${todayData.actualDate}`);
                            console.log(`数据新鲜度: ${todayData.freshness}`);
                            console.log(`数据源: ${todayData.source || '未知'}`);
                            return;
                        } else {
                            console.log('\n⚠️ API 返回失败状态');
                            console.log('错误信息:', todayData.error);
                            console.log('建议:', todayData.suggestion);
                        }
                    } else {
                        const todayText = await todayResponse.text();
                        console.log('❌ Today API 失败:', todayText);
                    }
                } else {
                    const debugText = await debugResponse.text();
                    console.log('❌ Debug API 失败:', debugText);
                }
            } else {
                console.log('❌ 基本连接失败');
            }
            
        } catch (error) {
            console.log('❌ 请求异常:', error.message);
        }
        
        if (attempt < maxAttempts) {
            console.log(`等待 ${delayBetweenAttempts/1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        }
    }
    
    console.log('\n❌ 所有尝试都失败了，可能需要手动检查部署状态');
}

monitorDeploymentAndTest();