// 检查日期范围内的数据
async function checkDateRangeData() {
    console.log('=== 检查日期范围内的数据 ===');
    
    const today = new Date();
    console.log('今天:', today.toISOString().split('T')[0]);
    
    // 检查最近几天的数据
    for (let daysBack = 0; daysBack <= 5; daysBack++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - daysBack);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        try {
            console.log(`\n检查 ${dateStr} (${daysBack}天前):`);
            
            // 使用 KV 直接测试，但修改日期
            const kvResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/kv-direct-test?date=${dateStr}`);
            
            if (kvResponse.ok) {
                const kvData = await kvResponse.json();
                if (kvData.found) {
                    console.log(`✅ 找到数据`);
                    console.log(`   数据源: ${kvData.fullData.source}`);
                    console.log(`   是否备用: ${kvData.fullData.source?.includes('Backup')}`);
                    console.log(`   数据长度: ${kvData.dataLength}`);
                } else {
                    console.log(`❌ 未找到数据`);
                }
            } else {
                console.log(`❌ API 请求失败: ${kvResponse.status}`);
            }
        } catch (error) {
            console.log(`❌ 检查异常: ${error.message}`);
        }
    }
    
    console.log('\n=== 总结 ===');
    console.log('根据上面的结果，我们可以看到：');
    console.log('1. 哪些日期有真实数据');
    console.log('2. 哪些日期只有备用数据');
    console.log('3. today.js 应该使用最新的真实数据');
}

checkDateRangeData();