// 真正通用的解析器
async function trulyUniversalParser() {
    console.log('=== 真正通用的解析器 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 查找答案区域
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,1500}/i);
        
        if (!answerSectionMatch) {
            console.log('❌ 未找到答案区域');
            return;
        }
        
        let answerSection = answerSectionMatch[0];
        
        // 清理：移除开头，只保留到Don't之前
        answerSection = answerSection.replace(/What is the answer to Connections today/i, '');
        const dontIndex = answerSection.indexOf("Don't");
        if (dontIndex !== -1) {
            answerSection = answerSection.substring(0, dontIndex);
        }
        
        console.log('清理后的文本:');
        console.log(`"${answerSection}"`);
        
        // 通用解析策略：基于bullet point格式
        console.log('\n=== 通用bullet point解析 ===');
        
        // 策略1: 查找所有bullet point符号
        const bulletSymbols = ['•', '●', '◦', '▪', '▫', '‣'];
        let usedSymbol = null;
        
        for (const symbol of bulletSymbols) {
            if (answerSection.includes(symbol)) {
                usedSymbol = symbol;
                console.log(`找到bullet符号: "${symbol}"`);
                break;
            }
        }
        
        let groups = [];
        
        if (usedSymbol) {
            // 按bullet符号分割
            const bulletSections = answerSection.split(usedSymbol).filter(s => s.trim().length > 0);
            console.log(`按"${usedSymbol}"分割成 ${bulletSections.length} 个部分`);
            
            for (let i = 0; i < bulletSections.length; i++) {
                const section = bulletSections[i].trim();
                console.log(`\n处理部分 ${i + 1}: "${section.substring(0, 50)}..."`);
                
                // 查找冒号
                const colonIndex = section.indexOf(':');
                if (colonIndex === -1) {
                    console.log('  ❌ 未找到冒号');
                    continue;
                }
                
                const category = section.substring(0, colonIndex).trim();
                const wordsText = section.substring(colonIndex + 1).trim();
                
                console.log(`  分组名称: "${category}"`);
                console.log(`  单词文本: "${wordsText}"`);
                
                // 提取单词
                const words = wordsText
                    .split(',')
                    .map(w => w.trim().toUpperCase())
                    .filter(w => w.length > 0 && /^[A-Z\s\-"'0-9]+$/.test(w))
                    .slice(0, 4);
                
                if (words.length >= 4) {
                    groups.push({ category, words });
                    console.log(`  ✅ "${category}": ${words.join(', ')}`);
                } else {
                    console.log(`  ❌ 只有 ${words.length} 个单词: ${words.join(', ')}`);
                }
            }
        }
        
        // 策略2: 如果没有bullet符号，尝试基于冒号的通用解析
        if (groups.length < 4) {
            console.log('\n=== 备用策略：基于冒号解析 ===');
            
            // 通用正则：查找 [任意文本]: [4个大写单词]
            const universalPattern = /([^:]+?):\s*([A-Z][A-Z\s\-"'0-9,]*?(?:,\s*[A-Z][A-Z\s\-"'0-9]*?){3})/g;
            const matches = [...answerSection.matchAll(universalPattern)];
            
            console.log(`通用模式找到 ${matches.length} 个匹配`);
            
            groups = []; // 重置
            
            for (const match of matches) {
                if (groups.length >= 4) break;
                
                const category = match[1].trim();
                const wordsText = match[2].trim();
                
                // 过滤掉明显不是分组名称的内容
                if (category.length > 100 || category.includes('http') || category.includes('script')) {
                    continue;
                }
                
                const words = wordsText
                    .split(',')
                    .map(w => w.trim().toUpperCase())
                    .filter(w => w.length > 0 && /^[A-Z\s\-"'0-9]+$/.test(w))
                    .slice(0, 4);
                
                if (words.length >= 4) {
                    groups.push({ category, words });
                    console.log(`  ✅ "${category}": ${words.join(', ')}`);
                }
            }
        }
        
        console.log(`\n总共解析出 ${groups.length} 个组`);
        
        if (groups.length >= 4) {
            console.log('\n🎉 通用解析成功！');
            
            const finalGroups = groups.slice(0, 4);
            finalGroups.forEach((group, i) => {
                console.log(`${i + 1}. "${group.category}": ${group.words.join(', ')}`);
            });
            
            // 生成最终结果
            const result = {
                date: '2025-09-02',
                words: finalGroups.flatMap(g => g.words),
                groups: finalGroups.map((group, index) => ({
                    theme: group.category,
                    words: group.words,
                    difficulty: ['yellow', 'green', 'blue', 'purple'][index],
                    hint: `These words are related to "${group.category}"`
                })),
                source: 'Mashable (Universal Parser)'
            };
            
            console.log('\n最终结果:');
            console.log(JSON.stringify(result, null, 2));
            
            return result;
        } else {
            console.log('\n❌ 通用解析失败');
            return null;
        }
        
    } catch (error) {
        console.error('解析出错:', error);
        return null;
    }
}

trulyUniversalParser();