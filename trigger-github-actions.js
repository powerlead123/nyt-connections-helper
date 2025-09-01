// 手动触发GitHub Actions更新
console.log('🚀 手动触发GitHub Actions更新数据');
console.log('');
console.log('请按照以下步骤操作:');
console.log('');
console.log('1. 打开浏览器，访问:');
console.log('   https://github.com/powerlead123/nyt-connections-helper/actions');
console.log('');
console.log('2. 点击 "Daily NYT Connections Update" workflow');
console.log('');
console.log('3. 点击右侧的 "Run workflow" 按钮');
console.log('');
console.log('4. 在弹出的对话框中，点击绿色的 "Run workflow" 按钮');
console.log('');
console.log('5. 等待1-3分钟让workflow完成');
console.log('');
console.log('6. 刷新你的网站页面查看结果');
console.log('');
console.log('🎯 这会调用scheduled函数，使用正确的密钥获取最新数据');
console.log('');
console.log('💡 如果GitHub Actions成功运行，你的网站会自动更新到今天的真实题目');

// 同时，让我们也手动触发scheduled端点（虽然会失败，但可以看到响应）
async function testScheduledEndpoint() {
    console.log('\n🧪 测试scheduled端点响应...');
    
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'test-secret'
            })
        });
        
        console.log(`状态: ${response.status}`);
        const text = await response.text();
        console.log(`响应: ${text}`);
        
        if (response.status === 401) {
            console.log('✅ 端点正常工作，只是需要正确的密钥');
            console.log('💡 GitHub Actions会提供正确的密钥');
        }
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
    }
}

testScheduledEndpoint();