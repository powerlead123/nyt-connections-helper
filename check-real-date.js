// 检查真实日期问题
console.log('🗓️ 检查日期问题...');

const now = new Date();
console.log('系统时间:', now.toISOString());
console.log('系统年份:', now.getFullYear());

// NYT Connections是2023年6月开始的，不可能有2025年的数据
if (now.getFullYear() > 2024) {
    console.log('❌ 发现问题：系统时间是2025年，但NYT Connections不可能有2025年的数据！');
    console.log('💡 解决方案：');
    console.log('1. 使用2024年的最新日期');
    console.log('2. 或者修改系统时间');
    
    // 测试2024年的最新日期
    const testDate = new Date('2024-12-31');
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthName = monthNames[testDate.getMonth()];
    const day = testDate.getDate();
    const year = testDate.getFullYear();
    
    const testUrl = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
    console.log('测试2024年URL:', testUrl);
    
    // 或者测试今天但是2024年
    const today2024 = new Date();
    today2024.setFullYear(2024);
    const monthName2024 = monthNames[today2024.getMonth()];
    const day2024 = today2024.getDate();
    
    const todayUrl2024 = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName2024}-${day2024}-2024`;
    console.log('今天但2024年URL:', todayUrl2024);
    
} else {
    console.log('✅ 日期正常');
}