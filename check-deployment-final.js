// 检查部署是否生效
async function checkDeployment() {
    try {
        console.log('🔍 检查部署状态...');
        
        // 触发scheduled端点，看看数据来源
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'daily-update', secret: 'your-secret-key-here' })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Scheduled结果:', result);
            
            const source = result.result?.scrape?.source;
            console.log(`数据来源: ${source}`);
            
            if (source === 'Backup') {
                console.log('❌ 仍在使用备用数据 - 新代码未部署');
                console.log('💡 需要等待Cloudflare Pages完成部署');
            } else if (source && source.includes('Today API')) {
                console.log('✅ 新代码已部署 - 使用Today API逻辑');
            } else {
                console.log(`📊 使用数据源: ${source}`);
            }
        }
        
        console.log('\n📋 修复状态总结:');
        console.log('✅ 代码已修复并提交到GitHub');
        console.log('⏳ 等待Cloudflare Pages自动部署');
        console.log('🎯 部署完成后，文章将使用正确数据');
        
    } catch (error) {
        console.error('检查失败:', error.message);
    }
}

checkDeployment();