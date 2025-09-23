// 调试版本的today.js
export async function onRequest(context) {
    const { env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Debug: today =', today);
        
        let puzzleData = null;
        let actualDate = today;
        
        if (env.CONNECTIONS_KV) {
            console.log('Debug: KV绑定存在');
            
            try {
                // 1. 首先尝试获取今天的数据
                console.log('Debug: 尝试获取今天的数据:', `puzzle-${today}`);
                let cached = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
                console.log('Debug: 今天的数据结果:', cached ? '找到' : '未找到');
                
                if (cached) {
                    puzzleData = JSON.parse(cached);
                    actualDate = today;
                    console.log('Debug: 获取今日数据成功，源:', puzzleData.source);
                } else {
                    console.log('Debug: 今日数据不存在，尝试获取最新可用数据...');
                    
                    // 2. 如果今天没有数据，尝试获取最近30天的数据
                    for (let daysBack = 1; daysBack <= 30; daysBack++) {
                        const checkDate = new Date();
                        checkDate.setDate(checkDate.getDate() - daysBack);
                        const dateStr = checkDate.toISOString().split('T')[0];
                        
                        console.log(`Debug: 检查 ${daysBack} 天前的数据:`, `puzzle-${dateStr}`);
                        cached = await env.CONNECTIONS_KV.get(`puzzle-${dateStr}`);
                        console.log(`Debug: ${dateStr} 结果:`, cached ? '找到' : '未找到');
                        
                        if (cached) {
                            puzzleData = JSON.parse(cached);
                            actualDate = dateStr;
                            console.log(`Debug: 获取${daysBack}天前数据成功 (${dateStr})，源:`, puzzleData.source);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.log('Debug: KV读取失败:', error.message);
            }
        } else {
            console.log('Debug: KV绑定不存在');
        }
        
        console.log('Debug: puzzleData =', puzzleData ? '存在' : '不存在');
        if (puzzleData) {
            console.log('Debug: puzzleData.source =', puzzleData.source);
            console.log('Debug: 是否包含Backup =', puzzleData.source?.includes('Backup'));
        }
        
        // 只返回真实数据，绝不返回备用数据
        if (puzzleData && !puzzleData.source?.includes('Backup')) {
            console.log('Debug: 数据通过过滤，准备返回');
            
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
                debug: {
                    foundData: true,
                    dataSource: puzzleData.source,
                    actualDate: actualDate,
                    isToday: isToday,
                    daysOld: daysOld
                }
            };
            
            return new Response(JSON.stringify(responseData), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': isToday ? 'public, max-age=1800' : 'public, max-age=3600'
                }
            });
        } else {
            console.log('Debug: 数据未通过过滤或不存在');
            
            return new Response(JSON.stringify({
                success: false,
                error: 'No puzzle data available',
                message: 'Debug: No data found or data filtered out',
                requestedDate: today,
                actualDate: null,
                debug: {
                    foundData: !!puzzleData,
                    dataSource: puzzleData?.source || null,
                    filteredOut: puzzleData ? puzzleData.source?.includes('Backup') : false
                }
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
    } catch (error) {
        console.error('Debug: Today API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message,
            debug: {
                error: error.message,
                stack: error.stack
            }
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}