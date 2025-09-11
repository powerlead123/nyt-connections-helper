// 检查 v2.0 部署状态
console.log('🚀 检查 v2.0 部署状态...');
console.log('等待 Cloudflare Pages 部署完成...');

async function checkV2Deployment() {
    let attempts = 0;
    const maxAttempts = 8;
    const interval = 20000; // 20秒
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔍 第 ${attempts} 次检查 (${new Date().toLocaleTimeString()})`);
        
        try {
            const response = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                console.log(`📊 当前状态:`);
                console.log(`   数据源: ${data.source || '未知'}`);
                console.log(`   单词数量: ${data.words?.length || 0}`);
                console.log(`   分组数量: ${data.groups?.length || 0}`);
                
                // 检查是否是 v2.0 版本
                if (data.source && data.source.includes('v2.0')) {
                    console.log('\n🎉 v2.0 版本部署成功！');
                    
                    if (data.groups && data.groups.length > 0) {
                        console.log('\n📋 v2.0 解析结果:');
                        data.groups.forEach((group, i) => {
                            const emoji = {
                                'yellow': '🟡',
                                'green': '🟢', 
                                'blue': '🔵',
                                'purple': '🟣'
                            }[group.difficulty] || '⚪';
                            
                            console.log(`${emoji} ${group.theme}: ${group.words?.join(', ') || '无数据'}`);
                        });
                    }
                    
                    return true;
                    
                } else if (data.words && data.words.length === 16) {
                    console.log('⏳ 功能正常，等待版本标识更新...');
                    
                } else {
                    console.log('⏳ 等待部署完成...');
                }
                
            } else {
                console.log(`❌ API响应错误: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ 检查失败: ${error.message}`);
        }
        
        if (attempts < maxAttempts) {
            console.log(`⏳ 等待 ${interval/1000} 秒后继续检查...`);
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    
    console.log('\n⏰ 检查完成');
    return false;
}

checkV2Deployment().then(success => {
    if (success) {
        console.log('\n🎊 v2.0 部署完全成功！');
    } else {
        console.log('\n💡 部署可能需要更长时间，请稍后手动检查');
    }
});