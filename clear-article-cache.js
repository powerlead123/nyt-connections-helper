// 通过scheduled端点清除文章缓存
const today = new Date().toISOString().split('T')[0];

async function clearArticleCache() {
    console.log('🗑️ 清除文章缓存并重新生成...');
    
    try {
        // 1. 多次触发文章重新生成，直到使用正确数据
        console.log('\n1️⃣ 多次尝试重新生成文章');
        console.log('='.repeat(40));
        
        let attempts = 0;
        const maxAttempts = 10;
        let success = false;
        
        while (attempts < maxAttempts && !success) {
            attempts++;
            console.log(`\n尝试 ${attempts}/${maxAttempts}:`);
            
            // 触发重新生成
            const regenerateResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate-article', secret: 'your-secret-key-here' })
            });
            
            if (regenerateResponse.ok) {
                const result = await regenerateResponse.json();
                console.log(`生成状态: ${result.success ? '成功' : '失败'}`);
                
                // 等待一下
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 检查文章内容
                const articleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}?t=${Date.now()}`);
                if (articleResponse.ok) {
                    const content = await articleResponse.text();
                    
                    // 检查是否包含正确的单词（今日API的单词）
                    const correctWords = ['KICK', 'PUNCH', 'ZEST', 'ZING', 'FREE', 'SINGLE', 'SOLO', 'STAG'];
                    const hasCorrectWords = correctWords.some(word => content.includes(word));
                    
                    // 检查是否还包含备用数据
                    const backupWords = ['NET', 'SNARE', 'TANGLE', 'WEB'];
                    const hasBackupWords = backupWords.some(word => content.includes(word));
                    
                    console.log(`包含正确单词: ${hasCorrectWords ? '✅' : '❌'}`);
                    console.log(`包含备用单词: ${hasBackupWords ? '❌' : '✅'}`);
                    
                    if (hasCorrectWords && !hasBackupWords) {
                        console.log('🎉 成功！文章现在使用正确的数据！');
                        success = true;
                        
                        // 验证所有单词
                        const wordMatches = content.match(/<span class="bg-gray-100[^>]*>([^<]+)<\/span>/g) || [];
                        const articleWords = wordMatches.map(match => match.replace(/<[^>]*>/g, '').trim());
                        
                        console.log(`\n📋 文章中的单词:`);
                        console.log(articleWords.join(', '));
                        
                    } else if (hasCorrectWords && hasBackupWords) {
                        console.log('⚠️ 文章包含混合数据，继续尝试...');
                    } else {
                        console.log('❌ 仍使用备用数据，继续尝试...');
                    }
                }
            } else {
                console.log(`❌ 生成失败: ${regenerateResponse.status}`);
            }
            
            if (!success && attempts < maxAttempts) {
                console.log('等待3秒后重试...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        if (success) {
            console.log('\n✅ 修复成功！');
            console.log('用户现在可以看到一致的谜题数据了。');
            console.log(`\n🔗 验证链接:`);
            console.log(`主页: https://nyt-connections-helper.pages.dev/`);
            console.log(`文章: https://nyt-connections-helper.pages.dev/api/article/${today}`);
        } else {
            console.log('\n❌ 多次尝试后仍未成功');
            console.log('可能需要等待更长时间让代码部署完成');
            
            console.log('\n🔧 手动解决方案:');
            console.log('1. 等待Cloudflare Pages完成部署');
            console.log('2. 或者直接访问文章API，它会自动重新生成');
            console.log('3. 检查浏览器开发者工具的网络请求');
        }
        
    } catch (error) {
        console.error('❌ 清除缓存失败:', error.message);
    }
}

clearArticleCache();