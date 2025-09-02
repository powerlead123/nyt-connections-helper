// 实际提取9月1日网站文章的单词
console.log('🔍 实际提取9月1日网站文章...');

async function extractRealSept1() {
    try {
        // 9月1日的URL
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-1-2025';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        console.log('📥 获取9月1日文章...');
        console.log('URL:', url);
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            console.log('❌ 获取失败:', response.status);
            return;
        }
        
        const data = await response.json();
        const html = data.contents;
        
        console.log(`✅ 获取成功，HTML长度: ${html.length}`);
        
        // 使用我们的通用解析函数
        function extractConnectionsWords(html) {
            console.log('Extracting Connections words from structured content...');
            
            // 查找包含答案的结构化列表 - 支持多种格式
            const patterns = [
                /<strong>([^<]+):<\/strong>\s*([^<\n]+)/gi,  // 标准格式
                /<b>([^<]+):<\/b>\s*([^<\n]+)/gi,           // 粗体格式
                /([^:]+):\s*([A-Z][^<\n]+)/gi               // 简单格式
            ];
            
            let answerMatches = [];
            
            // 尝试不同的模式
            for (const pattern of patterns) {
                answerMatches = [...html.matchAll(pattern)];
                if (answerMatches.length >= 4) break;
            }
            
            console.log(`Found ${answerMatches.length} structured answer groups`);
            
            const groupedWords = [];
            
            // 从结构化答案中提取，保持分组
            answerMatches.forEach((match, i) => {
                const category = match[1].trim();
                const wordsText = match[2].trim();
                
                console.log(`Group ${i+1}: ${category} -> ${wordsText}`);
                
                // 提取单词，处理各种格式
                const words = wordsText.split(',').map(w => w.trim()).filter(w => w.length > 0);
                
                const cleanWords = [];
                words.forEach(wordPhrase => {
                    // 支持各种格式：大写字母、数字、连字符、引号、&符号等
                    if (wordPhrase.match(/^[A-Z0-9\s\-"'&\.]+$/)) {
                        cleanWords.push(wordPhrase);
                    }
                });
                
                if (cleanWords.length > 0) {
                    groupedWords.push({
                        category: category,
                        words: cleanWords
                    });
                }
            });
            
            console.log(`Extracted ${groupedWords.length} groups`);
            return groupedWords;
        }
        
        // 解析数据
        const extractedData = extractConnectionsWords(html);
        
        if (extractedData && extractedData.length >= 4) {
            console.log('\n✅ 成功解析9月1日数据！');
            console.log('📊 实际解析出的单词:');
            
            extractedData.slice(0, 4).forEach((group, index) => {
                const colors = ['YELLOW', 'GREEN', 'BLUE', 'PURPLE'];
                console.log(`${colors[index]}: ${group.words.join(', ')}`);
            });
            
            console.log('\n🎯 你之前提供的正确答案:');
            console.log('YELLOW: DEBUT, INTRODUCTION, LAUNCH, PREMIERE');
            console.log('GREEN: MOTHER, PRESIDENT, SAINT PATRICK, SAINT VALENTINE');
            console.log('BLUE: BISHOP, BURNS, LORDE, POPE');
            console.log('PURPLE: BIRD, CLERGY MEMBER, M.L.B. PLAYER, N.F.L. PLAYER');
            
            // 对比分析
            console.log('\n🔍 对比分析:');
            const expectedGroups = [
                ['DEBUT', 'INTRODUCTION', 'LAUNCH', 'PREMIERE'],
                ['MOTHER', 'PRESIDENT', 'SAINT PATRICK', 'SAINT VALENTINE'],
                ['BISHOP', 'BURNS', 'LORDE', 'POPE'],
                ['BIRD', 'CLERGY MEMBER', 'M.L.B. PLAYER', 'N.F.L. PLAYER']
            ];
            
            extractedData.slice(0, 4).forEach((group, i) => {
                const expected = expectedGroups[i];
                const actual = group.words;
                const colors = ['YELLOW', 'GREEN', 'BLUE', 'PURPLE'];
                
                const matches = JSON.stringify(actual.sort()) === JSON.stringify(expected.sort());
                console.log(`${colors[i]}组匹配: ${matches ? '✅' : '❌'}`);
                
                if (!matches) {
                    console.log(`  期望: ${expected.join(', ')}`);
                    console.log(`  实际: ${actual.join(', ')}`);
                }
            });
            
        } else {
            console.log('❌ 解析失败，未找到足够的分组');
            
            // 尝试查找原始HTML中的关键信息
            console.log('\n🔍 查找HTML中的关键信息...');
            
            // 查找包含"answer"的部分
            const answerSections = html.match(/answer[\s\S]{0,500}/gi) || [];
            console.log(`找到 ${answerSections.length} 个包含"answer"的部分`);
            
            answerSections.slice(0, 2).forEach((section, i) => {
                console.log(`\n答案部分 ${i+1}:`);
                const cleanText = section.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
                console.log(cleanText.substring(0, 200) + '...');
            });
        }
        
    } catch (error) {
        console.error('❌ 提取失败:', error.message);
    }
}

extractRealSept1();