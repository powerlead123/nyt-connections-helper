// 强制更新今日谜题

async function forceUpdateTodayPuzzle() {
    console.log('🔄 强制更新今日谜题...\n');
    
    const websiteUrl = 'https://nyt-connections-helper.pages.dev';
    
    try {
        console.log('📡 调用scheduled端点...');
        const response = await fetch(`${websiteUrl}/scheduled`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'your-secret-key' // 这个可能需要配置
            })
        });
        
        console.log(`响应状态: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ scheduled端点响应:', result);
            
            if (result.success) {
                console.log('🎉 更新成功！');
                if (result.scrape) {
                    console.log('抓取结果:', result.scrape);
                }
                if (result.article) {
                    console.log('文章生成:', result.article);
                }
            } else {
                console.log('❌ 更新失败:', result.message);
            }
        } else {
            console.log('❌ scheduled端点调用失败');
            const errorText = await response.text();
            console.log('错误信息:', errorText);
        }
        
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
    
    // 等待几秒后检查结果
    console.log('\n⏳ 等待3秒后检查更新结果...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
        console.log('📡 检查today API...');
        const todayResponse = await fetch(`${websiteUrl}/api/today?t=${Date.now()}`);
        
        if (todayResponse.ok) {
            const todayData = await todayResponse.json();
            console.log('✅ 当前数据:');
            console.log(`日期: ${todayData.date}`);
            console.log(`数据源: ${todayData.source}`);
            console.log(`分组数: ${todayData.groups?.length || 0}`);
            console.log(`单词数: ${todayData.words?.length || 0}`);
            
            if (todayData.source && !todayData.source.includes('Backup')) {
                console.log('🎉 成功获取真实数据！');
            } else {
                console.log('⚠️ 仍然是备用数据');
            }
        } else {
            console.log('❌ today API调用失败');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

// 执行强制更新
forceUpdateTodayPuzzle();