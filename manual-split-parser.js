// 手动分割解析器
async function parseConnectionsAnswers() {
    console.log('=== 手动分割解析 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 找到答案区域
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            console.log('❌ 未找到答案区域');
            return null;
        }
        
        let answerSection = html.substring(startIndex + startMarker.length, endIndex);
        console.log('原始答案区域:', answerSection);
        
        // 清理文本
        answerSection = answerSection.replace(/\\"/g, '"').trim();
        console.log('清理后:', answerSection);
        
        const groups = [];
        
        // 手动分割已知的四个分组
        // 分组1: Curses
        if (answerSection.includes('Curses:')) {
            const start = answerSection.indexOf('Curses:') + 7;
            const end = answerSection.indexOf('In "A visit from St. Nicholas"');
            if (end > start) {
                const wordsText = answerSection.substring(start, end).trim();
                const words = wordsText.split(/,\s*/).filter(w => w.length > 0);
                groups.push({
                    category: 'Curses',
                    words: words
                });
                console.log('✅ Curses:', words);
            }
        }
        
        // 分组2: In "A visit from St. Nicholas"
        if (answerSection.includes('In "A visit from St. Nicholas":')) {
            const start = answerSection.indexOf('In "A visit from St. Nicholas":') + 31;
            const end = answerSection.indexOf('Worn by Earring Magic Ken');
            if (end > start) {
                const wordsText = answerSection.substring(start, end).trim();
                const words = wordsText.split(/,\s*/).filter(w => w.length > 0);
                groups.push({
                    category: 'In "A visit from St. Nicholas"',
                    words: words
                });
                console.log('✅ St. Nicholas:', words);
            }
        }
        
        // 分组3: Worn by Earring Magic Ken
        if (answerSection.includes('Worn by Earring Magic Ken:')) {
            const start = answerSection.indexOf('Worn by Earring Magic Ken:') + 26;
            const end = answerSection.indexOf('Starting with possessive determiners');
            if (end > start) {
                const wordsText = answerSection.substring(start, end).trim();
                const words = wordsText.split(/,\s*/).filter(w => w.length > 0);
                groups.push({
                    category: 'Worn by Earring Magic Ken',
                    words: words
                });
                console.log('✅ Earring Magic Ken:', words);
            }
        }
        
        // 分组4: Starting with possessive determiners
        if (answerSection.includes('Starting with possessive determiners:')) {
            const start = answerSection.indexOf('Starting with possessive determiners:') + 37;
            const wordsText = answerSection.substring(start).trim();
            const words = wordsText.split(/,\s*/).filter(w => w.length > 0);
            groups.push({
                category: 'Starting with possessive determiners',
                words: words
            });
            console.log('✅ Possessive determiners:', words);
        }
        
        console.log(`\n=== 解析完成，找到 ${groups.length} 个分组 ===`);
        
        const result = {
            date: '2024-09-02',
            groups: groups
        };
        
        console.log('\n=== JSON结果 ===');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

parseConnectionsAnswers();