// 检查当前网站状态
async function checkCurrentStatus() {
    console.log('=== 检查当前网站状态 ===');
    
    try {
        // 检查今日API
        console.log('\n1. 检查今日API...');
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const todayData = await todayResponse.json();
        console.log('今日API响应:', JSON.stringify(todayData, null, 2));
        
        // 检查前端页面
        console.log('\n2. 检查前端页面...');
        const frontendResponse = await fetch('https://nyt-connections-helper.pages.dev/');
        const frontendText = await frontendResponse.text();
        console.log('前端页面状态:', frontendResponse.status);
        console.log('页面标题:', frontendText.match(/<title>(.*?)<\/title>/)?.[1] || '未找到标题');
        
        // 检查是否显示正确的单词
        if (todayData.answers) {
            console.log('\n3. 当前显示的答案:');
            todayData.answers.forEach((group, index) => {
                console.log(`${group.category}: ${group.words.join(', ')}`);
            });
        }
        
    } catch (error) {
        console.error('检查状态时出错:', error);
    }
}

checkCurrentStatus();