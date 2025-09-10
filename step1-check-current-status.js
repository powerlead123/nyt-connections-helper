// 第一步：检查当前生产环境状态
console.log('🔍 第一步：检查当前生产环境状态');
console.log('='.repeat(50));

async function checkCurrentStatus() {
    try {
        console.log('正在检查生产环境...');
        
        // 检查today API
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('✅ 生产环境正常运行');
            console.log(`📊 当前状态:`);
            console.log(`   - 数据源: ${data.source || '未知'}`);
            console.log(`   - 单词数量: ${data.words?.length || 0}`);
            console.log(`   - 分组数量: ${data.groups?.length || 0}`);
            console.log(`   - 日期: ${data.date || '未知'}`);
            
            if (data.groups && data.groups.length > 0) {
                console.log(`\n📋 当前分组预览:`);
                data.groups.forEach((group, i) => {
                    const emoji = {
                        'yellow': '🟡',
                        'green': '🟢', 
                        'blue': '🔵',
                        'purple': '🟣'
                    }[group.difficulty] || '⚪';
                    
                    console.log(`   ${emoji} ${group.theme}: ${group.words?.slice(0, 2).join(', ')}...`);
                });
            }
            
            // 检查是否已经使用完美逻辑
            if (data.source && data.source.includes('Perfect Logic')) {
                console.log('\n🎉 当前已经使用完美逻辑！');
                console.log('💡 可能不需要重新部署');
            } else {
                console.log('\n📝 当前使用旧逻辑，需要部署更新');
            }
            
            return {
                status: 'success',
                currentSource: data.source,
                needsUpdate: !data.source?.includes('Perfect Logic')
            };
            
        } else {
            console.log(`❌ 生产环境响应异常: ${response.status}`);
            return {
                status: 'error',
                needsUpdate: true
            };
        }
        
    } catch (error) {
        console.log(`❌ 无法连接到生产环境: ${error.message}`);
        return {
            status: 'error',
            needsUpdate: true
        };
    }
}

// 运行检查
checkCurrentStatus().then(result => {
    console.log('\n' + '='.repeat(50));
    console.log('📋 第一步检查完成');
    
    if (result.needsUpdate) {
        console.log('✅ 确认需要部署更新');
        console.log('🚀 准备进行第二步：本地测试验证');
    } else {
        console.log('ℹ️  当前可能已经是最新版本');
        console.log('💡 建议仍然进行验证确认');
    }
    
    console.log('\n下一步运行: node step2-verify-local-logic.js');
});