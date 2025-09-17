export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 检查KV绑定是否存在
    if (!env.CONNECTIONS_KV) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CONNECTIONS_KV binding not found',
        availableBindings: Object.keys(env)
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 尝试简单的KV操作
    const testKey = 'test-key';
    const testValue = { test: true, timestamp: new Date().toISOString() };
    
    // 写入测试数据
    await env.CONNECTIONS_KV.put(testKey, JSON.stringify(testValue));
    
    // 读取测试数据
    const retrieved = await env.CONNECTIONS_KV.get(testKey, 'json');
    
    // 删除测试数据
    await env.CONNECTIONS_KV.delete(testKey);
    
    return new Response(JSON.stringify({
      success: true,
      kvBindingExists: true,
      testWrite: true,
      testRead: !!retrieved,
      testData: retrieved
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}