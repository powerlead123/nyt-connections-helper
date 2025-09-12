// 监控Cloudflare Cron Triggers部署
async function monitorCloudflareDeployment() {
    console.log('=== 监控Cloudflare Cron Triggers部署 ===');
    console.log('已推送到GitHub，Cloudflare Pages正在自动部署...');
    
    const maxAttempts = 15;
    const checkInterval = 20000; // 20秒
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\n--- 检查 ${attempt}/${maxAttempts} ---`);
        
        try {
            // 1. 检查scheduled端点是否更新
            console.log('测试scheduled端点...');
            
            const scheduledResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'daily-update',
                    secret: 'your-secret-key-here'
                })
            });
            
            console.log('Scheduled端点响应状态:', scheduledResponse.status);
            
            if (scheduledResponse.ok) {
                const scheduledResult = await scheduledResponse.json();
                console.log('Scheduled执行结果:', scheduledResult);
                
                // 检查是否包含新的触发器标识
                if (scheduledResult.result && scheduledResult.trigger) {
                    console.log('✅ 新版scheduled端点已部署！');
                    console.log('触发器类型:', scheduledResult.trigger);
                    
                    // 2. 检查数据是否更新
                    console.log('\n--- 检查数据更新 ---');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
                    const todayData = await todayResponse.json();
                    
                    console.log('Today API数据源:', todayData.source);
                    console.log('数据是否为最新:', todayData.source !== 'Backup (Simple)');
                    
                    if (todayData.source.includes('Cron Trigger')) {
                        console.log('🎉 Cloudflare Cron Triggers已成功工作！');
                    } else if (todayData.source.includes('Perfect Logic')) {
                        console.log('✅ 数据已更新为最新版本！');
                    }
                    
                    // 3. 显示最新谜题预览
                    if (todayData.groups && todayData.groups.length === 4) {
                        console.log('\n--- 最新谜题预览 ---');
                        todayData.groups.forEach((group, index) => {
                            const emoji = {
                                'yellow': '🟡',
                                'green': '🟢', 
                                'blue': '🔵',
                                'purple': '🟣'
                            }[group.difficulty] || '⚪';
                            
                            console.log(`${emoji} ${group.theme}: ${group.words?.slice(0, 2).join(', ')}...`);
                        });
                    }
                    
                    console.log('\n🎊 部署成功！新的定时抓取系统已上线！');
                    console.log('📅 下次自动执行时间: 明天UTC 01:00（北京时间09:00）');
                    console.log('🔄 现在系统使用Cloudflare Cron Triggers，更加可靠！');
                    
                    return true;
                }
            }
            
            console.log('部署仍在进行中...');
            
        } catch (error) {
            console.log('检查失败:', error.message);
        }
        
        if (attempt < maxAttempts) {
            console.log(`等待 ${checkInterval/1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    console.log('\n⚠️ 部署检查超时，但这不意味着部署失败');
    console.log('请手动检查部署状态');
    return false;
}

// 同时测试新旧系统的兼容性
async function testCompatibility() {
    console.log('\n=== 测试系统兼容性 ===');
    
    try {
        // 测试HTTP触发（兼容GitHub Actions）
        console.log('测试HTTP触发兼容性...');
        
        const httpResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'your-secret-key-here'
            })
        });
        
        if (httpResponse.ok) {
            const httpResult = await httpResponse.json();
            console.log('✅ HTTP触发正常工作');
            console.log('触发器类型:', httpResult.trigger || 'unknown');
        }
        
        // 测试refresh API
        console.log('\n测试refresh API兼容性...');
        
        const refreshResponse = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST'
        });
        
        if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            console.log('✅ Refresh API正常工作');
            console.log('刷新结果:', refreshResult.success ? '成功' : '失败');
        }
        
        console.log('\n✅ 系统兼容性测试完成');
        console.log('现在有三种方式可以触发数据更新:');
        console.log('1. Cloudflare Cron Triggers (自动，每天UTC 01:00)');
        console.log('2. HTTP POST到/scheduled (手动或GitHub Actions)');
        console.log('3. HTTP POST到/api/refresh (手动刷新)');
        
    } catch (error) {
        console.error('兼容性测试失败:', error);
    }
}

// 运行监控
monitorCloudflareDeployment().then(success => {
    if (success) {
        console.log('\n🎉 Cloudflare Cron Triggers部署成功！');
        testCompatibility();
    } else {
        console.log('\n⏰ 请稍后手动检查部署状态');
        console.log('💡 可以直接测试scheduled端点来验证部署');
    }
});