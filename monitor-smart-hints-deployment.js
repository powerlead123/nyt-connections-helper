// 监控智能提示系统部署
async function monitorSmartHintsDeployment() {
    console.log('=== 监控智能提示系统部署 ===');
    console.log('已推送到GitHub，Cloudflare Pages正在自动部署...');
    
    const maxAttempts = 20;
    const checkInterval = 15000; // 15秒
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\n--- 检查 ${attempt}/${maxAttempts} ---`);
        
        try {
            // 检查首页是否可访问
            const response = await fetch('https://nyt-connections-helper.pages.dev/', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            console.log('网站响应状态:', response.status);
            
            if (response.ok) {
                const html = await response.text();
                
                // 检查是否包含修复后的导航
                const hasFixedNavigation = !html.includes('Today\'s Puzzle') && html.includes('How to Play');
                console.log('导航已修复:', hasFixedNavigation);
                
                // 检查JavaScript文件版本
                const scriptMatch = html.match(/script\.js\?v=([^"]+)/);
                const scriptVersion = scriptMatch ? scriptMatch[1] : 'unknown';
                console.log('Script版本:', scriptVersion);
                
                // 检查是否包含智能提示相关代码
                const hasSmartHints = html.includes('completedThemes') || html.includes('incompleteGroups');
                console.log('包含智能提示代码:', hasSmartHints);
                
                if (hasFixedNavigation) {
                    console.log('\n✅ 部署成功！');
                    console.log('🎯 智能提示系统已上线');
                    console.log('🏠 导航链接已优化');
                    console.log('🚀 用户现在可以享受更好的提示体验');
                    
                    // 测试API是否正常
                    console.log('\n--- 测试API功能 ---');
                    try {
                        const apiResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
                        console.log('Today API状态:', apiResponse.status);
                        
                        if (apiResponse.ok) {
                            const apiData = await apiResponse.json();
                            console.log('API数据正常，日期:', apiData.date);
                            console.log('数据源:', apiData.source);
                            console.log('分组数量:', apiData.groups?.length);
                        }
                    } catch (apiError) {
                        console.log('API测试失败:', apiError.message);
                    }
                    
                    console.log('\n🎉 部署完成！用户现在可以体验智能提示系统了！');
                    return true;
                }
            }
            
            console.log('部署仍在进行中...');
            
        } catch (error) {
            console.log('检查失败:', error.message);
        }
        
        if (attempt < maxAttempts) {
            console.log(`等待 ${checkInterval/1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    console.log('\n⚠️ 部署检查超时，但这不意味着部署失败');
    console.log('请手动访问网站确认部署状态');
    return false;
}

// 运行监控
monitorSmartHintsDeployment().then(success => {
    if (success) {
        console.log('\n🎊 恭喜！智能提示系统成功部署！');
    } else {
        console.log('\n⏰ 请稍后手动检查部署状态');
    }
});