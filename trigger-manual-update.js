// 手动触发数据更新
console.log('🚀 手动触发数据更新...');

async function triggerManualUpdate() {
    try {
        console.log('📅 当前时间:', new Date().toISOString());
        console.log('🎯 目标: 获取9月2日的Connections数据');
        
        // 1. 首先尝试直接调用refresh API
        console.log('\n1. 尝试调用refresh API...');
        
        const refreshUrl = 'https://connections-helper-chinese.pages.dev/api/refresh';
        console.log('POST到:', refreshUrl);
        
        try {
            const refreshResponse = await fetch(refreshUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log('✅ Refresh API响应:', JSON.stringify(refreshData, null, 2));
                
                if (refreshData.success) {
                    console.log('🎉 数据刷新成功！');
                    
                    // 等待几秒后检查结果
                    console.log('\n⏳ 等待5秒后检查结果...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    const todayResponse = await fetch('https://connections-helper-chinese.pages.dev/api/today');
                    const todayData = await todayResponse.json();
                    
                    console.log('📊 更新后的数据:', JSON.stringify(todayData, null, 2));
                    
                    const hasRealData = !todayData.words.includes('LOADING');
                    if (hasRealData) {
                        console.log('🎉 成功获取真实数据！');
                    } else {
                        console.log('⚠️  仍然是占位符数据');
                    }
                } else {
                    console.log('⚠️  刷新API返回失败状态');
                }
            } else {
                console.log(`❌ Refresh API失败: ${refreshResponse.status}`);
            }
        } catch (error) {
            console.log('❌ Refresh API调用失败:', error.message);
        }
        
        // 2. 尝试触发scheduled函数
        console.log('\n2. 尝试触发scheduled函数...');
        
        const scheduledUrl = 'https://connections-helper-chinese.pages.dev/scheduled';
        console.log('POST到:', scheduledUrl);
        
        try {
            const scheduledResponse = await fetch(scheduledUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'daily-update',
                    secret: 'your-secret-key-here'
                })
            });
            
            if (scheduledResponse.ok) {
                const scheduledData = await scheduledResponse.json();
                console.log('✅ Scheduled函数响应:', JSON.stringify(scheduledData, null, 2));
            } else {
                console.log(`❌ Scheduled函数失败: ${scheduledResponse.status}`);
                const errorText = await scheduledResponse.text();
                console.log('错误详情:', errorText);
            }
        } catch (error) {
            console.log('❌ Scheduled函数调用失败:', error.message);
        }
        
        // 3. 手动触发GitHub Actions
        console.log('\n3. 建议手动触发GitHub Actions...');
        console.log('访问: https://github.com/powerlead123/nyt-connections-helper/actions');
        console.log('点击 "Daily NYT Connections Update" workflow');
        console.log('点击 "Run workflow" 按钮');
        
    } catch (error) {
        console.error('❌ 手动更新失败:', error);
    }
}

triggerManualUpdate();