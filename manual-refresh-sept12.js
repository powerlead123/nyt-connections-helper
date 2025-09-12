// 手动刷新9月12日数据
async function manualRefreshSept12() {
    console.log('=== 手动刷新9月12日数据 ===');
    
    try {
        console.log('正在调用refresh API...');
        
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Refresh API响应状态:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('刷新结果:', result);
            
            if (result.success && result.data) {
                console.log('✅ 刷新成功！');
                console.log('数据源:', result.data.source);
                console.log('日期:', result.data.date);
                console.log('分组数量:', result.data.groups?.length);
                
                if (result.data.groups) {
                    console.log('\n--- 分组信息 ---');
                    result.data.groups.forEach((group, index) => {
                        console.log(`${index + 1}. ${group.theme} (${group.difficulty}): ${group.words?.join(', ')}`);
                    });
                }
                
                // 验证数据是否已更新
                console.log('\n--- 验证数据更新 ---');
                await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
                
                const verifyResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
                const verifyData = await verifyResponse.json();
                
                console.log('验证 - 数据源:', verifyData.source);
                console.log('验证 - 是否为最新数据:', verifyData.source !== 'Backup (Simple)');
                
                if (verifyData.source !== 'Backup (Simple)') {
                    console.log('🎉 数据已成功更新！用户现在可以看到最新的谜题了！');
                } else {
                    console.log('⚠️ 数据可能还没有完全更新，请稍等片刻');
                }
                
            } else {
                console.log('❌ 刷新失败:', result.message || '未知错误');
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Refresh API调用失败:', errorText);
        }
        
    } catch (error) {
        console.error('手动刷新失败:', error);
    }
}

// 运行手动刷新
manualRefreshSept12();