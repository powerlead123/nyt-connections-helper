// 等待部署并检查
console.log('⏳ 等待Cloudflare Pages部署新版本...');
console.log('通常需要2-5分钟时间');

async function waitAndCheck() {
    const delays = [30, 60, 120]; // 30秒, 1分钟, 2分钟
    
    for (let i = 0; i < delays.length; i++) {
        const delay = delays[i];
        console.log(`\n⏰ 等待 ${delay} 秒后检查...`);
        
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        
        try {
            console.log(`\n🔍 第 ${i + 1} 次检查部署状态...`);
            
            // 检查刷新API
            const refreshUrl = 'https://nyt-connections-helper.pages.dev/api/refresh';
            const refreshResponse = await fetch(refreshUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const refreshData = await refreshResponse.json();
            
            console.log('刷新API状态:', refreshResponse.status);
            console.log('刷新API响应:', {
                success: refreshData.success,
                message: refreshData.message?.substring(0, 50) + '...',
                hasData: !!refreshData.data
            });
            
            if (refreshData.success && refreshData.data) {
                console.log('✅ 部署成功！新版本已生效');
                console.log('🎉 刷新API现在可以正常工作了');
                
                // 显示获取到的数据
                console.log('\n📊 获取到的数据:');
                console.log('日期:', refreshData.data.date);
                console.log('来源:', refreshData.data.source);
                console.log('分组数:', refreshData.data.groups?.length || 0);
                console.log('单词数:', refreshData.data.words?.length || 0);
                
                if (refreshData.data.groups) {
                    refreshData.data.groups.forEach((group, idx) => {
                        console.log(`${group.difficulty.toUpperCase()}: ${group.words.join(', ')}`);
                    });
                }
                
                return;
            } else {
                console.log(`⏳ 第 ${i + 1} 次检查：部署可能还在进行中...`);
            }
            
        } catch (error) {
            console.log(`❌ 第 ${i + 1} 次检查失败:`, error.message);
        }
    }
    
    console.log('\n⚠️ 部署可能需要更长时间，或者遇到了问题');
    console.log('💡 你可以：');
    console.log('1. 访问 https://nyt-connections-helper.pages.dev 查看网站');
    console.log('2. 在Cloudflare Pages控制台查看部署日志');
    console.log('3. 稍后再次运行此脚本检查');
}

waitAndCheck();