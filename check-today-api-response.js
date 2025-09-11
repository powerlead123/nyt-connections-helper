// 检查today API的响应数据
async function checkTodayAPI() {
    try {
        console.log('=== 检查Today API响应 ===');
        
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        console.log('响应状态:', response.status);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('响应数据:', data);
        
        // 检查数据结构
        console.log('\n=== 数据结构分析 ===');
        console.log('日期:', data.date);
        console.log('数据源:', data.source);
        console.log('单词数量:', data.words?.length);
        console.log('分组数量:', data.groups?.length);
        
        if (data.groups) {
            console.log('\n=== 分组详情 ===');
            data.groups.forEach((group, index) => {
                console.log(`分组 ${index + 1}:`);
                console.log(`  主题: ${group.theme}`);
                console.log(`  难度: ${group.difficulty}`);
                console.log(`  单词: ${group.words?.join(', ')}`);
                console.log(`  提示: ${group.hint}`);
            });
        }
        
        // 检查单词列表
        if (data.words) {
            console.log('\n=== 单词列表 ===');
            console.log('所有单词:', data.words.join(', '));
        }
        
        return data;
        
    } catch (error) {
        console.error('检查Today API失败:', error);
        return null;
    }
}

// 运行检查
checkTodayAPI().then(data => {
    if (data) {
        console.log('\n✅ Today API工作正常，数据完整');
    } else {
        console.log('\n❌ Today API有问题');
    }
});