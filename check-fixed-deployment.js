// 检查修复后的部署状态
console.log('🔧 检查修复后的部署状态...');
console.log('等待 Cloudflare Pages 重新部署...');

setTimeout(async () => {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('📊 修复后的状态:');
            console.log(`   数据源: ${data.source || '未知'}`);
            console.log(`   单词数量: ${data.words?.length || 0}`);
            console.log(`   分组数量: ${data.groups?.length || 0}`);
            
            if (data.source && data.source.includes('v2.0')) {
                console.log('\n🎉 v2.0 修复版本部署成功！');
            } else if (data.words && data.words.length === 16) {
                console.log('\n✅ 功能正常，语法错误已修复！');
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
            
        } else {
            console.log(`❌ API响应错误: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ 检查失败: ${error.message}`);
    }
}, 3000); // 等待3秒后检查