// 深度调试部署问题
async function deepDebugDeployment() {
    console.log('🔍 深度调试Cloudflare Pages部署问题...\n');
    
    const DOMAIN = 'nyt-connections-helper.pages.dev';
    
    // 1. 检查网站返回的实际HTML内容
    console.log('1️⃣ 检查网站HTML内容...');
    try {
        const response = await fetch(`https://${DOMAIN}/?t=${Date.now()}`);
        const html = await response.text();
        
        console.log(`   状态: ${response.status}`);
        console.log(`   HTML长度: ${html.length}`);
        
        // 检查关键元素
        const checks = {
            'script.js引用': html.includes('script.js'),
            'JavaScript代码': html.includes('loadTodaysPuzzle'),
            'API调用': html.includes('/api/today'),
            '硬编码数据': html.includes('NET, SNARE, TANGLE, WEB'),
            'Tailwind CSS': html.includes('tailwindcss.com'),
            '正确的title': html.includes('NYT Connections Game Helper')
        };
        
        console.log('\n   HTML内容检查:');
        Object.entries(checks).forEach(([key, value]) => {
            console.log(`   ${key}: ${value ? '✅' : '❌'}`);
        });
        
        // 提取HTML的关键部分
        console.log('\n   HTML结构分析:');
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const scriptMatches = html.match(/<script[^>]*src="([^"]*)"[^>]*>/g) || [];
        const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        
        console.log(`   Title: ${titleMatch ? titleMatch[1] : '未找到'}`);
        console.log(`   Script标签数量: ${scriptMatches.length}`);
        scriptMatches.forEach((script, i) => {
            console.log(`   Script ${i+1}: ${script}`);
        });
        
        if (bodyContent && bodyContent[1]) {
            const bodyText = bodyContent[1].substring(0, 500);
            console.log(`   Body内容预览: ${bodyText}...`);
        }
        
    } catch (error) {
        console.log(`   ❌ HTML检查失败: ${error.message}`);
    }
    
    // 2. 检查JavaScript文件是否可访问
    console.log('\n2️⃣ 检查JavaScript文件...');
    try {
        const jsResponse = await fetch(`https://${DOMAIN}/script.js?t=${Date.now()}`);
        console.log(`   script.js状态: ${jsResponse.status}`);
        
        if (jsResponse.ok) {
            const jsContent = await jsResponse.text();
            console.log(`   JavaScript长度: ${jsContent.length}`);
            
            const jsChecks = {
                'loadTodaysPuzzle函数': jsContent.includes('loadTodaysPuzzle'),
                'API调用': jsContent.includes('/api/today'),
                'initializePage函数': jsContent.includes('initializePage'),
                '时间戳防缓存': jsContent.includes('Date.now()')
            };
            
            console.log('\n   JavaScript内容检查:');
            Object.entries(jsChecks).forEach(([key, value]) => {
                console.log(`   ${key}: ${value ? '✅' : '❌'}`);
            });
        } else {
            console.log(`   ❌ JavaScript文件无法访问: ${jsResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ JavaScript检查失败: ${error.message}`);
    }
    
    // 3. 检查API端点
    console.log('\n3️⃣ 再次检查API端点...');
    try {
        const apiResponse = await fetch(`https://${DOMAIN}/api/today?t=${Date.now()}`);
        const apiData = await apiResponse.json();
        
        console.log(`   API状态: ${apiResponse.status}`);
        console.log(`   API数据日期: ${apiData.date}`);
        console.log(`   API数据来源: ${apiData.source}`);
        
        const today = new Date().toISOString().split('T')[0];
        console.log(`   今天日期: ${today}`);
        console.log(`   数据是否为今天: ${apiData.date === today ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log(`   ❌ API检查失败: ${error.message}`);
    }
    
    // 4. 检查可能的缓存问题
    console.log('\n4️⃣ 检查缓存问题...');
    try {
        // 尝试不同的缓存绕过方法
        const cacheTests = [
            { name: '普通请求', url: `https://${DOMAIN}/` },
            { name: '时间戳参数', url: `https://${DOMAIN}/?t=${Date.now()}` },
            { name: '随机参数', url: `https://${DOMAIN}/?v=${Math.random()}` },
            { name: 'Cache-Control头', url: `https://${DOMAIN}/`, headers: { 'Cache-Control': 'no-cache' } }
        ];
        
        for (const test of cacheTests) {
            try {
                const response = await fetch(test.url, { headers: test.headers || {} });
                const html = await response.text();
                const hasJS = html.includes('script.js');
                console.log(`   ${test.name}: ${response.status} - JS引用: ${hasJS ? '✅' : '❌'}`);
            } catch (error) {
                console.log(`   ${test.name}: ❌ ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ 缓存测试失败: ${error.message}`);
    }
    
    // 5. 分析问题和解决方案
    console.log('\n5️⃣ 问题分析和解决方案...');
    console.log('\n   可能的问题:');
    console.log('   A. Cloudflare Pages构建配置问题');
    console.log('   B. 文件没有正确上传到仓库');
    console.log('   C. Cloudflare Pages缓存问题');
    console.log('   D. 部署目录配置错误');
    
    console.log('\n   立即解决步骤:');
    console.log('   1. 检查GitHub仓库是否包含所有文件');
    console.log('   2. 检查Cloudflare Pages构建设置');
    console.log('   3. 手动清除Cloudflare缓存');
    console.log('   4. 重新触发部署');
    
    console.log('\n   需要检查的文件:');
    console.log('   - index.html (主页面)');
    console.log('   - script.js (JavaScript逻辑)');
    console.log('   - functions/api/today.js (API端点)');
    console.log('   - functions/scheduled.js (定时任务)');
    
    // 6. 提供具体的修复建议
    console.log('\n6️⃣ 具体修复建议...');
    console.log('\n   立即尝试:');
    console.log('   1. 访问Cloudflare Pages仪表板');
    console.log('   2. 找到你的项目 "nyt-connections-helper"');
    console.log('   3. 点击 "View build log" 查看构建日志');
    console.log('   4. 检查是否有构建错误');
    console.log('   5. 如果需要，点击 "Retry deployment"');
    
    console.log('\n   如果问题持续:');
    console.log('   1. 检查构建设置中的 "Build output directory"');
    console.log('   2. 确保设置为根目录 "/" 或留空');
    console.log('   3. 检查 "Root directory" 设置');
    console.log('   4. 确保 "Build command" 为空或正确');
}

deepDebugDeployment().catch(console.error);