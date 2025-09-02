// 分析9月2日的内容
console.log('🔍 分析9月2日的HTML内容...');

async function analyzeSept2Content() {
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        console.log('📥 获取内容...');
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents;
        
        console.log(`HTML长度: ${html.length}`);
        
        // 查找所有可能的答案模式
        console.log('\n🔍 查找答案模式...');
        
        // 模式1: <strong>category:</strong> words
        const pattern1 = /<strong>([^<]+):<\/strong>\s*([^<\n]+)/gi;
        const matches1 = [...html.matchAll(pattern1)];
        console.log(`模式1找到 ${matches1.length} 个匹配:`);
        matches1.forEach((match, i) => {
            console.log(`  ${i+1}. ${match[1]}: ${match[2].substring(0, 50)}...`);
        });
        
        // 模式2: 查找包含颜色的部分
        const colorPattern = /(Yellow|Green|Blue|Purple)[\s\S]{0,200}/gi;
        const colorMatches = [...html.matchAll(colorPattern)];
        console.log(`\n颜色模式找到 ${colorMatches.length} 个匹配:`);
        colorMatches.slice(0, 5).forEach((match, i) => {
            console.log(`  ${i+1}. ${match[0].substring(0, 80)}...`);
        });
        
        // 模式3: 查找列表项
        const listPattern = /<li[^>]*>[\s\S]*?<\/li>/gi;
        const listMatches = [...html.matchAll(listPattern)];
        console.log(`\n列表项找到 ${listMatches.length} 个匹配`);
        
        // 查找包含答案的列表项
        const answerLists = listMatches.filter(match => {
            const text = match[0].toLowerCase();
            return text.includes('answer') || text.includes(':') || 
                   text.includes('yellow') || text.includes('green') ||
                   text.includes('blue') || text.includes('purple');
        });
        
        console.log(`包含答案的列表项: ${answerLists.length} 个`);
        answerLists.slice(0, 8).forEach((match, i) => {
            const cleanText = match[0].replace(/<[^>]*>/g, ' ').trim();
            console.log(`  ${i+1}. ${cleanText.substring(0, 100)}...`);
        });
        
        // 模式4: 查找包含"answer"的段落
        const answerSections = html.match(/answer[\s\S]{0,800}/gi) || [];
        console.log(`\n包含"answer"的部分: ${answerSections.length} 个`);
        answerSections.slice(0, 3).forEach((section, i) => {
            console.log(`\n答案部分 ${i+1}:`);
            const cleanText = section.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
            console.log(cleanText.substring(0, 300) + '...');
        });
        
        // 查找特定的单词模式
        console.log('\n🔍 查找单词模式...');
        const wordPattern = /\b[A-Z]{3,12}\b/g;
        const allWords = html.match(wordPattern) || [];
        const uniqueWords = [...new Set(allWords)];
        
        console.log(`找到 ${uniqueWords.length} 个独特的大写单词`);
        console.log('前20个:', uniqueWords.slice(0, 20).join(', '));
        
    } catch (error) {
        console.error('❌ 分析失败:', error.message);
    }
}

analyzeSept2Content();