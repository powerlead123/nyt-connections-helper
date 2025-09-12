// 清除KV缓存，强制today.js重新抓取
async function clearKVCacheSept12() {
    console.log('=== 清除KV缓存，强制重新抓取 ===');
    
    try {
        // 方法1：通过refresh API清除缓存并重新抓取
        console.log('\n--- 方法1：使用refresh API ---');
        console.log('调用refresh API来强制更新数据...');
        
        const refreshResponse = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Refresh API响应状态:', refreshResponse.status);
        
        if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            console.log('Refresh结果:', refreshResult);
            
            if (refreshResult.success && refreshResult.data) {
                console.log('✅ Refresh API成功更新数据！');
                console.log('新数据源:', refreshResult.data.source);
                
                // 等待一下让数据传播
                console.log('等待3秒让数据传播...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // 验证today API
                console.log('\n--- 验证today API ---');
                const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
                const todayData = await todayResponse.json();
                
                console.log('Today API数据源:', todayData.source);
                console.log('数据是否更新:', todayData.source !== 'Backup (Simple)');
                
                if (todayData.source !== 'Backup (Simple)') {
                    console.log('🎉 成功！KV缓存已更新，today.js现在返回最新数据！');
                    return true;
                } else {
                    console.log('⚠️ 数据可能还没完全更新，请稍等片刻');
                }
            } else {
                console.log('❌ Refresh API未能获取新数据');
            }
        } else {
            console.log('❌ Refresh API调用失败');
        }
        
        // 方法2：多次调用today API，带时间戳防止缓存
        console.log('\n--- 方法2：多次调用today API ---');
        console.log('通过时间戳参数绕过缓存...');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`\n尝试 ${i}/3:`);
            
            const timestamp = Date.now() + i * 1000;
            const todayResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/today?t=${timestamp}&force=true`);
            const todayData = await todayResponse.json();
            
            console.log('响应状态:', todayResponse.status);
            console.log('数据源:', todayData.source);
            console.log('日期:', todayData.date);
            
            if (todayData.source !== 'Backup (Simple)') {
                console.log('✅ 成功获取最新数据！');
                
                console.log('\n--- 分组预览 ---');
                if (todayData.groups) {
                    todayData.groups.forEach((group, index) => {
                        console.log(`${index + 1}. ${group.theme}: ${group.words?.slice(0, 2).join(', ')}...`);
                    });
                }
                
                return true;
            }
            
            if (i < 3) {
                console.log('等待2秒后重试...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('\n❌ 多次尝试后仍未获取到最新数据');
        console.log('可能的原因：');
        console.log('1. Mashable页面解析逻辑有问题');
        console.log('2. KV存储更新延迟');
        console.log('3. 需要手动触发scheduled任务');
        
        return false;
        
    } catch (error) {
        console.error('清除缓存失败:', error);
        return false;
    }
}

// 运行清除缓存
clearKVCacheSept12().then(success => {
    if (success) {
        console.log('\n🎊 KV缓存清除成功！用户现在可以看到最新的谜题了！');
        console.log('📱 建议用户刷新网页以获取最新数据');
    } else {
        console.log('\n⚠️ 需要进一步调试或手动干预');
        console.log('💡 建议：');
        console.log('1. 检查scheduled.js的定时任务是否正常运行');
        console.log('2. 手动触发GitHub Actions');
        console.log('3. 检查Mashable页面结构是否有变化');
    }
});