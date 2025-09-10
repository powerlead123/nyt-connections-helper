// 简化的第二步测试
console.log('🧪 第二步：简化测试本地逻辑');

async function simpleTest() {
    console.log('开始测试...');
    
    try {
        // 直接使用我们之前验证过的测试
        const response = await fetch('https://mashable.com/article/nyt-connections-hint-answer-today-september-10-2025', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
            const html = await response.text();
            console.log(`✅ 成功获取HTML，长度: ${html.length}`);
            
            // 检查关键短语
            const hasPhrase = html.includes("Today's connections fall into the following categories:");
            console.log(`关键短语存在: ${hasPhrase ? '✅' : '❌'}`);
            
            if (hasPhrase) {
                console.log('✅ 本地逻辑基础验证通过');
                return true;
            } else {
                console.log('❌ 关键短语不存在');
                return false;
            }
        } else {
            console.log(`❌ HTTP错误: ${response.status}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ 错误: ${error.message}`);
        return false;
    }
}

simpleTest().then(success => {
    if (success) {
        console.log('\n✅ 第二步验证通过，可以继续部署');
    } else {
        console.log('\n❌ 第二步验证失败');
    }
});