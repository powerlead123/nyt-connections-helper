// 详细检查KV存储内容
console.log('🔍 详细检查KV存储内容...');

async function inspectKVStorage() {
    try {
        console.log('1. 检查最近30天的KV存储...');
        
        const dates = [];
        for (let i = 0; i <= 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        console.log('检查日期范围:', dates[dates.length-1], '到', dates[0]);
        
        let foundData = [];
        let totalChecked = 0;
        
        for (const dateStr of dates) {
            totalChecked++;
            try {
                // 通过API检查每个日期的数据
                const response = await fetch(`https://nyt-connections-helper.pages.dev/api/today?date=${dateStr}`, {
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.actualDate === dateStr) {
                        foundData.push({
                            date: dateStr,
                            source: data.source,
                            wordsCount: data.words?.length || 0,
                            groupsCount: data.groups?.length || 0,
                            freshness: data.freshness
                        });
                        console.log(`✅ ${dateStr}: ${data.source} (${data.words?.length || 0} words)`);
                    }
                }
            } catch (error) {
                // 忽略单个日期的错误
            }
            
            // 每检查10个日期显示进度
            if (totalChecked % 10 === 0) {
                console.log(`进度: ${totalChecked}/${dates.length} (找到 ${foundData.length} 个)`);
            }
        }
        
        console.log(`\n📊 检查结果:`);
        console.log(`- 总共检查: ${totalChecked} 个日期`);
        console.log(`- 找到数据: ${foundData.length} 个`);
        
        if (foundData.length > 0) {
            console.log('\n📋 找到的数据:');
            foundData.forEach(item => {
                console.log(`  ${item.date}: ${item.source} (${item.wordsCount} words, ${item.groupsCount} groups)`);
            });
            
            console.log('\n🎯 最新可用数据:', foundData[0]);
        } else {
            console.log('\n❌ 没有找到任何数据！');
            
            // 尝试直接调用today API看看返回什么
            console.log('\n🔍 直接检查today API...');
            const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            const todayData = await todayResponse.json();
            console.log('Today API响应:', JSON.stringify(todayData, null, 2));
            
            // 检查KV绑定是否正常
            console.log('\n🔍 检查KV绑定...');
            const kvTestResponse = await fetch('https://nyt-connections-helper.pages.dev/api/kv-test', {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (kvTestResponse.ok) {
                const kvTestData = await kvTestResponse.json();
                console.log('KV测试响应:', JSON.stringify(kvTestData, null, 2));
            } else {
                console.log('KV测试API不可用');
            }
        }
        
        // 检查是否有备用数据被过滤掉了
        console.log('\n🔍 检查是否有备用数据被过滤...');
        
        // 尝试修改API逻辑，临时允许备用数据
        const testResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'scrape-data',
                secret: 'your-secret-key-here'
            })
        });
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('手动抓取测试:', JSON.stringify(testData, null, 2));
        }
        
    } catch (error) {
        console.log('❌ 检查失败:', error.message);
    }
}

inspectKVStorage();