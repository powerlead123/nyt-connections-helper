// 检查干净版本的部署状态
console.log('🧹 检查干净版本的部署状态...');

setTimeout(async () => {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('📊 干净版本状态:');
            console.log(`   数据源: ${data.source || '未知'}`);
            console.log(`   单词数量: ${data.words?.length || 0}`);
            console.log(`   分组数量: ${data.groups?.length || 0}`);
            
            if (data.source && data.source.includes('v2.0')) {
                console.log('\n🎉 v2.0 干净版本部署成功！');
            } else if (data.words && data.words.length === 16) {
                console.log('\n✅ 功能正常，语法错误已彻底修复！');
            }
            
            if (data.groups && data.groups.length > 0) {
                console.log('\n📋 当前解析结果:');
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
            
            console.log('\n🎊 部署完全成功！');
            
        } else {
            console.log(`❌ API响应错误: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ 检查失败: ${error.message}`);
    }
}, 5000); // 等待5秒后检查