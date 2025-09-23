// 直接测试KV存储的临时API
export async function onRequest(context) {
    const { env } = context;
    
    try {
        const testKey = 'puzzle-2025-09-22';
        console.log('尝试读取键:', testKey);
        
        if (env.CONNECTIONS_KV) {
            const data = await env.CONNECTIONS_KV.get(testKey);
            
            return new Response(JSON.stringify({
                success: true,
                key: testKey,
                found: !!data,
                dataLength: data ? data.length : 0,
                preview: data ? data.substring(0, 200) + '...' : null,
                fullData: data ? JSON.parse(data) : null
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: 'KV binding not found'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}