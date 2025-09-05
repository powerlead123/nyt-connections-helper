// 检查Cloudflare部署更新状态
import fetch from 'node-fetch';

async function checkDeploymentUpdate() {
    console.log('=== 检查Cloudflare部署更新 ===');
    
    // 你的网站URL - 请替换为实际URL
    const siteUrl = 'https://nyt-connections-helper.pages.dev'; // 或者你的自定义域名
    
    try {
        console.log('1. 检查网站是否可访问...');
        
        // 测试主页
        const homeResponse = await fetch(siteUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (homeResponse.ok) {
            console.log('✅ 网站主页可访问');
        } else {
            console.log(`❌ 网站主页访问失败: ${homeResponse.status}`);
        }
        
        console.log('\\n2. 测试API端点...');
        
        // 测试API
        const apiResponse = await fetch(`${siteUrl}/api/today`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            console.log('✅ API端点正常工作');
            console.log(`日期: ${data.date}`);
            
            if (data.groups && data.groups.length === 4) {
                console.log('✅ 解析成功，获得4个分组:');
                data.groups.forEach((group, i) => {
                    console.log(`  ${i + 1}. ${group.category}: ${group.words.join(', ')}`);
                });
                
                console.log('\\n🎉 部署更新成功！网站完全正常工作！');
                
                // 检查是否是今天的数据
                const today = new Date().toISOString().split('T')[0];
                if (data.date === today) {
                    console.log('✅ 显示的是今天的谜题数据');
                } else {
                    console.log(`⚠️  显示的是 ${data.date} 的数据，不是今天 ${today}`);
                }
                
            } else if (data.error) {
                console.log('❌ API返回错误:', data.error);
            } else {
                console.log('❌ API返回数据格式不正确');
            }
        } else {
            console.log(`❌ API端点访问失败: ${apiResponse.status}`);
        }
        
        console.log('\\n3. 部署建议:');
        console.log('- 如果API正常工作，说明部署成功');
        console.log('- 如果还有问题，可能需要等待几分钟让Cloudflare完成部署');
        console.log('- 你可以在Cloudflare Pages控制台查看部署日志');
        
    } catch (error) {
        console.error('检查出错:', error.message);
        console.log('\\n可能的原因:');
        console.log('1. 网站还在部署中，请等待几分钟');
        console.log('2. 网站URL不正确');
        console.log('3. 网络连接问题');
    }
}

// 等待一下再检查，给Cloudflare一些部署时间
console.log('等待30秒让Cloudflare完成部署...');
setTimeout(checkDeploymentUpdate, 30000);