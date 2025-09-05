// 简单通用解析器
async function testSimpleParser() {
    console.log('=== 简单通用解析器 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        const answerSectionMatch = html.match(/What is the answer to Connections today[\s\S]{0,1500}/i);
        
        if (!answerSectionMatch) {
            console.log('❌ 未找到答案区域');
            return;
        }
        
        let answerSection = answerSectionMatch[0];
        console.log('原始答案区域:');
        console.log(answerSection.substring(0, 300));
        
        // 清理文本，移除开头
        answerSection = answerSection.replace(/What is the answer to Connections today/i, '');
        
        console.log('\n清理后的文本:');
        console.log(answerSection.substring(0, 300));
        
        // 最简单的方法：直接查找所有包含冒号的片段
        console.log('\n=== 查找冒号片段 ===');
        
        // 按可能的分隔符分割
        const segments = answerSection.split(/(?=[A-Z][a-z].*?:)|(?=Don't)/);
        
        console.log(`分割成 ${segments.length} 个片段:`);
        segments.forEach((segment, i) => {
            if (segment.trim().length > 0) {
                console.log(`片段 ${i}: "${segment.trim().substring(0, 100)}"`);
            }
        });
        
        // 查找包含冒号的有效片段
        const validSegments = segments.filter(segment => 
            segment.includes(':') && 
            segment.match(/[A-Z]{3,}/) && 
            !segment.includes("Don't")
        );
        
        console.log(`\n找到 ${validSegments.length} 个有效片段:`);
        
        const groups = [];
        
        for (const segment of validSegments) {
            const colonIndex = segment.indexOf(':');
            if (colonIndex === -1) continue;
            
            const category = segment.substring(0, colonIndex).trim();
            const wordsText = segment.substring(colonIndex + 1).trim();
            
            console.log(`分析片段: "${category}" -> "${wordsText.substring(0, 50)}"`);
            
            // 提取单词
            const words = [];
            const wordMatches = wordsText.match(/[A-Z][A-Z\s\-"']*?(?=,|$|[A-Z][a-z])/g) || [];
            
            for (const wordMatch of wordMatches) {
                const cleanWord = wordMatch.trim().replace(/,$/, '');
                if (cleanWord.length > 0 && /^[A-Z\s\-"']+$/.test(cleanWord)) {
                    words.push(cleanWord);
                    if (words.length >= 4) break; // 只要前4个
                }
            }
            
            if (words.length >= 4) {
                groups.push({
                    category: category,
                    words: words.slice(0, 4)
                });
                console.log(`✅ "${category}": ${words.slice(0, 4).join(', ')}`);
            } else {
                console.log(`❌ "${category}" 只有 ${words.length} 个单词: ${words.join(', ')}`);
            }
        }
        
        console.log(`\n总共解析出 ${groups.length} 个组`);
        
        if (groups.length >= 4) {
            console.log('\n🎉 解析成功！');
            const result = {
                date: '2025-09-02',
                words: groups.slice(0, 4).flatMap(g => g.words),
                groups: groups.slice(0, 4).map((group, index) => ({
                    theme: group.category,
                    words: group.words,
                    difficulty: ['yellow', 'green', 'blue', 'purple'][index],
                    hint: `These words are related to "${group.category}"`
                })),
                source: 'Mashable (Universal Parser)'
            };
            
            console.log('\n最终结果:');
            result.groups.forEach((group, i) => {
                console.log(`${i+1}. ${group.theme}: ${group.words.join(', ')}`);
            });
        } else {
            console.log('\n❌ 解析失败，只找到', groups.length, '个组');
        }
        
    } catch (error) {
        console.error('测试出错:', error);
    }
}

testSimpleParser();