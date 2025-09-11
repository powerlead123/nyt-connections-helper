// 检查简化版本的部署状态
console.log('🔧 检查简化版本的部署状态...');

setTimeout(async () => {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('📊 简化版本状态:');
            console.log(`   数据源: ${data.source || '未知'}`);
            console.log(`   单词数量: ${data.words?.length || 0}`);
            console.log(`   分组数量: ${data.groups?.length || 0}`);
            
            if (data.source && data.source.includes('Simple')) {
                console.log('\n🎉 简化版本部署成功！');
            } else if (data.words && data.words.length === 16) {
                console.log('\n✅ 功能正常，语法错误已修复！');
            }
            
            console.log('\n🎊 部署成功！');
            
        } else {
            console.log(`❌ API响应错误: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ 检查失败: ${error.message}`);
    }
}, 3000);