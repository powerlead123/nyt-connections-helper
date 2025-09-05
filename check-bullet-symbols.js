// 检查HTML中是否有bullet point符号
async function checkBulletSymbols() {
    console.log('=== 检查bullet point符号 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        console.log('HTML长度:', html.length);
        
        // 检查各种bullet point符号
        const bulletSymbols = ['•', '●', '◦', '▪', '▫', '‣', '⁃', '◾', '◽', '▴', '▸'];
        
        console.log('\n=== 检查bullet符号 ===');
        for (const symbol of bulletSymbols) {
            const count = (html.match(new RegExp(symbol, 'g')) || []).length;
            if (count > 0) {
                console.log(`✅ 找到 "${symbol}" ${count} 次`);
                
                // 显示包含这个符号的上下文
                const index = html.indexOf(symbol);
                if (index !== -1) {
                    const context = html.substring(index - 50, index + 100);
                    console.log(`   上下文: ...${context}...`);
                }
            } else {
                console.log(`❌ 未找到 "${symbol}"`);
            }
        }
        
        // 检查HTML列表标签
        console.log('\n=== 检查HTML列表 ===');
        const listItems = html.match(/<li[^>]*>.*?<\/li>/g) || [];
        console.log(`找到 ${listItems.length} 个 <li> 标签`);
        
        if (listItems.length > 0) {
            console.log('前几个列表项:');
            listItems.slice(0, 5).forEach((item, i) => {
                console.log(`${i + 1}. ${item.substring(0, 100)}...`);
            });
        }
        
        // 检查答案区域中是否有bullet符号
        console.log('\n=== 检查答案区域 ===');
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,1500}/i);
        
        if (answerSectionMatch) {
            const answerSection = answerSectionMatch[0];
            console.log('答案区域长度:', answerSection.length);
            
            for (const symbol of bulletSymbols) {
                if (answerSection.includes(symbol)) {
                    console.log(`✅ 答案区域包含 "${symbol}"`);
                    
                    // 按这个符号分割
                    const parts = answerSection.split(symbol);
                    console.log(`按 "${symbol}" 分割成 ${parts.length} 部分:`);
                    parts.forEach((part, i) => {
                        if (part.trim().length > 0) {
                            console.log(`  部分 ${i}: "${part.trim().substring(0, 50)}..."`);
                        }
                    });
                    break;
                }
            }
        }
        
    } catch (error) {
        console.error('检查出错:', error);
    }
}

checkBulletSymbols();