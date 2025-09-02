// 搜索bullet point内容
async function searchBulletContent() {
    console.log('=== 搜索bullet point内容 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2024';
        console.log('获取URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.log('访问失败，状态:', response.status);
            return;
        }
        
        const html = await response.text();
        console.log('HTML长度:', html.length);
        
        // 搜索你截图中的具体内容
        const searchTerms = [
            'Curses',
            'EXPLETIVES',
            'FOUR-LETTER WORDS', 
            'PROFANITY',
            'SWEARING',
            'St. Nicholas',
            'CHRISTMAS',
            'HOUSE',
            'MOUSE', 
            'STIRRING',
            'Earring Magic Ken',
            'EARRING',
            'MESH SHIRT',
            'NECKLACE',
            'PLEATHER VEST',
            'possessive determiners',
            'HERRING',
            'HISTAMINE',
            'MYSTERY',
            'OUROBOROS'
        ];
        
        console.log('\n=== 搜索关键词 ===');
        const foundTerms = [];
        
        for (const term of searchTerms) {
            if (html.toLowerCase().includes(term.toLowerCase())) {
                foundTerms.push(term);
                console.log(`✅ 找到: ${term}`);
                
                // 显示上下文
                const index = html.toLowerCase().indexOf(term.toLowerCase());
                const start = Math.max(0, index - 50);
                const end = Math.min(html.length, index + term.length + 50);
                const context = html.substring(start, end);
                console.log(`   上下文: ...${context}...`);
            }
        }
        
        console.log(`\n总共找到 ${foundTerms.length}/${searchTerms.length} 个关键词`);
        
        if (foundTerms.length > 0) {
            console.log('\n=== 尝试提取包含这些词的区域 ===');
            
            // 找到第一个关键词的位置，然后提取周围的大段内容
            const firstTerm = foundTerms[0];
            const index = html.toLowerCase().indexOf(firstTerm.toLowerCase());
            const start = Math.max(0, index - 1000);
            const end = Math.min(html.length, index + 2000);
            const section = html.substring(start, end);
            
            console.log('提取的区域:');
            console.log(section);
            
            // 在这个区域中查找bullet point模式
            const bulletPatterns = [
                /•\s*([^:]+):\s*([^•\n]+)/g,
                /\u2022\s*([^:]+):\s*([^\u2022\n]+)/g,  // Unicode bullet
                /<li[^>]*>([^:]+):\s*([^<]+)<\/li>/g,
                /(?:^|\n)\s*•\s*([^:]+):\s*(.+?)(?=\n|$)/gm
            ];
            
            for (let i = 0; i < bulletPatterns.length; i++) {
                const matches = [...section.matchAll(bulletPatterns[i])];
                console.log(`\n模式 ${i+1} 找到 ${matches.length} 个匹配:`);
                matches.forEach((match, j) => {
                    console.log(`  ${j+1}. "${match[1]?.trim()}" -> "${match[2]?.trim()}"`);
                });
            }
        } else {
            console.log('\n❌ 没有找到任何关键词，可能需要不同的访问方式');
        }
        
    } catch (error) {
        console.error('搜索出错:', error);
    }
}

searchBulletContent();