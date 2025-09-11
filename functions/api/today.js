export async function onRequest(context) {
    const { env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 尝试从KV获取缓存数据
        let puzzleData = null;
        if (env.CONNECTIONS_KV) {
            try {
                const cached = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
                if (cached) {
                    puzzleData = JSON.parse(cached);
                }
            } catch (error) {
                console.log('KV读取失败:', error.message);
            }
        }
        
        // 如果没有缓存数据，使用备用数据
        if (!puzzleData) {
            puzzleData = getBackupPuzzle();
        }
        
        return new Response(JSON.stringify(puzzleData), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
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

function getBackupPuzzle() {
    const today = new Date().toISOString().split('T')[0];
    
    return {
        date: today,
        words: ['DENT', 'DING', 'MAR', 'SCRATCH', 'COLOSSUS', 'MAMMOTH', 'WHALE', 'WHOPPER', 'POINT', 'SNICKER', 'STARE', 'WHISPER', 'BASE', 'BOX', 'MOUND', 'PLATE'],
        groups: [
            {
                theme: 'Blemish',
                words: ['DENT', 'DING', 'MAR', 'SCRATCH'],
                difficulty: 'yellow',
                hint: 'Blemish'
            },
            {
                theme: 'Behemoth',
                words: ['COLOSSUS', 'MAMMOTH', 'WHALE', 'WHOPPER'],
                difficulty: 'green',
                hint: 'Behemoth'
            },
            {
                theme: 'Rude things to do',
                words: ['POINT', 'SNICKER', 'STARE', 'WHISPER'],
                difficulty: 'blue',
                hint: 'Rude things to do'
            },
            {
                theme: 'On a baseball field',
                words: ['BASE', 'BOX', 'MOUND', 'PLATE'],
                difficulty: 'purple',
                hint: 'On a baseball field'
            }
        ],
        source: 'Backup (Simple)'
    };
}