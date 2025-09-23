// 检查网络和部署状态
async function checkNetworkAndDeployment() {
    console.log('=== 检查网络和部署状态 ===');
    
    try {
        // 测试一个已知的外部网站
        console.log('测试外部网站连接...');
        const externalResponse = await fetch('https://httpbin.org/get');
        console.log('外部网站状态:', externalResponse.status, '✅ 网络正常');
        
        // 测试我们的网站主页
        console.log('\n测试我们的网站主页...');
        const homeResponse = await fetch('https://nyt-connections-hint.pages.dev/');
        console.log('主页状态:', homeResponse.status);
        
        if (homeResponse.ok) {
            console.log('✅ 网站可访问');
            
            // 测试 API 端点
            console.log('\n测试 API 端点...');
            const apiTests = [
                { name: 'today', url: 'https://nyt-connections-hint.pages.dev/api/today' },
                { name: 'debug-today', url: 'https://nyt-connections-hint.pages.dev/api/debug-today' },
                { name: 'kv-direct-test', url: 'https://nyt-connections-hint.pages.dev/api/kv-direct-test' }
            ];
            
            for (const test of apiTests) {
                try {
                    console.log(`\n测试 ${test.name} API...`);
                    const response = await fetch(test.url);
                    console.log(`${test.name} 状态:`, response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`${test.name} 响应:`, JSON.stringify(data, null, 2));
                    } else {
                        const text = await response.text();
                        console.log(`${test.name} 错误:`, text);
                    }
                } catch (error) {
                    console.log(`${test.name} 异常:`, error.message);
                }
            }
        } else {
            console.log('❌ 网站不可访问');
            const text = await homeResponse.text();
            console.log('响应内容:', text);
        }
        
    } catch (error) {
        console.log('❌ 检查过程异常:', error.message);
    }
}

checkNetworkAndDeployment();