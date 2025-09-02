// 强制清除缓存并获取真实数据
console.log('🧹 强制清除缓存并获取真实数据...');

const SITE_URL = 'https://nyt-connections-helper.pages.dev';

async function forceCacheClear() {
    try {
        console.log('🎯 目标网站:', SITE_URL);
        console.log('📅 目标日期: 2025-09-02');
        
        // 1. 多次调用refresh API来强制更新
        console.log('\n1. 强制刷新数据 (多次尝试)...');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`\n尝试 ${i}/3:`);
            
            const refreshResponse = await fetch(`${SITE_URL}/api/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log(`✅ 刷新 ${i} 成功:`, refreshData.success ? '成功' : '失败');
                console.log('消息:', refreshData.message);
                
                if (refreshData.success && refreshData.data) {
                    console.log('🎉 获取到新数据!');
                    console.log('数据预览:', refreshData.data.words?.slice(0, 8));
                    break;
                }
            } else {
                console.log(`❌ 刷新 ${i} 失败:`, refreshResponse.status);
            }
            
            // 等待2秒再试
            if (i < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // 2. 调用scheduled端点强制重新抓取
        console.log('\n2. 触发scheduled强制抓取...');
        
        const scheduledResponse = await fetch(`${SITE_URL}/scheduled`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'scrape-data',
                secret: 'your-secret-key-here'
            })
        });
        
        if (scheduledResponse.ok) {
            const scheduledData = await scheduledResponse.json();
            console.log('✅ Scheduled抓取结果:', scheduledData);
        } else {
            console.log('❌ Scheduled调用失败:', scheduledResponse.status);
        }
        
        // 3. 等待并检查最终结果
        console.log('\n3. 等待10秒后检查最终结果...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const finalResponse = await fetch(`${SITE_URL}/api/today?t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (finalResponse.ok) {
            const finalData = await finalResponse.json();
            console.log('\n📊 最终数据:');
            console.log('日期:', finalData.date);
            console.log('来源:', finalData.source);
            console.log('单词预览:', finalData.words?.slice(0, 8));
            
            const isStillPlaceholder = finalData.words?.includes('LOADING');
            
            if (!isStillPlaceholder) {
                console.log('\n🎉 成功！数据已更新为真实内容');
                console.log('✅ 网站现在应该显示正确的9月2日Connections答案');
            } else {
                console.log('\n⚠️  数据仍然是占位符');
                console.log('\n🔍 可能的原因:');
                console.log('1. Mashable还没发布9月2日的文章');
                console.log('2. 文章存在但URL格式不同');
                console.log('3. 解析逻辑需要调整');
                console.log('4. 代理服务问题');
                
                console.log('\n📝 建议操作:');
                console.log('1. 手动检查 https://mashable.com 是否有今天的Connections文章');
                console.log('2. 等待几小时后再试 (Mashable通常在美国时间发布)');
                console.log('3. 检查浏览器开发者工具的网络请求');
            }
        } else {
            console.log('❌ 无法获取最终数据:', finalResponse.status);
        }
        
    } catch (error) {
        console.error('❌ 强制清除缓存失败:', error.message);
    }
}

forceCacheClear();