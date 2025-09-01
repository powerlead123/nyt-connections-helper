// Cloudflare Pages Function for manual refresh
export async function onRequest(context) {
    const { request, env } = context;
    
    // 只允许POST请求
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        console.log('Manual refresh triggered');
        
        const today = new Date().toISOString().split('T')[0];
        
        // 强制获取新数据
        const freshData = await forceFetchFreshData();
        
        if (freshData && freshData.groups && freshData.groups.length === 4) {
            console.log('Fresh data obtained successfully');
            
            // 保存到KV存储
            if (env.CONNECTIONS_KV) {
                try {
                    await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(freshData), {
                        expirationTtl: 86400 // 24小时过期
                    });
                    console.log('Fresh data saved to KV');
                } catch (error) {
                    console.log('KV save error:', error);
                }
            }
            
            return new Response(JSON.stringify({
                success: true,
                message: 'Data refreshed successfully',
                data: freshData,
                timestamp: new Date().toISOString()
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
            
        } else {
            console.log('Failed to get fresh data');
            
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to fetch fresh data - using existing data',
                timestamp: new Date().toISOString()
            }), {
                status: 200, // 不返回错误状态，因为这不是致命错误
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
    } catch (error) {
        console.error('Manual refresh error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            message: 'Refresh failed: ' + error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 强制获取新数据
async function forceFetchFreshData() {
    try {
        const today = new Date();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[today.getMonth()];
        const day = today.getDate();
        const year = today.getFullYear();
        const dateStr = today.toISOString().split('T')[0];
        
        console.log(`Force fetching for: ${monthName} ${day}, ${year}`);
        
        // 尝试多个URL
        const urls = [
            `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
            `https://mashable.com/article/nyt-connections-answer-today-${monthName}-${day}-${year}`,
            `https://mashable.com/article/connections-hint-answer-today-${monthName}-${day}-${year}`
        ];
        
        // 尝试多个代理
        const proxyServices = [
            (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];
        
        for (const baseUrl of urls) {
            for (const proxyFn of proxyServices) {
                try {
                    const proxyUrl = proxyFn(baseUrl);
                    console.log(`Trying: ${baseUrl}`);
                    
                    const response = await fetch(proxyUrl, {
                        method: 'GET',
                        signal: AbortSignal.timeout(20000) // 20秒超时
                    });
                    
                    if (!response.ok) {
                        console.log(`Proxy failed: ${response.status}`);
                        continue;
                    }
                    
                    let html;
                    if (proxyUrl.includes('allorigins.win')) {
                        const data = await response.json();
                        html = data.contents;
                    } else {
                        html = await response.text();
                    }
                    
                    if (!html || html.length < 1000) {
                        console.log(`HTML too short: ${html?.length || 0}`);
                        continue;
                    }
                    
                    console.log(`HTML fetched: ${html.length} chars`);
                    
                    // 解析数据
                    const result = parseForceRefresh(html, dateStr);
                    if (result && result.groups && result.groups.length === 4) {
                        console.log('Force parsing successful!');
                        return result;
                    }
                    
                } catch (error) {
                    console.log(`URL failed: ${error.message}`);
                    continue;
                }
            }
        }
        
        console.log('All force fetch attempts failed');
        return null;
        
    } catch (error) {
        console.error('Force fetch error:', error);
        return null;
    }
}

// 强制刷新解析
function parseForceRefresh(html, dateStr) {
    try {
        console.log('Starting force refresh parsing...');
        
        // 策略1: 查找颜色提示
        const colorPattern = /(Yellow|Green|Blue|Purple):\s*<strong>([^<]+)<\/strong>/gi;
        const colorMatches = [...html.matchAll(colorPattern)];
        
        console.log(`Found ${colorMatches.length} color matches`);
        
        if (colorMatches.length >= 4) {
            const hints = {};
            colorMatches.forEach(match => {
                hints[match[1]] = match[2].trim();
            });
            
            console.log('Extracted hints:', hints);
            
            // 提取单词
            const words = extractForceRefreshWords(html);
            console.log(`Extracted ${words.length} words:`, words.slice(0, 16));
            
            if (words.length >= 16) {
                const groups = [
                    {
                        theme: hints.Yellow || 'Yellow Group',
                        words: words.slice(0, 4),
                        difficulty: 'yellow',
                        hint: hints.Yellow || 'These words share a theme'
                    },
                    {
                        theme: hints.Green || 'Green Group',
                        words: words.slice(4, 8),
                        difficulty: 'green',
                        hint: hints.Green || 'These words share a theme'
                    },
                    {
                        theme: hints.Blue || 'Blue Group',
                        words: words.slice(8, 12),
                        difficulty: 'blue',
                        hint: hints.Blue || 'These words share a theme'
                    },
                    {
                        theme: hints.Purple || 'Purple Group',
                        words: words.slice(12, 16),
                        difficulty: 'purple',
                        hint: hints.Purple || 'These words share a theme'
                    }
                ];
                
                return {
                    date: dateStr,
                    words: groups.flatMap(g => g.words),
                    groups: groups,
                    source: 'Mashable (Manual Refresh)'
                };
            }
        }
        
        // 策略2: 通用解析
        console.log('Trying generic parsing...');
        const allWords = extractForceRefreshWords(html);
        
        if (allWords.length >= 16) {
            const groups = [];
            for (let i = 0; i < 4; i++) {
                groups.push({
                    theme: `Group ${i + 1}`,
                    words: allWords.slice(i * 4, (i + 1) * 4),
                    difficulty: ['green', 'yellow', 'blue', 'purple'][i],
                    hint: 'These words share a common theme'
                });
            }
            
            return {
                date: dateStr,
                words: allWords.slice(0, 16),
                groups: groups,
                source: 'Mashable (Manual Refresh - Generic)'
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Force refresh parsing error:', error);
        return null;
    }
}

// 强制刷新单词提取
function extractForceRefreshWords(html) {
    // 查找可能包含答案的区域
    const answerSections = [
        // 查找包含"answer"的段落
        ...html.match(/<p[^>]*>[\s\S]*?answer[\s\S]*?<\/p>/gi) || [],
        // 查找包含颜色的段落
        ...html.match(/<p[^>]*>[\s\S]*?(?:green|yellow|blue|purple)[\s\S]*?<\/p>/gi) || [],
        // 查找列表
        ...html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [],
        ...html.match(/<ol[^>]*>[\s\S]*?<\/ol>/gi) || [],
        // 查找包含答案的div
        ...html.match(/<div[^>]*>[\s\S]*?(?:answer|solution)[\s\S]*?<\/div>/gi) || []
    ];
    
    console.log(`Found ${answerSections.length} answer sections`);
    
    const allWords = new Set();
    
    // 从答案区域提取单词
    for (const section of answerSections) {
        const cleanText = section.replace(/<[^>]*>/g, ' ');
        
        // 多种单词模式
        const patterns = [
            /\b[A-Z]{3,12}\b/g,           // 全大写单词
            /\b[A-Z][a-z]{2,11}\b/g,      // 首字母大写
            /\b\d+[\-\/][A-Z]+\b/g,       // 数字-字母组合
            /"([A-Za-z\-']{3,12})"/g      // 引号中的单词
        ];
        
        for (const pattern of patterns) {
            const matches = cleanText.match(pattern) || [];
            matches.forEach(word => {
                const cleanWord = word.replace(/['"]/g, '').trim().toUpperCase();
                if (cleanWord.length >= 3 && cleanWord.length <= 12) {
                    allWords.add(cleanWord);
                }
            });
        }
    }
    
    // 如果答案区域的单词不够，从整个HTML提取
    if (allWords.size < 16) {
        const cleanHtml = html.replace(/<[^>]*>/g, ' ');
        const generalWords = cleanHtml.match(/\b[A-Z]{3,12}\b/g) || [];
        generalWords.forEach(word => allWords.add(word));
    }
    
    const wordArray = Array.from(allWords);
    
    // 过滤掉网站相关词汇
    const filtered = wordArray.filter(word => {
        const excludeWords = [
            'MASHABLE', 'CONNECTIONS', 'NYT', 'TIMES', 'PUZZLE', 'GAME',
            'ANSWER', 'HINT', 'TODAY', 'DAILY', 'SOLUTION', 'CATEGORY',
            'HTML', 'CSS', 'JAVASCRIPT', 'ARTICLE', 'CONTENT', 'PAGE',
            'SEARCH', 'RESULT', 'TECH', 'SCIENCE', 'NEWS', 'SOCIAL',
            'SUBSCRIBE', 'NEWSLETTER', 'EMAIL', 'FOLLOW', 'SHARE',
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
        ];
        
        return !excludeWords.includes(word) && 
               word.length >= 3 && 
               word.length <= 12 &&
               /^[A-Z0-9\-]+$/.test(word);
    });
    
    console.log(`Filtered to ${filtered.length} candidate words`);
    
    return filtered.slice(0, 20); // 返回前20个最可能的单词
}