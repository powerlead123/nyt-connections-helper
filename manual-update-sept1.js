// 手动更新9月1日的数据
async function manualUpdateSept1() {
    console.log('🔧 手动更新9月1日数据...\n');
    
    // 根据Mashable网站的正确答案
    const correctData = {
        date: '2025-09-01',
        words: [
            // Yellow: Entrance/First appearance
            'DEBUT', 'INTRODUCTION', 'LAUNCH', 'PREMIERE',
            // Green: There are days named after them (holidays)
            'MOTHER', 'PRESIDENT', 'SAINT', 'VALENTINE',
            // Blue: They have a way with words
            'AUTHOR', 'POET', 'SPEAKER', 'WRITER',
            // Purple: A red bird/What "Cardinal" might refer to
            'BISHOP', 'CARDINAL', 'POPE', 'PRIEST'
        ],
        groups: [
            {
                theme: 'First appearance',
                words: ['DEBUT', 'INTRODUCTION', 'LAUNCH', 'PREMIERE'],
                difficulty: 'yellow',
                hint: 'First appearance'
            },
            {
                theme: 'Ones celebrated with holidays',
                words: ['MOTHER', 'PRESIDENT', 'SAINT', 'VALENTINE'],
                difficulty: 'green',
                hint: 'There are days named after them'
            },
            {
                theme: 'They have a way with words',
                words: ['AUTHOR', 'POET', 'SPEAKER', 'WRITER'],
                difficulty: 'blue',
                hint: 'They have a way with words'
            },
            {
                theme: 'What "Cardinal" might refer to',
                words: ['BISHOP', 'CARDINAL', 'POPE', 'PRIEST'],
                difficulty: 'purple',
                hint: 'A red bird'
            }
        ],
        source: 'Mashable (Manual Update)'
    };
    
    console.log('✅ 准备更新数据:');
    console.log(`日期: ${correctData.date}`);
    console.log(`来源: ${correctData.source}`);
    console.log('分组:');
    correctData.groups.forEach((group, i) => {
        console.log(`${i+1}. ${group.difficulty.toUpperCase()}: ${group.theme} - ${group.words.join(', ')}`);
    });
    
    // 调用refresh API来更新
    const DOMAIN = 'nyt-connections-helper.pages.dev';
    
    try {
        console.log('\\n🔄 调用refresh API...');
        const response = await fetch(`https://${DOMAIN}/api/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ manualData: correctData })
        });
        
        console.log(`状态: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('\\n📋 API响应:');
            console.log(`成功: ${result.success}`);
            console.log(`消息: ${result.message}`);
            
            if (result.success) {
                console.log('\\n🎉 数据更新成功！');
            } else {
                console.log('\\n⚠️ 更新失败，但API调用成功');
            }
        } else {
            console.log(`\\n❌ API调用失败: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`\\n❌ 更新失败: ${error.message}`);
    }
}

manualUpdateSept1().catch(console.error);