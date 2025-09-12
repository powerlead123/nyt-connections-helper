// 分析失败日期的具体内容格式
async function analyzeFailedDates() {
    console.log('🔍 分析失败日期的具体内容格式...\n');
    
    const dates = [
        { month: 'september', day: 8, year: 2025, name: '9月8日' },
        { month: 'september', day: 6, year: 2025, name: '9月6日' }
    ];
    
    for (const date of dates) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🎯 分析 ${date.name}`);
        console.log(`${'='.repeat(50)}`);
        
        try {
            const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${date.month}-${date.day}-${date.year}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const html = await response.text();
            
            // 获取答案区域
            const answerAreaStart = html.indexOf('What is the answer to Connections today');
            const answerArea = html.substring(answerAreaStart, answerAreaStart + 800);
            
            console.log('答案区域内容:');
            console.log(answerArea);
            console.log('\n');
            
            // 逐字符分析前200个字符
            console.log('前200个字符的逐字符分析:');
            for (let i = 0; i < Math.min(200, answerArea.length); i++) {
                const char = answerArea[i];
                const code = char.charCodeAt(0);
                if (char === '"' || char === "'" || char === '\\' || code === 92 || code === 34) {
                    console.log(`${i}: "${char}" (${code}) ← 特殊字符`);
                }
            }
            
        } catch (error) {
            console.error(`❌ ${date.name} 分析出错:`, error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

analyzeFailedDates();