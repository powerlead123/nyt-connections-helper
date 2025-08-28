// Cloudflare Pages Function for /api/refresh
export async function onRequest(context) {
    const { request, env } = context;
    
    // 只允许POST请求
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 清除缓存
        if (env.CONNECTIONS_KV) {
            await env.CONNECTIONS_KV.delete(`puzzle-${today}`);
        }
        
        // 获取新数据
        const puzzleData = await fetchTodaysPuzzle();
        
        // 存储新数据
        if (env.CONNECTIONS_KV && puzzleData) {
            await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(puzzleData), {
                expirationTtl: 86400
            });
        }
        
        return new Response(JSON.stringify({
            message: 'Data refreshed successfully',
            data: puzzleData
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Refresh error:', error);
        
        return new Response(JSON.stringify({
            error: 'Refresh failed'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 重用today.js中的函数
async function fetchTodaysPuzzle() {
    // 这里可以复制today.js中的相同逻辑
    // 或者创建共享模块
    return {
        date: new Date().toISOString().split('T')[0],
        words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT', 'SPRING', 'SUMMER', 'FALL', 'WINTER', 'MARS', 'SNICKERS', 'TWIX', 'KITKAT', 'APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
        groups: [
            {
                theme: 'Fish',
                words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT'],
                difficulty: 'yellow',
                hint: 'These are all seafood you can see on restaurant menus'
            },
            {
                theme: 'Seasons',
                words: ['SPRING', 'SUMMER', 'FALL', 'WINTER'],
                difficulty: 'green',
                hint: 'The four periods of the year cycle'
            },
            {
                theme: 'Candy brands',
                words: ['MARS', 'SNICKERS', 'TWIX', 'KITKAT'],
                difficulty: 'blue',
                hint: 'These are all chocolate bar brands'
            },
            {
                theme: 'Tech companies',
                words: ['APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
                difficulty: 'purple',
                hint: 'These companies all have their own operating systems or platforms'
            }
        ],
        source: 'Refreshed'
    };
}