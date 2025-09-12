// Cloudflare Pages Function for today's puzzle - 纯读取模式
export async function onRequest(context) {
    const { env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 🔒 纯读取模式：只从KV获取数据，不触发任何抓取
        let puzzleData = null;
        
        if (env.CONNECTIONS_KV) {
            try {
                const cached = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
                if (cached) {
                    puzzleData = JSON.parse(cached);
                    console.log('从KV缓存获取数据，源:', puzzleData.source);
                } else {
                    console.log('KV中没有今日数据');
                }
            } catch (error) {
                console.log('KV读取失败:', error.message);
            }
        }
        
        // 如果有数据就返回，没有数据就返回404
        if (puzzleData) {
            return new Response(JSON.stringify(puzzleData), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600' // 1小时缓存
                }
            });
        } else {
            // 没有数据时返回明确的错误信息
            return new Response(JSON.stringify({
                error: 'No puzzle data available for today',
                message: 'Puzzle data is updated daily via scheduled tasks. Please check back later or contact admin.',
                date: today,
                suggestion: 'Data is typically available after 9:00 AM Beijing time (01:00 UTC)'
            }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
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