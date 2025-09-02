// 检查URL构建逻辑
function checkUrlLogic() {
    console.log('=== 检查URL构建逻辑 ===');
    
    const today = new Date();
    console.log('当前日期对象:', today);
    console.log('ISO字符串:', today.toISOString());
    console.log('日期字符串:', today.toDateString());
    
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    
    const monthName = monthNames[today.getMonth()];
    const dayNum = today.getDate();
    const year = today.getFullYear();
    const dateStr = today.toISOString().split('T')[0];
    
    console.log('\n=== URL构建参数 ===');
    console.log('月份索引:', today.getMonth());
    console.log('月份名称:', monthName);
    console.log('日期:', dayNum);
    console.log('年份:', year);
    console.log('ISO日期:', dateStr);
    
    console.log('\n=== 可能的URL格式 ===');
    const urls = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${dayNum}-${year}`,
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${dayNum}-2025`,
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${dayNum}`,
        `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${dayNum}-${year}`,
        `https://mashable.com/article/connections-hint-answer-today-${monthName}-${dayNum}-${year}`
    ];
    
    urls.forEach((url, i) => {
        console.log(`${i+1}. ${url}`);
    });
    
    // 检查当前系统时间是否正确
    console.log('\n=== 系统时间检查 ===');
    console.log('当前时间戳:', Date.now());
    console.log('UTC时间:', new Date().toUTCString());
    console.log('本地时间:', new Date().toLocaleString());
}

checkUrlLogic();