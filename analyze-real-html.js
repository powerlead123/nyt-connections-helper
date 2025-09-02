// 分析真实HTML结构，找到答案的确切位置
console.log('🔍 分析真实HTML结构...');

async function analyzeRealHtml() {
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-1-2025';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const html = data.contents;
        
        console.log(`HTML长度: ${html.length}`);
        
        // 查找包含"What is the answer to Connections today"的部分
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,2000}/i);
        
        if (answerSectionMatch) {
            console.log('\n✅ 找到答案部分！');
            const answerSection = answerSectionMatch[0];
            console.log('答案部分长度:', answerSection.length);
            
            // 清理HTML标签，保留结构
            const cleanSection = answerSection
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '');
            
            console.log('\n📝 清理后的答案部分:');
            console.log(cleanSection.substring(0, 1000) + '...');
            
            // 查找列表项
            const listItems = cleanSection.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
            console.log(`\n📋 找到 ${listItems.length} 个列表项:`);
            
            listItems.forEach((item, i) => {
                const cleanText = item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText.length > 10 && cleanText.length < 200) {
                    console.log(`${i+1}. ${cleanText}`);
                }
            });
            
            // 查找包含冒号的行（可能是答案格式）
            const colonLines = cleanSection.match(/[^<>\n]*:[^<>\n]*/g) || [];
            console.log(`\n📍 包含冒号的行 (${colonLines.length} 个):`);
            
            colonLines.forEach((line, i) => {
                const cleanLine = line.replace(/\s+/g, ' ').trim();
                if (cleanLine.length > 10 && cleanLine.length < 200 && 
                    !cleanLine.includes('http') && !cleanLine.includes('class') &&
                    !cleanLine.includes('data-') && !cleanLine.includes('style')) {
                    console.log(`${i+1}. ${cleanLine}`);
                }
            });
            
            // 查找strong标签内容
            const strongMatches = cleanSection.match(/<strong[^>]*>([^<]+)<\/strong>/gi) || [];
            console.log(`\n💪 Strong标签内容 (${strongMatches.length} 个):`);
            
            strongMatches.forEach((match, i) => {
                const text = match.replace(/<[^>]*>/g, '').trim();
                if (text.length > 2 && text.length < 100) {
                    console.log(`${i+1}. ${text}`);
                }
            });
            
        } else {
            console.log('❌ 未找到答案部分');
            
            // 尝试查找其他可能的标识
            const possibleSections = [
                /answer[\s\S]{0,500}/gi,
                /connections[\s\S]{0,500}/gi,
                /yellow[\s\S]{0,300}/gi,
                /green[\s\S]{0,300}/gi
            ];
            
            possibleSections.forEach((pattern, i) => {
                const matches = html.match(pattern) || [];
                console.log(`\n模式 ${i+1} 找到 ${matches.length} 个匹配`);
                matches.slice(0, 2).forEach((match, j) => {
                    const clean = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    console.log(`  ${j+1}. ${clean.substring(0, 150)}...`);
                });
            });
        }
        
    } catch (error) {
        console.error('❌ 分析失败:', error.message);
    }
}

analyzeRealHtml();