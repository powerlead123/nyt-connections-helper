// 分析Mashable页面结构，找到真正的游戏单词
async function analyzeMashableStructure() {
    console.log('🔍 分析Mashable页面结构...\n');
    
    const correctUrl = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-1-2025';
    
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(correctUrl)}`;
        const response = await fetch(proxyUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(30000)
        });
        
        if (response.ok) {
            const data = await response.json();
            const html = data.contents;
            
            console.log(`✅ 获取HTML成功: ${html.length} 字符\n`);
            
            // 根据颜色提示，我们知道答案应该是：
            // Yellow: Entrance/First appearance -> DEBUT, INTRODUCTION, LAUNCH, PREMIERE
            // Green: Days named after them -> MOTHER, PRESIDENT, SAINT, VALENTINE  
            // Blue: Way with words -> AUTHOR, POET, SPEAKER, WRITER
            // Purple: Cardinal -> BISHOP, CARDINAL, POPE, PRIEST
            
            const expectedWords = [
                'DEBUT', 'INTRODUCTION', 'LAUNCH', 'PREMIERE',
                'MOTHER', 'PRESIDENT', 'SAINT', 'VALENTINE',
                'AUTHOR', 'POET', 'SPEAKER', 'WRITER', 
                'BISHOP', 'CARDINAL', 'POPE', 'PRIEST'
            ];
            
            console.log('🎯 预期的游戏单词:');
            console.log(expectedWords.join(', '));
            
            console.log('\n🔍 在HTML中查找这些单词...');
            
            const foundWords = [];
            for (const word of expectedWords) {
                // 查找单词在HTML中的位置
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = [...html.matchAll(regex)];
                
                if (matches.length > 0) {
                    foundWords.push(word);
                    console.log(`✅ 找到 "${word}" - ${matches.length} 次`);
                    
                    // 查找单词周围的上下文
                    const firstMatch = matches[0];
                    const start = Math.max(0, firstMatch.index - 100);
                    const end = Math.min(html.length, firstMatch.index + word.length + 100);
                    const context = html.substring(start, end);
                    console.log(`   上下文: ...${context.replace(/\\s+/g, ' ')}...`);
                } else {
                    console.log(`❌ 未找到 "${word}"`);
                }
            }
            
            console.log(`\\n📊 统计: 找到 ${foundWords.length}/${expectedWords.length} 个单词`);
            
            if (foundWords.length >= 12) {
                console.log('\\n🎉 找到足够的单词！现在分析它们的HTML结构...');
                
                // 分析这些单词在HTML中的结构模式
                const patterns = [];
                
                for (const word of foundWords.slice(0, 4)) { // 只分析前4个
                    const regex = new RegExp(`<[^>]*>${word}<[^>]*>|<[^>]*>\\s*${word}\\s*<[^>]*>|\\b${word}\\b`, 'gi');
                    const matches = [...html.matchAll(regex)];
                    
                    if (matches.length > 0) {
                        const match = matches[0][0];
                        patterns.push(match);
                        console.log(`${word} 的HTML模式: ${match}`);
                    }
                }
                
                console.log('\\n🔧 建议的提取策略:');
                console.log('1. 直接搜索已知的游戏单词');
                console.log('2. 分析单词周围的HTML结构');
                console.log('3. 使用模式匹配提取相似结构的单词');
                
            } else {
                console.log('\\n⚠️ 找到的单词不够，可能需要调整搜索策略');
            }
            
        } else {
            console.log(`❌ 获取HTML失败: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ 分析失败: ${error.message}`);
    }
}

analyzeMashableStructure().catch(console.error);