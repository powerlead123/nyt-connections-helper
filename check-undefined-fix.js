// 检查undefined问题是否修复
import fetch from 'node-fetch';

async function checkUndefinedFix() {
    console.log('=== 检查undefined问题修复 ===');
    
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
            
            // 检查category字段
            console.log('\\n=== 检查category字段 ===');
            if (data.groups && data.groups.length === 4) {
                let allCategoriesValid = true;
                
                data.groups.forEach((group, i) => {
                    const categoryValid = group.category && group.category !== 'undefined';
                    console.log(`分组 ${i + 1}: "${group.category}" - ${categoryValid ? '✅' : '❌'}`);
                    
                    if (!categoryValid) {
                        allCategoriesValid = false;
                    }
                });
                
                if (allCategoriesValid) {
                    console.log('\\n🎉 所有分组名称都正确！不再显示undefined！');
                    console.log('\\n分组详情:');
                    data.groups.forEach((group, i) => {
                        console.log(`  ${i + 1}. ${group.category}: ${group.words.join(', ')}`);
                    });
                } else {
                    console.log('\\n❌ 仍有分组显示undefined');
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

checkUndefinedFix();