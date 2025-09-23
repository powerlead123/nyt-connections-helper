// 临时手动存储API - 仅用于紧急情况
export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        const body = await request.json();
        const { secret, date, data } = body;
        
        // 简单的安全验证
        if (secret !== 'emergency-manual-store-2025') {
            return new Response('Unauthorized', { status: 401 });
        }
        
        if (!date || !data) {
            return new Response('Missing date or data', { status: 400 });
        }
        
        // 存储到KV
        if (env.CONNECTIONS_KV) {
            await env.CONNECTIONS_KV.put(`puzzle-${date}`, JSON.stringify(data), {
                expirationTtl: 86400 * 30 // 30天过期
            });
            
            console.log(`✅ 手动存储成功: ${date}`);
            
            return new Response(JSON.stringify({
                success: true,
                message: `Data stored successfully for ${date}`,
                date: date
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: 'KV binding not available'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('Manual store error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}