// 检查最终修复结果
import fetch from 'node-fetch';

async function checkFinalFix() {
    console.log('=== 检查最终修复结果 ===');
    
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
            
            // 检查前端期望的格式
            console.log('\\n=== 前端兼容性检查 ===');
            console.log('date存在:', !!data.date);
            console.log('words存在:', !!data.words);
            console.log('groups存在:', !!data.groups);
            
            if (data.words && data.words.length === 16) {
                console.log('✅ words数组正确 (16个单词)');
                console.log('前几个单词:', data.words.slice(0, 4));
            } else {
                console.log('❌ words数组不正确');
            }
            
            if (data.groups && data.groups.length === 4) {
                console.log('✅ groups数组正确 (4个分组)');
                data.groups.forEach((group, i) => {
                    console.log(`  ${i + 1}. ${group.category}: ${group.words.join(', ')}`);
                });
            } else {
                console.log('❌ groups数组不正确');
            }
            
            // 最终判断
            const isFixed = !!(data.words && data.words.length === 16 && data.groups && data.groups.length === 4);
            
            if (isFixed) {
                console.log('\\n🎉 完美！网站现在应该完全正常工作了！');
                console.log('前端JavaScript不会再报错，游戏可以正常初始化。');
            } else {
                console.log('\\n❌ 还有问题，可能需要再等待一下部署完成');
            }
            
        } else {
            console.log(`❌ API访问失败: ${apiResponse.status}`);
        }
        
    } catch (error) {
        console.error('检查出错:', error.message);
    }
}

checkFinalFix();