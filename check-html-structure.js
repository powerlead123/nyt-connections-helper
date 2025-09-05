// 检查HTML结构，看分组是否在不同元素中
async function checkHtmlStructure() {
    console.log('=== 检查HTML结构 ===');
    
    try {
        const url = 'https://mashable.com/article/nyt-connections-hint-answer-today-september-2-2025';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 查找包含EXPLETIVES的HTML结构
        const expletivesIndex = html.indexOf('EXPLETIVES');
        if (expletivesIndex !== -1) {
            console.log('\\n=== EXPLETIVES周围的HTML结构 ===');
            
            // 提取EXPLETIVES前后各500字符的HTML
            const start = Math.max(0, expletivesIndex - 500);
            const end = Math.min(html.length, expletivesIndex + 500);
            const context = html.substring(start, end);
            
            console.log('HTML上下文:');
            console.log(context);
            
            // 查找可能的容器标签
            const containerPatterns = [
                /<(div|p|span|li|ul|ol)[^>]*>[^<]*EXPLETIVES[^<]*<\/\1>/gi,
                /<(div|p|span|li)[^>]*>[\s\S]*?EXPLETIVES[\s\S]*?<\/\1>/gi
            ];
            
            for (let i = 0; i < containerPatterns.length; i++) {
                const matches = context.match(containerPatterns[i]);
                if (matches) {
                    console.log(`\\n模式 ${i + 1} 找到容器:`, matches);
                }
            }
        }
        
        // 查找包含所有分组的更大HTML结构
        console.log('\\n=== 查找包含所有答案的HTML结构 ===');
        
        const startMarker = 'Curses';
        const endMarker = 'OUROBOROS';
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker);
        
        if (startIndex !== -1 && endIndex !== -1) {
            // 扩展范围以包含HTML标签
            const expandedStart = Math.max(0, startIndex - 200);
            const expandedEnd = Math.min(html.length, endIndex + 200);
            
            const fullContext = html.substring(expandedStart, expandedEnd);
            console.log('\\n完整答案区域的HTML:');
            console.log(fullContext);
            
            // 查找列表结构
            console.log('\\n=== 查找列表结构 ===');
            
            const listPatterns = [
                /<ul[^>]*>[\s\S]*?<\/ul>/gi,
                /<ol[^>]*>[\s\S]*?<\/ol>/gi,
                /<li[^>]*>[\s\S]*?<\/li>/gi
            ];
            
            for (let i = 0; i < listPatterns.length; i++) {
                const matches = fullContext.match(listPatterns[i]);
                if (matches) {
                    console.log(`\\n找到列表结构 ${i + 1}:`, matches);
                }
            }
            
            // 查找可能的分组容器
            console.log('\\n=== 查找分组容器 ===');
            
            const groupPatterns = [
                /<(div|p|span)[^>]*>[^<]*Curses[^<]*<\/\1>/gi,
                /<(div|p|span)[^>]*>[^<]*In "A visit[^<]*<\/\1>/gi,
                /<(div|p|span)[^>]*>[^<]*Worn by[^<]*<\/\1>/gi,
                /<(div|p|span)[^>]*>[^<]*Starting with[^<]*<\/\1>/gi
            ];
            
            for (let i = 0; i < groupPatterns.length; i++) {
                const matches = fullContext.match(groupPatterns[i]);
                if (matches) {
                    console.log(`\\n分组 ${i + 1} 的容器:`, matches);
                } else {
                    console.log(`\\n分组 ${i + 1}: 未找到独立容器`);
                }
            }
        }
        
    } catch (error) {
        console.error('检查出错:', error);
    }
}

checkHtmlStructure();