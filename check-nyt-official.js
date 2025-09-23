// 检查NYT官方是否发布了今日谜题
console.log('🔍 检查NYT官方Connections谜题状态...');

async function checkNYTOfficial() {
    try {
        // 检查NYT Games页面
        console.log('📡 检查NYT Games Connections页面...');
        
        const nytUrl = 'https://www.nytimes.com/games/connections';
        console.log(`🔗 NYT URL: ${nytUrl}`);
        
        const response = await fetch(nytUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        console.log(`📊 NYT响应状态: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const html = await response.text();
            
            // 检查页面内容
            const hasConnectionsGame = html.includes('Connections') || html.includes('connections');
            const hasGameContent = html.includes('puzzle') || html.includes('game');
            
            console.log(`🎮 包含Connections游戏: ${hasConnectionsGame ? '✅' : '❌'}`);
            console.log(`🧩 包含游戏内容: ${hasGameContent ? '✅' : '❌'}`);
            
            // 检查是否有今日日期
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const hasToday = html.includes(todayStr);
            
            console.log(`📅 包含今日日期 (${todayStr}): ${hasToday ? '✅' : '❌'}`);
            
            // 尝试找到游戏数据
            const gameDataMatch = html.match(/window\.gameData\s*=\s*({[^}]+})/);
            if (gameDataMatch) {
                console.log('🎯 找到游戏数据结构');
                try {
                    const gameData = JSON.parse(gameDataMatch[1]);
                    console.log('📊 游戏数据:', JSON.stringify(gameData, null, 2));
                } catch (e) {
                    console.log('⚠️  游戏数据解析失败');
                }
            } else {
                console.log('❌ 未找到游戏数据结构');
            }
            
        } else if (response.status === 403) {
            console.log('🚫 NYT网站拒绝访问（可能需要订阅或地区限制）');
        } else {
            console.log('❌ NYT网站访问失败');
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 检查当前时间和NYT发布时间
        console.log('⏰ 时间分析:');
        const now = new Date();
        const utcHour = now.getUTCHours();
        const utcMinute = now.getUTCMinutes();
        
        console.log(`🌍 当前UTC时间: ${utcHour}:${String(utcMinute).padStart(2, '0')}`);
        console.log(`🇺🇸 纽约时间大约: ${(utcHour - 4 + 24) % 24}:${String(utcMinute).padStart(2, '0')}`);
        
        // NYT通常在美东时间凌晨发布新谜题
        if (utcHour < 4) {
            console.log('⚠️  可能还未到NYT谜题发布时间（通常UTC 04:00后）');
        } else {
            console.log('✅ 已过NYT谜题通常发布时间');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkNYTOfficial().catch(console.error);