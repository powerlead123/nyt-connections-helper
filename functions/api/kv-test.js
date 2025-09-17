export async function onRequest(context) {
  const { env } = context;
  
  try {
    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `puzzle-${today}`;
    
    // 检查今日数据
    const todayData = await env.CONNECTIONS_KV.get(todayKey, 'json');
    
    // 获取所有键
    const allKeys = await env.CONNECTIONS_KV.list();
    
    // 获取最近几天的数据作为示例
    const recentData = {};
    const recentKeys = allKeys.keys.slice(0, 5);
    for (const key of recentKeys) {
      const data = await env.CONNECTIONS_KV.get(key.name, 'json');
      if (data) {
        recentData[key.name] = {
          date: data.date,
          timestamp: data.timestamp,
          source: data.source,
          groupCount: data.groups?.length || 0,
          wordCount: data.words?.length || 0
        };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      todayKey,
      todayExists: !!todayData,
      todayData: todayData ? {
        date: todayData.date,
        timestamp: todayData.timestamp,
        source: todayData.source,
        groupCount: todayData.groups?.length || 0,
        wordCount: todayData.words?.length || 0
      } : null,
      allKeys: allKeys.keys.map(k => k.name),
      totalKeys: allKeys.keys.length,
      recentData
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