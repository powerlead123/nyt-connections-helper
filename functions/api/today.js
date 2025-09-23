// Cloudflare Pages Function for today's puzzle - 智能获取最新可用数据
export async function onRequest(context) {
    const { env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 🔒 纯读取模式：只从KV获取数据，不触发任何抓取
        let puzzleData = null;
        let actualDate = today;
        
        if (env.CONNECTIONS_KV) {
            try {
                // 1. 首先尝试获取今天的数据
                let cached = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
                if (cached) {
                    puzzleData = JSON.parse(cached);
                    actualDate = today;
                    console.log('获取今日数据成功，源:', puzzleData.source);
                } else {
                    console.log('今日数据不存在，尝试获取最新可用数据...');
                    
                    // 2. 如果今天没有数据，尝试获取最近30天的数据
                    for (let daysBack = 1; daysBack <= 30; daysBack++) {
                        const checkDate = new Date();
                        checkDate.setDate(checkDate.getDate() - daysBack);
                        const dateStr = checkDate.toISOString().split('T')[0];
                        
                        cached = await env.CONNECTIONS_KV.get(`puzzle-${dateStr}`);
                        if (cached) {
                            puzzleData = JSON.parse(cached);
                            actualDate = dateStr;
                            console.log(`获取${daysBack}天前数据成功 (${dateStr})，源:`, puzzleData.source);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.log('KV读取失败:', error.message);
            }
        }
        
        // 如果找到的数据是备用数据，尝试查找历史真实数据
        if (puzzleData && puzzleData.source?.includes('Backup')) {
            console.log('发现备用数据，尝试查找历史真实数据...');
            
            // 查找最近30天的真实数据
            for (let daysBack = 1; daysBack <= 30; daysBack++) {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() - daysBack);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                console.log(`检查 ${daysBack} 天前的真实数据: puzzle-${dateStr}`);
                try {
                    const historicalData = await env.CONNECTIONS_KV.get(`puzzle-${dateStr}`);
                    if (historicalData) {
                        const parsedData = JSON.parse(historicalData);
                        
                        // 如果找到真实数据，使用它
                        if (!parsedData.source?.includes('Backup')) {
                            puzzleData = parsedData;
                            actualDate = dateStr;
                            console.log(`使用${daysBack}天前的真实数据 (${dateStr})，源:`, parsedData.source);
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`检查${dateStr}时出错:`, error.message);
                }
            }
        }
        
        // 只返回真实数据，绝不返回备用数据
        if (puzzleData && !puzzleData.source?.includes('Backup')) {
            // 添加元数据信息
            const isToday = actualDate === today;
            const daysOld = Math.floor((new Date(today) - new Date(actualDate)) / (1000 * 60 * 60 * 24));
            
            const responseData = {
                ...puzzleData,
                actualDate: actualDate,
                requestedDate: today,
                isToday: isToday,
                daysOld: daysOld,
                freshness: isToday ? 'current' : daysOld === 1 ? 'yesterday' : 'archived',
                success: true,
                fallbackUsed: actualDate !== today
            };
            
            return new Response(JSON.stringify(responseData), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': isToday ? 'public, max-age=1800' : 'public, max-age=3600' // 今日数据30分钟缓存，历史数据1小时缓存
                }
            });
        } else {
            // 如果没有找到任何数据，返回友好的提示信息
            console.log('没有找到任何可用数据');
            return new Response(JSON.stringify({
                success: false,
                error: 'No puzzle data available',
                message: 'No puzzle data found in the last 30 days. The system may be initializing or experiencing issues. Please try the manual refresh or check back later.',
                requestedDate: today,
                actualDate: null,
                isToday: false,
                daysOld: null,
                freshness: 'unavailable',
                timestamp: new Date().toISOString(),
                suggestion: 'Try using the refresh button or check back in a few hours.'
            }), {
                status: 200, // 仍然返回200，但success: false
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=300' // 5分钟缓存，更频繁检查
                }
            });
        }
        
    } catch (error) {
        console.error('Today API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 🔒 纯读取模式：所有抓取逻辑已移除
// 数据抓取只能通过以下方式进行：
// 1. 定时任务 (scheduled.js)
// 2. 管理员手动刷新 (refresh.js)