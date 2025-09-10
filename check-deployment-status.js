// 检查部署状态和修复是否生效
async function checkDeploymentStatus() {
    console.log('🔍 检查部署状态和修复是否生效');
    console.log('时间:', new Date().toLocaleString());
    console.log('=' .repeat(50));
    
    try {
        console.log('\n1. 📡 测试refresh API基本响应...');
        
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(15000)
        });
        
        console.log('状态码:', response.status);
        console.log('响应OK:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('响应结构:', {
                success: result.success,
                message: result.message?.substring(0, 50) + '...',
                hasData: !!result.data,
                timestamp: result.timestamp
            });
            
            // 检查是否返回了现有数据
            if (!result.success && !result.data) {
                console.log('\n⚠️ 发现问题: API没有返回现有数据');
                console.log('这表明修复可能还没有完全部署');
            } else if (result.data) {
                console.log('\n✅ API返回了数据 (成功或现有数据)');
                console.log('数据完整性:', {
                    date: result.data.date,
                    wordsCount: result.data.words?.length || 0,
                    groupsCount: result.data.groups?.length || 0
                });
            }
        }
        
        console.log('\n2. 🌐 测试today API作为对比...');
        
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
        
        if (todayResponse.ok) {
            const todayData = await todayResponse.json();
            console.log('Today API状态: ✅ 正常');
            console.log('Today数据:', {
                date: todayData.date,
                source: todayData.source,
                wordsCount: todayData.words?.length || 0,
                groupsCount: todayData.groups?.length || 0
            });
            
            if (todayData.groups && todayData.groups.length === 4) {
                console.log('✅ Today API有完整数据，refresh API应该能返回这些数据');
            }
        } else {
            console.log('Today API状态: ❌ 失败');
        }
        
        console.log('\n3. 📋 部署状态分析...');
        
        // 基于响应分析部署状态
        if (response.ok) {
            console.log('✅ refresh API端点存在且响应');
            
            if (result.success === false && result.message.includes('Failed to fetch fresh data')) {
                if (result.data) {
                    console.log('✅ 修复已部署: API正确返回现有数据');
                    console.log('🎯 功能状态: 正常 (返回现有数据)');
                } else {
                    console.log('⚠️ 修复部分部署: API逻辑更新但数据处理有问题');
                    console.log('🔧 需要检查: KV数据读取逻辑');
                }
            } else if (result.success === true) {
                console.log('🎉 完美: 获取到新数据');
                console.log('🎯 功能状态: 完全正常');
            }
        } else {
            console.log('❌ refresh API端点问题');
            console.log('🔧 需要检查: 部署状态或代码错误');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
        
        if (error.message.includes('timeout')) {
            console.log('⏰ 可能是网络延迟或服务器响应慢');
        }
    }
}

// 运行检查
console.log('🚀 启动部署状态检查...\n');
checkDeploymentStatus().then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('📝 总结:');
    console.log('- 如果修复已部署，refresh API应该返回现有数据');
    console.log('- 如果修复未部署，可能需要等待或手动触发部署');
    console.log('- 可以在网站上直接测试管理员刷新按钮');
    console.log('\n检查完成时间:', new Date().toLocaleString());
});