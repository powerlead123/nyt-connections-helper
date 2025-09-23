// 检查今天KV中存储的谜题数据
console.log('🔍 检查今天KV中的谜题数据...');

async function checkTodayKVPuzzle() {
    try {
        // 获取今天的日期
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        console.log(`📅 检查日期: ${dateStr}`);
        
        // 通过API获取今天的谜题数据
        const response = await fetch(`https://nyt-connections-helper.pages.dev/api/today`);
        
        if (!response.ok) {
            console.log(`❌ API请求失败: ${response.status} ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        
        console.log('📊 今天的谜题数据：');
        console.log(`   日期: ${data.date || '未知'}`);
        console.log(`   状态: ${data.success ? '✅ 成功' : '❌ 失败'}`);
        
        if (data.success && data.puzzle) {
            console.log('');
            console.log('🧩 谜题内容：');
            console.log(`   单词数量: ${data.puzzle.words ? data.puzzle.words.length : '未知'}`);
            
            if (data.puzzle.words) {
                console.log(`   单词列表: ${data.puzzle.words.join(', ')}`);
            }
            
            if (data.puzzle.categories) {
                console.log('');
                console.log('📋 分类信息：');
                data.puzzle.categories.forEach((category, index) => {
                    const difficultyColors = ['🟢', '🟡', '🔵', '🟣'];
                    const difficultyNames = ['简单', '中等', '困难', '最难'];
                    
                    console.log(`   ${difficultyColors[index]} ${difficultyNames[index]}: ${category.theme}`);
                    console.log(`      单词: ${category.words.join(', ')}`);
                });
            }
            
            if (data.puzzle.hints) {
                console.log('');
                console.log('💡 提示信息：');
                data.puzzle.hints.forEach((hint, index) => {
                    console.log(`   ${index + 1}. ${hint}`);
                });
            }
            
        } else {
            console.log('⚠️  没有找到有效的谜题数据');
            if (data.error) {
                console.log(`   错误信息: ${data.error}`);
            }
        }
        
        // 检查数据更新时间
        if (data.lastUpdated) {
            const updateTime = new Date(data.lastUpdated);
            const now = new Date();
            const timeDiff = Math.floor((now - updateTime) / (1000 * 60)); // 分钟差
            
            console.log('');
            console.log('⏰ 数据更新信息：');
            console.log(`   最后更新: ${updateTime.toLocaleString()}`);
            console.log(`   距离现在: ${timeDiff} 分钟前`);
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkTodayKVPuzzle().catch(console.error);