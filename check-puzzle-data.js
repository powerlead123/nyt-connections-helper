// 检查今天的谜题数据是否存在
const today = new Date().toISOString().split('T')[0];
console.log(`检查日期: ${today}`);

async function checkPuzzleData() {
    try {
        // 检查今天的API数据
        const response = await fetch(`https://nyt-connections-helper.pages.dev/api/today`);
        console.log(`\n今天的API状态: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 今天的谜题数据存在');
            console.log('分组数量:', data.groups?.length || 0);
            
            if (data.groups && data.groups.length > 0) {
                console.log('\n分组详情:');
                data.groups.forEach((group, index) => {
                    console.log(`  ${index + 1}. ${group.theme} (${group.difficulty}): ${group.words?.join(', ')}`);
                });
            }
        } else {
            console.log('❌ 今天的谜题数据不存在');
            const text = await response.text();
            console.log('错误内容:', text.substring(0, 200));
        }
        
        // 检查文章生成API
        console.log(`\n检查文章API: /api/article/${today}`);
        const articleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`文章API状态: ${articleResponse.status}`);
        
        if (articleResponse.ok) {
            console.log('✅ 文章已存在');
        } else {
            console.log('❌ 文章不存在或生成失败');
        }
        
    } catch (error) {
        console.error('检查失败:', error.message);
    }
}

checkPuzzleData();