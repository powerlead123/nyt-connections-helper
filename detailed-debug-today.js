// 详细调试 today API
async function detailedDebugToday() {
    console.log('=== 详细调试 Today API ===');
    
    try {
        const debugResponse = await fetch('https://nyt-connections-helper.pages.dev/api/debug-today');
        const debugData = await debugResponse.json();
        
        console.log('完整的 debug 响应:');
        console.log(JSON.stringify(debugData, null, 2));
        
        console.log('\n=== 分析 ===');
        console.log('请求的日期:', debugData.requestedDate);
        console.log('实际找到的日期:', debugData.actualDate);
        console.log('是否成功:', debugData.success);
        console.log('错误信息:', debugData.error);
        
        if (debugData.debug) {
            console.log('\n调试信息:');
            console.log('- 找到数据:', debugData.debug.foundData);
            console.log('- 数据源:', debugData.debug.dataSource);
            console.log('- 被过滤:', debugData.debug.filteredOut);
        }
        
        console.log('\n=== 预期行为 ===');
        console.log('1. 查找今天的数据 (2025-09-23)');
        console.log('2. 发现是备用数据，过滤掉');
        console.log('3. 回退查找昨天的数据 (2025-09-22)');
        console.log('4. 找到真实数据，返回昨天的数据');
        console.log('5. 但实际上返回了 "No puzzle data available"');
        
        console.log('\n=== 可能的问题 ===');
        console.log('debug-today.js 的回退逻辑可能有问题');
        
    } catch (error) {
        console.log('❌ 调试异常:', error.message);
    }
}

detailedDebugToday();