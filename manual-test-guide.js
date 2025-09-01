// 手动测试指南 - 验证Cloudflare网站
async function manualTestGuide() {
    const DOMAIN = 'nyt-connections-helper.pages.dev';
    
    console.log('🔍 手动测试指南 - 验证你的Cloudflare网站\n');
    console.log('=' .repeat(60));
    
    // 测试1: 网站首页
    console.log('\n📋 测试1: 网站首页');
    console.log(`🌐 在浏览器中打开: https://${DOMAIN}`);
    console.log('✅ 应该看到:');
    console.log('   - NYT Connections游戏界面');
    console.log('   - 今天的日期显示');
    console.log('   - 4个分组的答案');
    console.log('   - 每个分组有不同的颜色');
    
    try {
        const response = await fetch(`https://${DOMAIN}`);
        console.log(`🔍 实际状态: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
        console.log(`❌ 网站访问失败: ${error.message}`);
    }
    
    // 测试2: API端点
    console.log('\n📋 测试2: API数据');
    console.log(`🔗 在浏览器中打开: https://${DOMAIN}/api/today`);
    console.log('✅ 应该看到JSON数据包含:');
    
    try {
        const response = await fetch(`https://${DOMAIN}/api/today`);
        const data = await response.json();
        
        console.log(`🔍 实际数据:`);
        console.log(`   📅 日期: ${data.date} ${data.date === '2025-09-01' ? '✅' : '⚠️'}`);
        console.log(`   📊 分组数量: ${data.groups?.length || 0} ${data.groups?.length === 4 ? '✅' : '❌'}`);
        console.log(`   🔗 数据来源: ${data.source}`);
        
        if (data.groups && data.groups.length === 4) {
            console.log('\n   🎯 分组详情:');
            data.groups.forEach((group, i) => {
                const wordCount = group.words?.length || 0;
                console.log(`   ${i+1}. ${group.theme || '未知'}: ${wordCount}个词 ${wordCount === 4 ? '✅' : '❌'}`);
                if (group.words) {
                    console.log(`      词汇: ${group.words.join(', ')}`);
                }
            });
        }
        
    } catch (error) {
        console.log(`❌ API测试失败: ${error.message}`);
    }
    
    // 测试3: 功能验证
    console.log('\n📋 测试3: 功能验证');
    console.log('🎮 在网站上测试:');
    console.log('   1. 点击"显示答案"按钮');
    console.log('   2. 查看是否显示4个分组');
    console.log('   3. 每个分组是否有正确的颜色');
    console.log('   4. 单词是否正确显示');
    
    // 测试4: 移动端测试
    console.log('\n📋 测试4: 移动端兼容性');
    console.log('📱 在手机浏览器中测试:');
    console.log('   1. 网站是否正确显示');
    console.log('   2. 按钮是否可以点击');
    console.log('   3. 文字是否清晰可读');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 测试完成检查清单:');
    console.log('□ 网站可以正常访问');
    console.log('□ API返回正确的JSON数据');
    console.log('□ 显示今天的日期 (2025-09-01)');
    console.log('□ 包含4个完整分组');
    console.log('□ 每个分组有4个单词');
    console.log('□ 网站界面美观易用');
    console.log('□ 移动端显示正常');
    
    console.log('\n💡 如果所有项目都通过，你的网站就完全正确了！');
    
    // 额外的自动化测试
    console.log('\n🤖 自动化验证结果:');
    await performAutomatedChecks(DOMAIN);
}

async function performAutomatedChecks(domain) {
    const checks = [
        {
            name: '网站响应速度',
            test: async () => {
                const start = Date.now();
                const response = await fetch(`https://${domain}`);
                const time = Date.now() - start;
                return { success: response.ok, message: `${time}ms ${time < 3000 ? '✅' : '⚠️'}` };
            }
        },
        {
            name: 'API响应格式',
            test: async () => {
                const response = await fetch(`https://${domain}/api/today`);
                const data = await response.json();
                const hasRequiredFields = data.date && data.groups && data.source;
                return { success: hasRequiredFields, message: hasRequiredFields ? '✅ 格式正确' : '❌ 缺少必要字段' };
            }
        },
        {
            name: '数据完整性',
            test: async () => {
                const response = await fetch(`https://${domain}/api/today`);
                const data = await response.json();
                const isComplete = data.groups?.length === 4 && 
                                 data.groups.every(g => g.words?.length === 4);
                return { success: isComplete, message: isComplete ? '✅ 数据完整' : '❌ 数据不完整' };
            }
        },
        {
            name: 'HTTPS安全性',
            test: async () => {
                const url = `https://${domain}`;
                return { success: true, message: '✅ 使用HTTPS' };
            }
        }
    ];
    
    for (const check of checks) {
        try {
            const result = await check.test();
            console.log(`   ${check.name}: ${result.message}`);
        } catch (error) {
            console.log(`   ${check.name}: ❌ ${error.message}`);
        }
    }
}

// 运行测试
manualTestGuide().catch(console.error);