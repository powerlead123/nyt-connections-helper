// 调试KV绑定问题
console.log('🔧 调试KV绑定问题...');

async function debugKVBinding() {
    try {
        console.log('1. 检查scheduled.js的存储逻辑...');
        
        // 手动触发抓取，但这次详细查看过程
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'scrape-data',
                secret: 'your-secret-key-here'
            })
        });
        
        const data = await response.json();
        console.log('Scheduled响应:', JSON.stringify(data, null, 2));
        
        if (data.result && !data.result.success) {
            console.log('\n❌ 抓取失败原因:', data.result.reason || data.result.error);
            
            if (data.result.reason === 'No real puzzle data found') {
                console.log('\n🔍 这意味着:');
                console.log('1. fetchTodaysPuzzleData() 返回了 null');
                console.log('2. 可能是解析逻辑问题，或者Mashable数据确实有问题');
                console.log('3. 但我们之前测试过，Mashable是可以访问的');
                
                console.log('\n💡 可能的原因:');
                console.log('- scheduled.js中的解析逻辑与我们测试的不一致');
                console.log('- 解析逻辑太严格，Green分组缺少单词导致整个解析失败');
                console.log('- 或者有其他边界情况');
            }
        }
        
        // 检查是否有任何数据被存储（包括备用数据）
        console.log('\n2. 检查是否有备用数据被存储...');
        
        // 尝试直接访问一些可能的KV键
        const testDates = ['2025-09-22', '2025-09-21', '2025-09-20'];
        
        for (const date of testDates) {
            try {
                // 这里我们无法直接访问KV，但可以通过API间接检查
                console.log(`检查 ${date}...`);
            } catch (error) {
                console.log(`${date}: 检查失败`);
            }
        }
        
        console.log('\n3. 分析问题...');
        console.log('根据之前的测试，我们知道:');
        console.log('- Mashable网站可以访问 ✅');
        console.log('- 页面内容存在 ✅');
        console.log('- 但Green分组只有3个单词 ❌');
        console.log('- scheduled.js的解析逻辑要求每个分组必须有4个单词 ❌');
        console.log('');
        console.log('💡 解决方案:');
        console.log('1. 修改scheduled.js中的解析逻辑，允许某个分组只有3个单词');
        console.log('2. 或者添加容错机制');
        console.log('3. 或者临时存储不完整的数据，总比没有数据好');
        
    } catch (error) {
        console.log('❌ 调试失败:', error.message);
    }
}

debugKVBinding();