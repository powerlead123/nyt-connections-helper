// 检查GitHub Actions状态
console.log('🔍 检查GitHub Actions状态');
console.log('');
console.log('请按照以下步骤检查:');
console.log('');
console.log('1. 访问: https://github.com/powerlead123/nyt-connections-helper/actions');
console.log('');
console.log('2. 查看是否有 "Daily NYT Connections Update" workflow');
console.log('');
console.log('3. 点击该workflow');
console.log('');
console.log('4. 现在应该能看到 "Run workflow" 按钮了');
console.log('   (我刚刚更新了配置文件)');
console.log('');
console.log('5. 如果仍然没有按钮，请告诉我你看到了什么');
console.log('');
console.log('🎯 同时，我已经更新了备用数据');
console.log('现在网站应该显示临时的新数据，而不是8月29日的旧数据');
console.log('');
console.log('💡 等待几分钟让Cloudflare Pages重新部署，然后刷新网站查看');

// 测试当前API状态
async function testCurrentAPI() {
    console.log('\n🧪 测试当前API状态...');
    
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/today?t=' + Date.now());
        const data = await response.json();
        
        console.log(`状态: ${response.status}`);
        console.log(`日期: ${data.date}`);
        console.log(`来源: ${data.source}`);
        console.log(`第一个分组: ${data.groups[0]?.theme || '未知'}`);
        console.log(`第一组单词: ${data.groups[0]?.words?.join(', ') || '未知'}`);
        
        if (data.source === 'Temporary Data - Awaiting Real Update') {
            console.log('✅ 备用数据已更新，不再是8月29日的旧数据');
        } else if (data.source === "Today's Puzzle") {
            console.log('⚠️ 仍然显示旧的备用数据');
        } else {
            console.log('✅ 可能已获取到真实数据');
        }
        
    } catch (error) {
        console.log(`❌ API测试失败: ${error.message}`);
    }
}

testCurrentAPI();