// 第四步：监控部署状态
console.log('👀 第四步：监控部署状态');
console.log('='.repeat(50));

async function monitorDeployment() {
    console.log('开始监控部署状态...');
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    
    let attempts = 0;
    const maxAttempts = 10; // 最多检查10次
    const interval = 30000; // 每30秒检查一次
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔍 第 ${attempts} 次检查 (${new Date().toLocaleTimeString()})`);
        
        try {
            // 检查生产环境API
            const response = await fetch('https://nyt-connections-helper.pages.dev/api/today', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const source = data.source || '';
                
                console.log(`📊 当前状态:`);
                console.log(`   - 数据源: ${source}`);
                console.log(`   - 单词数量: ${data.words?.length || 0}`);
                console.log(`   - 分组数量: ${data.groups?.length || 0}`);
                console.log(`   - 日期: ${data.date || '未知'}`);
                
                // 检查是否使用了完美逻辑
                if (source.includes('Perfect Logic')) {
                    console.log('🎉 完美逻辑已部署成功！');
                    
                    // 显示解析结果
                    if (data.groups && data.groups.length > 0) {
                        console.log('\n📋 生产环境解析结果:');
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
                    
                    console.log('\n✅ 部署成功！进入第五步验证');
                    return true;
                    
                } else if (data.words && data.words.length === 16 && data.groups && data.groups.length === 4) {
                    console.log('✅ 数据格式正确，可能已使用新逻辑');
                    console.log('🔍 继续检查确认...');
                    
                } else if (source === '' || source === '未知') {
                    console.log('⏳ 数据源未更新，继续等待...');
                    
                } else {
                    console.log(`📊 当前使用: ${source}`);
                    console.log('⏳ 等待新逻辑部署...');
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
    
    console.log('\n⏰ 达到最大检查次数');
    console.log('💡 部署可能需要更长时间，或者已经成功但数据源标识未更新');
    return false;
}

// 运行监控
monitorDeployment().then(success => {
    console.log('\n' + '='.repeat(50));
    console.log('📋 第四步监控完成');
    
    if (success) {
        console.log('✅ 检测到部署成功');
        console.log('🚀 准备进行第五步：最终验证');
        console.log('\n下一步运行: node step5-final-verification.js');
    } else {
        console.log('⚠️ 未明确检测到部署完成');
        console.log('💡 建议手动检查或稍后重试');
        console.log('🔧 也可以直接运行第五步验证');
    }
});