// 验证当前网站数据状态
async function checkCurrentData() {
    console.log('🔍 检查当前网站数据状态...\n');
    
    try {
        // 检查API数据
        console.log('📡 检查API数据:');
        const apiResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const apiData = await apiResponse.json();
        
        console.log('API响应状态:', apiResponse.status);
        console.log('数据源:', apiData.source || '未知');
        console.log('日期:', apiData.date || '未知');
        console.log('是否有分组数据:', apiData.groups ? '是' : '否');
        
        if (apiData.groups && apiData.groups.length > 0) {
            console.log('分组数量:', apiData.groups.length);
            console.log('第一个分组:', apiData.groups[0].category);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 检查首页
        console.log('🏠 检查首页数据:');
        const homeResponse = await fetch('https://nyt-connections-helper.pages.dev/');
        console.log('首页响应状态:', homeResponse.status);
        
        const homeHtml = await homeResponse.text();
        
        // 检查是否包含谜题数据
        const hasGameData = homeHtml.includes('game-container') || homeHtml.includes('connections-game');
        console.log('是否包含游戏数据:', hasGameData ? '是' : '否');
        
        // 检查是否显示备用数据提示
        const hasBackupNotice = homeHtml.includes('Backup') || homeHtml.includes('备用');
        console.log('是否显示备用数据提示:', hasBackupNotice ? '是' : '否');
        
        console.log('\n✅ 数据检查完成！');
        
        // 总结
        console.log('\n📊 总结:');
        if (apiData.source && !apiData.source.includes('Backup')) {
            console.log('🎉 数据源正常，不是备用数据！');
        } else {
            console.log('⚠️  当前仍在使用备用数据');
        }
        
        if (apiData.groups && apiData.groups.length === 4) {
            console.log('🎉 谜题数据完整（4个分组）！');
        } else {
            console.log('⚠️  谜题数据可能不完整');
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error.message);
    }
}

checkCurrentData();