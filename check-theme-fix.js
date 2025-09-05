// 检查theme字段修复结果
import fetch from 'node-fetch';

async function checkThemeFix() {
    console.log('=== 检查theme字段修复结果 ===');
    
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
            
            // 检查theme和category字段
            console.log('\\n=== 检查theme和category字段 ===');
            if (data.groups && data.groups.length === 4) {
                let allFieldsValid = true;
                
                data.groups.forEach((group, i) => {
                    const hasTheme = group.theme && group.theme !== 'undefined';
                    const hasCategory = group.category && group.category !== 'undefined';
                    
                    console.log(`分组 ${i + 1}:`);
                    console.log(`  theme: "${group.theme}" - ${hasTheme ? '✅' : '❌'}`);
                    console.log(`  category: "${group.category}" - ${hasCategory ? '✅' : '❌'}`);
                    console.log(`  words: [${group.words.join(', ')}]`);
                    console.log('---');
                    
                    if (!hasTheme || !hasCategory) {
                        allFieldsValid = false;
                    }
                });
                
                if (allFieldsValid) {
                    console.log('\\n🎉 所有字段都正确！前端不会再显示undefined！');
                    console.log('\\n现在前端会显示:');
                    data.groups.forEach((group, i) => {
                        console.log(`  "Congratulations! You found the \\"${group.theme}\\" group: ${group.words.join(', ')}"`);
                    });
                } else {
                    console.log('\\n❌ 仍有字段显示undefined');
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

checkThemeFix();