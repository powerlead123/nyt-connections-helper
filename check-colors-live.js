// 检查线上颜色显示
import fetch from 'node-fetch';

async function checkColorsLive() {
    console.log('=== 检查线上颜色显示 ===');
    
    const siteUrl = 'https://nyt-connections-helper.pages.dev';
    
    try {
        console.log('等待30秒让部署完成...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        console.log('检查API端点...');
        
        const apiResponse = await fetch(`${siteUrl}/api/today`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            console.log('✅ API响应正常');
            
            // 检查difficulty字段
            console.log('\\n=== 检查difficulty字段 ===');
            if (data.groups && data.groups.length === 4) {
                const expectedColors = {
                    'yellow': '🟡 黄色 (最简单)',
                    'green': '🟢 绿色 (简单)',
                    'blue': '🔵 蓝色 (困难)',
                    'purple': '🟣 紫色 (最困难)'
                };
                
                let allColorsCorrect = true;
                
                console.log('分组颜色分配:');
                data.groups.forEach((group, i) => {
                    const difficulty = group.difficulty;
                    const hasCorrectDifficulty = difficulty && expectedColors[difficulty];
                    
                    console.log(`${i + 1}. ${group.theme}`);
                    console.log(`   难度: ${difficulty}`);
                    console.log(`   颜色: ${expectedColors[difficulty] || '❌ 未知'}`);
                    console.log(`   单词: [${group.words.join(', ')}]`);
                    console.log('');
                    
                    if (!hasCorrectDifficulty) {
                        allColorsCorrect = false;
                    }
                });
                
                if (allColorsCorrect) {
                    console.log('🎉 所有颜色字段都正确！');
                    console.log('\\n现在前端应该显示:');
                    console.log('- Piquancy: 🟡 黄色背景');
                    console.log('- Available: 🟢 绿色背景');
                    console.log('- Male animals: 🔵 蓝色背景');
                    console.log('- Chinese Dynasties: 🟣 紫色背景');
                    console.log('\\n而不是之前的灰色！');
                } else {
                    console.log('❌ 颜色字段有问题');
                }
            } else {
                console.log('❌ groups数据不正确');
            }
            
        } else {
            console.log(`❌ API访问失败: ${apiResponse.status}`);
        }
        
    } catch (error) {
        console.error('检查出错:', error.message);
    }
}

checkColorsLive();