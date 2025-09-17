export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 简单测试KV绑定是否存在
    if (!env.CONNECTIONS_KV) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CONNECTIONS_KV binding not found',
        bindings: Object.keys(env)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 测试基本的KV操作
    const testKey = 'test-' + Date.now();
    const testData = { test: true, timestamp: new Date().toISOString() };
    
    // 写入测试
    await env.CONNECTIONS_KV.put(testKey, JSON.stringify(testData));
    
    // 读取测试
    const retrieved = await env.CONNECTIONS_KV.get(testKey, 'json');
    
    // 清理测试数据
    await env.CONNECTIONS_KV.delete(testKey);
    
    // 检查今日数据
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `puzzle-${today}`;
    const todayData = await env.CONNECTIONS_KV.get(todayKey, 'json');
    
    return new Response(JSON.stringify({
      success: true,
      kvBinding: 'CONNECTIONS_KV found',
      testWrite: 'success',
      testRead: retrieved ? 'success' : 'failed',
      todayKey,
      todayExists: !!todayData,
      todayTimestamp: todayData?.timestamp || null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}