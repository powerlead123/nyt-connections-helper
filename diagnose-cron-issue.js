// 诊断定时抓取问题
console.log('🔍 诊断定时抓取问题...');

async function diagnoseCronIssue() {
    try {
        console.log('1. 检查定时任务配置...');
        console.log('   - Cron时间: UTC 04:20 (北京时间12:20)');
        console.log('   - 当前时间:', new Date().toISOString());
        console.log('   - 北京时间:', new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}));
        
        console.log('\n2. 测试手动触发定时任务...');
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
        
        if (scheduledResponse.ok) {
            const scheduledData = await scheduledResponse.json();
            console.log('✅ 定时任务手动触发成功');
            console.log('结果:', JSON.stringify(scheduledData, null, 2));
            
            if (scheduledData.result?.scrape?.success) {
                console.log('✅ 数据抓取成功');
                console.log('数据源:', scheduledData.result.scrape.source);
                console.log('单词数量:', scheduledData.result.scrape.wordsCount);
                console.log('KV存储:', scheduledData.result.scrape.kvStored ? '成功' : '失败');
            } else {
                console.log('❌ 数据抓取失败');
                console.log('原因:', scheduledData.result?.scrape?.reason || scheduledData.result?.scrape?.error);
            }
        } else {
            console.log('❌ 定时任务触发失败:', scheduledResponse.status);
            const errorText = await scheduledResponse.text();
            console.log('错误信息:', errorText);
        }
        
        console.log('\n3. 检查当前API状态...');
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const todayData = await todayResponse.json();
        
        console.log('API状态:', todayResponse.status);
        console.log('数据成功:', todayData.success);
        if (todayData.success) {
            console.log('数据源:', todayData.source);
            console.log('实际日期:', todayData.actualDate);
            console.log('新鲜度:', todayData.freshness);
        } else {
            console.log('错误信息:', todayData.message);
        }
        
        console.log('\n4. 可能的问题原因:');
        console.log('   - Cloudflare Cron Triggers可能没有正确配置');
        console.log('   - 定时任务可能在执行但抓取失败');
        console.log('   - Mashable网站结构可能发生变化');
        console.log('   - KV存储绑定可能有问题');
        
    } catch (error) {
        console.log('❌ 诊断过程出错:', error.message);
    }
}

diagnoseCronIssue();