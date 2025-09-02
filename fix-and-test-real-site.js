// 修复并测试真实网站
console.log('🎯 使用正确的网站URL测试和修复...');

const CORRECT_URL = 'https://nyt-connections-helper.pages.dev';

async function fixAndTestRealSite() {
    try {
        console.log('🌐 正确的网站URL:', CORRECT_URL);
        
        // 1. 测试网站是否可访问
        console.log('\n1. 测试网站访问...');
        const siteResponse = await fetch(CORRECT_URL);
        
        if (!siteResponse.ok) {
            console.log(`❌ 网站无法访问: ${siteResponse.status}`);
            return;
        }
        
        console.log('✅ 网站可以访问!');
        
        // 2. 检查当前API数据
        console.log('\n2. 检查当前API数据...');
        const apiResponse = await fetch(`${CORRECT_URL}/api/today`);
        
        if (!apiResponse.ok) {
            console.log(`❌ API无法访问: ${apiResponse.status}`);
            return;
        }
        
        const currentData = await apiResponse.json();
        console.log('📊 当前数据:', JSON.stringify(currentData, null, 2));
        
        // 检查是否是占位符数据
        const isPlaceholder = currentData.words && (
            currentData.words.includes('LOADING') || 
            currentData.words.includes('PLEASE') ||
            currentData.words.includes('WAIT')
        );
        
        if (isPlaceholder) {
            console.log('\n⚠️  当前是占位符数据，需要刷新');
            
            // 3. 触发数据刷新
            console.log('\n3. 触发数据刷新...');
            const refreshResponse = await fetch(`${CORRECT_URL}/api/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (refreshResponse.ok) {
                const refreshResult = await refreshResponse.json();
                console.log('✅ 刷新请求成功:', refreshResult);
                
                // 等待几秒后再次检查
                console.log('\n⏳ 等待5秒后检查结果...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const updatedResponse = await fetch(`${CORRECT_URL}/api/today`);
                const updatedData = await updatedResponse.json();
                
                console.log('📊 刷新后的数据:', JSON.stringify(updatedData, null, 2));
                
                const stillPlaceholder = updatedData.words && updatedData.words.includes('LOADING');
                if (!stillPlaceholder) {
                    console.log('🎉 成功！数据已更新为真实内容');
                } else {
                    console.log('⚠️  数据仍然是占位符');
                    console.log('可能原因:');
                    console.log('- Mashable还没发布9月2日的文章');
                    console.log('- 解析逻辑需要进一步调整');
                    console.log('- 网络或代理问题');
                }
            } else {
                console.log(`❌ 刷新请求失败: ${refreshResponse.status}`);
                const errorText = await refreshResponse.text();
                console.log('错误详情:', errorText);
            }
            
        } else {
            console.log('✅ 当前已经是真实数据!');
            
            // 检查日期是否正确
            const today = new Date().toISOString().split('T')[0];
            if (currentData.date === today) {
                console.log('✅ 日期也是正确的!');
            } else {
                console.log(`⚠️  日期不匹配: 期望 ${today}, 实际 ${currentData.date}`);
            }
        }
        
        // 4. 测试scheduled端点
        console.log('\n4. 测试scheduled端点...');
        const scheduledResponse = await fetch(`${CORRECT_URL}/scheduled`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'your-secret-key-here'
            })
        });
        
        if (scheduledResponse.ok) {
            const scheduledResult = await scheduledResponse.json();
            console.log('✅ Scheduled端点工作正常:', scheduledResult);
        } else {
            console.log(`⚠️  Scheduled端点状态: ${scheduledResponse.status}`);
        }
        
        console.log('\n🎯 总结:');
        console.log(`网站URL: ${CORRECT_URL}`);
        console.log('网站状态: ✅ 可访问');
        console.log('API状态: ✅ 正常');
        console.log('数据状态:', isPlaceholder ? '⚠️  需要更新' : '✅ 正常');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        
        if (error.message.includes('fetch failed')) {
            console.log('\n🔍 网络连接问题，请手动访问:');
            console.log(`${CORRECT_URL}`);
            console.log(`${CORRECT_URL}/api/today`);
        }
    }
}

fixAndTestRealSite();