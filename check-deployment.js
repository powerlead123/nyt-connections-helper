// 检查部署状态
console.log('🚀 检查部署状态...');

async function checkDeployment() {
    try {
        // 检查生产环境的API
        const prodUrl = 'https://nyt-connections-helper.pages.dev/api/today';
        console.log(`检查生产API: ${prodUrl}`);
        
        const response = await fetch(prodUrl);
        const data = await response.json();
        
        console.log('生产环境状态:', response.status);
        console.log('生产环境数据:', {
            date: data.date,
            source: data.source,
            groups: data.groups?.length || 0,
            words: data.words?.length || 0
        });
        
        // 测试刷新API
        console.log('\n🔄 测试生产环境刷新API...');
        const refreshUrl = 'https://nyt-connections-helper.pages.dev/api/refresh';
        
        const refreshResponse = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const refreshData = await refreshResponse.json();
        
        console.log('刷新API状态:', refreshResponse.status);
        console.log('刷新API响应:', {
            success: refreshData.success,
            message: refreshData.message,
            dataDate: refreshData.data?.date,
            dataSource: refreshData.data?.source
        });
        
        if (refreshData.success) {
            console.log('✅ 部署成功！刷新API正常工作');
        } else {
            console.log('⚠️ 刷新API可能需要时间生效');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkDeployment();