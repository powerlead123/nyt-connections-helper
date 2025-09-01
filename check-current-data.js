// 检查当前网站数据状态
async function checkCurrentData() {
    console.log('🔍 检查当前网站数据状态...\n');
    
    const DOMAIN = 'nyt-connections-helper.pages.dev';
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📅 今天日期: ${today}`);
    
    // 检查API数据
    console.log('\n1️⃣ 检查API数据...');
    try {
        const response = await fetch(`https://${DOMAIN}/api/today`);
        const data = await response.json();
        
        console.log(`📊 API状态: ${response.status}`);
        console.log(`📅 数据日期: ${data.date}`);
        console.log(`🔗 数据来源: ${data.source}`);
        console.log(`📋 分组数量: ${data.groups?.length || 0}`);
        
        if (data.date !== today) {
            console.log(`⚠️ 数据不是今天的！当前: ${data.date}, 应该是: ${today}`);
        } else {
            console.log(`✅ 数据是今天的`);
        }
        
        if (data.groups && data.groups.length === 4) {
            console.log('\n🎯 当前显示的答案:');
            data.groups.forEach((group, i) => {
                console.log(`${i+1}. ${group.theme || '未知主题'}: ${group.words?.join(', ') || '无词汇'}`);
            });
        }
        
    } catch (error) {
        console.log(`❌ API检查失败: ${error.message}`);
    }
    
    // 手动触发更新建议
    console.log('\n2️⃣ 手动更新建议...');
    console.log('🔧 你可以通过以下方式手动更新:');
    console.log('');
    console.log('方法1: GitHub Actions手动触发');
    console.log('1. 访问: https://github.com/你的用户名/你的仓库名/actions');
    console.log('2. 选择 "Daily NYT Connections Update"');
    console.log('3. 点击 "Run workflow" 按钮');
    console.log('');
    console.log('方法2: 等待自动更新');
    console.log('- 系统会在每天UTC 6:00 (北京时间14:00) 自动更新');
    console.log('- 如果Mashable还没发布今天的答案，会使用备用数据');
    console.log('');
    console.log('方法3: 检查Mashable是否有今天的答案');
    console.log('- 访问: https://mashable.com/article/nyt-connections-hint-answer-today-september-1-2025');
    console.log('- 如果页面存在，说明答案已发布');
    
    // 检查时间
    console.log('\n3️⃣ 时间分析...');
    const now = new Date();
    const utcHour = now.getUTCHours();
    const localTime = now.toLocaleString();
    const utcTime = now.toUTCString();
    
    console.log(`🕐 本地时间: ${localTime}`);
    console.log(`🌍 UTC时间: ${utcTime}`);
    console.log(`⏰ 下次自动更新: 今天 UTC 6:00 (北京时间 14:00)`);
    
    if (utcHour < 6) {
        console.log(`ℹ️ 还没到自动更新时间 (还有 ${6 - utcHour} 小时)`);
    } else {
        console.log(`ℹ️ 已过自动更新时间，可能需要手动触发`);
    }
    
    // 提供解决方案
    console.log('\n4️⃣ 立即解决方案...');
    console.log('🚀 如果你想立即更新到今天的题目:');
    console.log('');
    console.log('选项A: 手动触发GitHub Actions (推荐)');
    console.log('- 这会使用正确的密钥调用scheduled函数');
    console.log('- 会尝试获取最新数据或使用备用数据');
    console.log('');
    console.log('选项B: 等待Mashable发布');
    console.log('- Mashable通常在美国时间早上发布答案');
    console.log('- 发布后系统会在下次更新时自动获取');
    console.log('');
    console.log('选项C: 使用备用数据');
    console.log('- 系统有内置的备用题目');
    console.log('- 可以确保网站始终有内容显示');
}

checkCurrentData().catch(console.error);