// 浏览器调试指南
console.log(`
🔍 浏览器调试指南 - 找出为什么网站显示旧题目

请按照以下步骤在浏览器中调试：

📋 步骤1: 打开开发者工具
1. 访问: https://nyt-connections-helper.pages.dev
2. 按 F12 或右键点击 "检查元素"
3. 切换到 "Console" 标签

📋 步骤2: 检查JavaScript错误
在Console中查看是否有红色错误信息，常见错误：
- "Failed to fetch" - API调用失败
- "Cannot read property" - 数据结构问题
- "Uncaught TypeError" - 函数调用错误

📋 步骤3: 检查网络请求
1. 切换到 "Network" 标签
2. 刷新页面 (F5)
3. 查看是否有以下请求：
   - script.js (应该返回200)
   - /api/today (应该返回200)

📋 步骤4: 手动测试API
在Console中输入以下代码并按回车：

fetch('/api/today?t=' + Date.now())
  .then(r => r.json())
  .then(data => {
    console.log('API数据:', data);
    console.log('日期:', data.date);
    console.log('分组:', data.groups);
  });

📋 步骤5: 检查JavaScript变量
在Console中输入以下代码：

console.log('todaysPuzzle:', todaysPuzzle);
console.log('gameState:', gameState);

📋 步骤6: 强制重新加载数据
在Console中输入：

loadTodaysPuzzle().then(() => {
  console.log('重新加载完成');
  console.log('新数据:', todaysPuzzle);
});

📋 步骤7: 检查DOM元素
在Console中输入：

console.log('Words grid:', document.getElementById('wordsGrid').innerHTML);
console.log('Puzzle date:', document.getElementById('puzzleDate').textContent);

🎯 预期结果：
- API应该返回今天的日期: 2025-09-01
- todaysPuzzle变量应该包含今天的数据
- wordsGrid应该显示动态加载的单词

❌ 如果发现问题：
1. JavaScript错误 - 需要修复代码
2. API调用失败 - 网络或服务器问题
3. 数据正确但显示错误 - DOM更新问题

💡 临时解决方案：
如果一切看起来正常但仍显示旧数据，在Console中运行：

// 强制清除缓存并重新加载
location.reload(true);

// 或者强制重新初始化
initializePage();
`);

// 创建一个测试函数来验证网站状态
async function testWebsiteInBrowser() {
    console.log('\n🧪 自动化浏览器测试...\n');
    
    try {
        // 模拟浏览器环境测试
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
        const data = await response.json();
        
        console.log('✅ API测试结果:');
        console.log(`   日期: ${data.date}`);
        console.log(`   来源: ${data.source}`);
        console.log(`   分组数量: ${data.groups?.length || 0}`);
        
        if (data.groups && data.groups.length === 4) {
            console.log('\n📋 今天的实际答案:');
            data.groups.forEach((group, i) => {
                console.log(`   ${i+1}. ${group.theme}: ${group.words?.join(', ')}`);
            });
        }
        
        console.log('\n🔍 如果网站显示的不是这些答案，说明JavaScript没有正确加载数据');
        console.log('请按照上面的浏览器调试步骤进行检查');
        
    } catch (error) {
        console.log(`❌ API测试失败: ${error.message}`);
    }
}

testWebsiteInBrowser();