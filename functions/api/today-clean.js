// 简化的API - 使用我们成功的解析器
export async function onRequest(context) {
    // 使用我们成功的hint-based解析器
    const today = new Date();
    const year = today.getFullYear();
    const month = today.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const day = today.getDate();
    
    const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${month}-${day}-${year}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // 提取提示区域的分组名称
        const hints = [];
        const correctHintMatch = html.match(/Today's connections fall into the following categories:(.*?)(?=Looking|Ready|$)/i);
        
        if (correctHintMatch) {
            const hintText = correctHintMatch[1];
            const correctPatterns = [
                /Yellow:\s*(.*?)Green:/i,
                /Green:\s*(.*?)Blue:/i,  
                /Blue:\s*(.*?)Purple:/i,
                /Purple:\s*(.*?)(?:Looking|Ready|$)/i
            ];
            
            for (const pattern of correctPatterns) {
                const match = hintText.match(pattern);
                if (match) {
                    hints.push(match[1].trim());
                }
            }
        }
        
        if (hints.length < 4) {
            throw new Error('无法提取完整的分组名称');
        }
        
        // 提取答案区域
        const startMarker = 'What is the answer to Connections today';
        const endMarker = "Don't feel down if you didn't manage to guess it this time";
        
        const startIndex = html.indexOf(startMarker);
        const endIndex = html.indexOf(endMarker, startIndex);
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('无法找到答案区域');
        }
        
        let answerText = html.substring(startIndex + startMarker.length, endIndex);
        answerText = answerText.replace(/\\"/g, '"').trim();
        
        // 基于提示名称解析分组
        const groups = [];
        
        for (let i = 0; i < hints.length; i++) {
            const currentHint = hints[i];
            const nextHint = i < hints.length - 1 ? hints[i + 1] : null;
            
            // 转义正则表达式特殊字符
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            let pattern;
            if (nextHint) {
                pattern = new RegExp(escapeRegex(currentHint) + ':\\s*(.*?)(?=' + escapeRegex(nextHint) + ':|$)', 'i');
            } else {
                pattern = new RegExp(escapeRegex(currentHint) + ':\\s*(.*?)$', 'i');
            }
            
            const match = answerText.match(pattern);
            
            if (match) {
                const wordsText = match[1].trim();
                const words = wordsText.split(',')
                    .map(word => word.trim())
                    .filter(word => word && /^[A-Z]/.test(word))
                    .slice(0, 4);
                
                if (words.length >= 4) {
                    groups.push({
                        category: currentHint,
                        words: words
                    });
                }
            }
        }
        
        if (groups.length < 4) {
            throw new Error('解析的分组数量不足');
        }
        
        return new Response(JSON.stringify({
            date: today.toISOString().split('T')[0],
            groups: groups.slice(0, 4)
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('解析出错:', error);
        // 如果解析失败，返回错误信息
        return new Response(JSON.stringify({
            date: today.toISOString().split('T')[0],
            error: '无法获取今日谜题，请稍后重试',
            groups: []
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}