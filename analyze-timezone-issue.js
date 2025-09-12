// 分析时区问题
function analyzeTimezoneIssue() {
    console.log('=== 时区问题分析 ===');
    
    // 1. 当前时间分析
    const now = new Date();
    console.log('\n--- 当前时间分析 ---');
    console.log('本地时间 (北京):', now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('UTC时间:', now.toISOString());
    console.log('美国东部时间 (ET):', now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    console.log('美国西部时间 (PT):', now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    // 2. 日期字符串分析
    console.log('\n--- 日期字符串分析 ---');
    const todayBeijing = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // YYYY-MM-DD
    const todayUTC = new Date().toISOString().split('T')[0];
    const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    
    console.log('北京日期:', todayBeijing);
    console.log('UTC日期:', todayUTC);
    console.log('美国东部日期:', todayET);
    
    // 3. GitHub Actions定时任务分析
    console.log('\n--- GitHub Actions定时任务分析 ---');
    console.log('配置的cron: "0 6 * * *"');
    console.log('这表示: 每天UTC时间06:00执行');
    console.log('对应北京时间: 14:00 (UTC+8)');
    console.log('对应美国东部时间: 02:00 (UTC-4/UTC-5)');
    
    // 4. NYT Connections发布时间分析
    console.log('\n--- NYT Connections发布时间分析 ---');
    console.log('NYT Connections通常在美国东部时间凌晨发布新谜题');
    console.log('大约在美国东部时间 00:00-03:00 之间');
    console.log('对应UTC时间: 04:00-07:00');
    console.log('对应北京时间: 12:00-15:00');
    
    // 5. Mashable文章发布时间分析
    console.log('\n--- Mashable文章发布时间分析 ---');
    console.log('Mashable的解答文章通常在NYT发布后几小时内发布');
    console.log('估计在美国东部时间 03:00-08:00 之间');
    console.log('对应UTC时间: 07:00-12:00');
    console.log('对应北京时间: 15:00-20:00');
    
    // 6. 当前定时任务问题分析
    console.log('\n--- 当前定时任务问题分析 ---');
    console.log('问题1: GitHub Actions在UTC 06:00执行');
    console.log('       此时可能Mashable文章还没发布');
    console.log('问题2: 我们的代码使用 new Date() 获取日期');
    console.log('       在不同时区可能得到不同的日期字符串');
    
    // 7. 建议的解决方案
    console.log('\n--- 建议的解决方案 ---');
    console.log('1. 调整GitHub Actions执行时间到UTC 12:00 (北京时间20:00)');
    console.log('2. 统一使用UTC时间来生成日期字符串');
    console.log('3. 或者使用美国东部时间来匹配NYT的发布时间');
    
    // 8. 测试不同时区的URL构建
    console.log('\n--- 测试URL构建 ---');
    
    const testDate = new Date('2025-09-12T10:00:00Z'); // UTC时间
    
    // 使用UTC日期
    const utcDate = testDate.toISOString().split('T')[0];
    console.log('UTC日期:', utcDate);
    
    // 使用美国东部时间日期
    const etDate = testDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    console.log('美国东部日期:', etDate);
    
    // 构建URL
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    
    const utcDateObj = new Date(utcDate);
    const utcUrl = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthNames[utcDateObj.getMonth()]}-${utcDateObj.getDate()}-${utcDateObj.getFullYear()}`;
    
    const etDateObj = new Date(etDate);
    const etUrl = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthNames[etDateObj.getMonth()]}-${etDateObj.getDate()}-${etDateObj.getFullYear()}`;
    
    console.log('基于UTC的URL:', utcUrl);
    console.log('基于ET的URL:', etUrl);
    console.log('URL是否相同:', utcUrl === etUrl);
}

// 运行分析
analyzeTimezoneIssue();