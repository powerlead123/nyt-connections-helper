// 检查部署状态
console.log('🚀 代码已推送到 GitHub！');
console.log('⏳ Cloudflare Pages 正在自动部署...');
console.log('');
console.log('等待 2-3 分钟后，我们来检查部署状态');

async function quickCheck() {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 当前生产环境状态:');
            console.log(`   数据源: ${data.source || '未知'}`);
            console.log(`   单词数量: ${data.words?.length || 0}`);
            console.log(`   分组数量: ${data.groups?.length || 0}`);
            
            if (data.source && data.source.includes('Perfect Logic')) {
                console.log('🎉 完美逻辑已部署！');
            } else {
                console.log('⏳ 还在使用旧逻辑，等待部署完成...');
            }
        }
    } catch (error) {
        console.log('检查失败:', error.message);
    }
}

setTimeout(() => {
    console.log('\n🔍 快速检查部署状态...');
    quickCheck();
}, 2000);