// 手动更新今天的真实数据
// 请告诉我今天的真实答案，我来更新系统

console.log('📝 手动更新今天(9月1日)的Connections答案');
console.log('');
console.log('请提供今天的真实答案，格式如下:');
console.log('');
console.log('分组1 (绿色/最简单):');
console.log('主题: [主题名称]');
console.log('单词: [单词1, 单词2, 单词3, 单词4]');
console.log('');
console.log('分组2 (黄色/简单):');
console.log('主题: [主题名称]');
console.log('单词: [单词1, 单词2, 单词3, 单词4]');
console.log('');
console.log('分组3 (蓝色/困难):');
console.log('主题: [主题名称]');
console.log('单词: [单词1, 单词2, 单词3, 单词4]');
console.log('');
console.log('分组4 (紫色/最困难):');
console.log('主题: [主题名称]');
console.log('单词: [单词1, 单词2, 单词3, 单词4]');
console.log('');
console.log('一旦你提供了答案，我会立即更新系统！');

// 创建更新函数
function createTodaysPuzzle(groups) {
    const today = new Date().toISOString().split('T')[0];
    
    const puzzleData = {
        date: today,
        words: groups.flatMap(g => g.words),
        groups: groups,
        source: 'Manual Update'
    };
    
    return puzzleData;
}

// 示例格式
const exampleGroups = [
    {
        theme: "示例主题1",
        words: ["WORD1", "WORD2", "WORD3", "WORD4"],
        difficulty: "green",
        hint: "这些词有共同特征"
    },
    {
        theme: "示例主题2", 
        words: ["WORD5", "WORD6", "WORD7", "WORD8"],
        difficulty: "yellow",
        hint: "这些词有共同特征"
    },
    {
        theme: "示例主题3",
        words: ["WORD9", "WORD10", "WORD11", "WORD12"],
        difficulty: "blue", 
        hint: "这些词有共同特征"
    },
    {
        theme: "示例主题4",
        words: ["WORD13", "WORD14", "WORD15", "WORD16"],
        difficulty: "purple",
        hint: "这些词有共同特征"
    }
];

console.log('');
console.log('📋 数据格式示例:');
console.log(JSON.stringify(exampleGroups, null, 2));

// 更新API文件的函数
async function updateTodayAPI(puzzleData) {
    console.log('🔄 准备更新API文件...');
    
    // 这里我们需要更新 functions/api/today.js 文件
    // 将新的数据写入其中
    
    const apiContent = `// Cloudflare Pages Function for today's puzzle
export async function onRequest(context) {
    const { request, env } = context;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 手动更新的今日数据 - ${new Date().toISOString()}
        const todaysPuzzle = ${JSON.stringify(puzzleData, null, 8)};
        
        // 如果有KV存储，也尝试从那里获取
        let puzzleData = todaysPuzzle;
        
        if (env.CONNECTIONS_KV) {
            try {
                const kvData = await env.CONNECTIONS_KV.get(\`puzzle-\${today}\`, 'json');
                if (kvData && kvData.groups && kvData.groups.length === 4) {
                    puzzleData = kvData;
                }
            } catch (error) {
                console.log('KV fetch error:', error);
                // 使用默认数据
            }
        }
        
        return new Response(JSON.stringify(puzzleData), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // 5分钟缓存
            }
        });
        
    } catch (error) {
        console.error('Today API error:', error);
        
        // 返回错误响应
        return new Response(JSON.stringify({
            error: 'Failed to load puzzle data',
            date: new Date().toISOString().split('T')[0]
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}`;

    return apiContent;
}

console.log('');
console.log('🚀 准备就绪！请提供今天的真实答案，我立即更新系统！');

module.exports = { createTodaysPuzzle, updateTodayAPI };