// 检查修复后的部署状态
console.log('等待Cloudflare Pages重新部署...');
console.log('修复内容：');
console.log('1. 移除了orphaned的代码行');
console.log('2. 修复了语法错误');
console.log('3. 推送了新的commit: ee95ccf');

setTimeout(async () => {
    try {
        console.log('\n检查API状态...');
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const data = await response.json();
        
        console.log('API响应状态:', response.status);
        console.log('API响应数据:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('✅ 部署修复成功！API正常工作');
        } else {
            console.log('❌ 仍有问题，需要进一步调试');
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        console.log('可能还在部署中，请稍后再试');
    }
}, 30000); // 等待30秒

console.log('30秒后将自动检查部署状态...');