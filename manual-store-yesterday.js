// 手动存储昨天的数据到KV
console.log('📦 手动存储昨天的数据...');

// 昨天的数据（从之前的解析结果复制）
const yesterdayData = {
  "date": "2025-09-22",
  "timestamp": "2025-09-23T07:27:46.672Z",
  "words": [
    "AREA",
    "LENGTH",
    "PERIMETER",
    "VOLUME",
    "CROSSWORD",
    "DOMINO",
    "ORCA",
    "OREO",
    "ARIA",
    "ENCORE",
    "EXCALIBUR",
    "LUXOR",
    "ARS",
    "AYES",
    "EASE",
    "OWES"
  ],
  "groups": [
    {
      "theme": "Basic geometric calculations",
      "words": [
        "AREA",
        "LENGTH",
        "PERIMETER",
        "VOLUME"
      ],
      "difficulty": "yellow",
      "hint": "Basic geometric calculations"
    },
    {
      "theme": "Black-and-white things",
      "words": [
        "CROSSWORD",
        "DOMINO",
        "ORCA",
        "OREO"
      ],
      "difficulty": "green",
      "hint": "Black-and-white things"
    },
    {
      "theme": "Las Vegas casino hotels",
      "words": [
        "ARIA",
        "ENCORE",
        "EXCALIBUR",
        "LUXOR"
      ],
      "difficulty": "blue",
      "hint": "Las Vegas casino hotels"
    },
    {
      "theme": "Words that sounds like plural letters",
      "words": [
        "ARS",
        "AYES",
        "EASE",
        "OWES"
      ],
      "difficulty": "purple",
      "hint": "Words that sounds like plural letters"
    }
  ],
  "source": "Mashable (Manual Emergency Store)"
};

async function manualStoreYesterday() {
    try {
        console.log('存储日期:', yesterdayData.date);
        console.log('数据完整性检查:');
        console.log('- 单词数量:', yesterdayData.words.length);
        console.log('- 分组数量:', yesterdayData.groups.length);
        console.log('- 每组单词数:', yesterdayData.groups.map(g => g.words.length));
        
        const response = await fetch('https://nyt-connections-helper.pages.dev/api/manual-store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                secret: 'emergency-manual-store-2025',
                date: yesterdayData.date,
                data: yesterdayData
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('🎉 存储成功！');
            console.log('结果:', result.message);
            
            // 验证存储结果
            console.log('\n🔍 验证存储结果...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
            
            const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
            const todayData = await todayResponse.json();
            
            if (todayData.success) {
                console.log('✅ 验证成功！网站现在有可用数据了:');
                console.log('- 显示日期:', todayData.actualDate);
                console.log('- 数据源:', todayData.source);
                console.log('- 新鲜度:', todayData.freshness);
                console.log('- 单词数量:', todayData.words?.length);
            } else {
                console.log('❌ 验证失败，数据可能没有正确存储');
                console.log('错误:', todayData.message);
            }
            
        } else {
            console.log('❌ 存储失败');
            console.log('状态:', response.status);
            console.log('错误:', result.error || result.message);
        }
        
    } catch (error) {
        console.log('❌ 操作失败:', error.message);
    }
}

manualStoreYesterday();