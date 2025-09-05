// 立即检查当前部署状态
import fetch from 'node-fetch';

async function checkNow() {
    console.log('=== 立即检查当前部署状态 ===');
    
    const siteUrl = 'https://nyt-connections-helper.pages.dev';
    
    try {
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
            console.log('响应数据:', JSON.stringify(data, null, 2));
            
            if (data.groups && data.groups.length === 4) {
                console.log('\\n🎉 网站已经更新成功！');
            } else {
                console.log('\\n⏳ 可能还在使用旧版本，等待部署完成...');
            }
        } else {
            console.log(`API状态: ${apiResponse.status}`);
        }
        
    } catch (error) {
        console.error('检查出错:', error.message);
    }
}

checkNow();