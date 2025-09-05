// 监控部署状态并测试新功能
const today = new Date().toISOString().split('T')[0];

async function monitorDeployment() {
    console.log('🚀 监控部署状态...');
    console.log(`测试日期: ${today}`);
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    
    let attempts = 0;
    const maxAttempts = 20; // 最多检查20次
    const interval = 30000; // 每30秒检查一次
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔍 第 ${attempts} 次检查 (${new Date().toLocaleTimeString()})`);
        
        try {
            // 1. 测试scheduled端点是否使用新代码
            console.log('检查scheduled端点...');
            const scheduledResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate-article', secret: 'your-secret-key-here' })
            });
            
            if (scheduledResponse.ok) {
                const result = await scheduledResponse.json();
                console.log(`✅ Scheduled端点响应正常: ${result.result?.articleLength} 字符`);
                
                // 2. 等待一下，然后检查生成的文章格式
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const articleResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
                if (articleResponse.ok) {
                    const content = await articleResponse.text();
                    const isHTML = content.includes('<!DOCTYPE html>');
                    const isMarkdown = content.includes('# NYT Connections') && !content.includes('<html');
                    const hasTailwind = content.includes('tailwindcss.com');
                    const hasStructuredData = content.includes('application/ld+json');
                    
                    console.log(`文章长度: ${content.length} 字符`);
                    console.log(`HTML格式: ${isHTML ? '✅' : '❌'}`);
                    console.log(`Markdown格式: ${isMarkdown ? '⚠️' : '✅'}`);
                    console.log(`Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`);
                    console.log(`结构化数据: ${hasStructuredData ? '✅' : '❌'}`);
                    
                    if (isHTML && hasTailwind && hasStructuredData) {
                        console.log('\n🎉 部署成功！新的HTML格式已生效！');
                        
                        // 显示文章预览
                        console.log('\n📄 文章预览:');
                        console.log('='.repeat(60));
                        console.log(content.substring(0, 500));
                        console.log('='.repeat(60));
                        
                        // 最终验证
                        await performFinalValidation();
                        return;
                    } else if (isMarkdown) {
                        console.log('⏳ 仍在使用旧版本，继续等待...');
                    } else {
                        console.log('⚠️ 文章格式异常，继续监控...');
                    }
                } else {
                    console.log('❌ 无法获取文章内容');
                }
            } else {
                console.log(`❌ Scheduled端点错误: ${scheduledResponse.status}`);
            }
            
        } catch (error) {
            console.log(`❌ 检查失败: ${error.message}`);
        }
        
        if (attempts < maxAttempts) {
            console.log(`⏳ 等待 ${interval/1000} 秒后继续检查...`);
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    
    console.log('\n⏰ 达到最大检查次数，停止监控');
    console.log('💡 可能需要更长时间部署，请稍后手动检查');
}

async function performFinalValidation() {
    console.log('\n🔍 执行最终验证...');
    
    try {
        // 检查文章的所有重要元素
        const response = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        if (response.ok) {
            const content = await response.text();
            
            const checks = {
                'HTML文档类型': content.includes('<!DOCTYPE html>'),
                '页面标题': content.includes('<title>NYT Connections'),
                'Meta描述': content.includes('meta name="description"'),
                'Open Graph': content.includes('og:title'),
                'Tailwind CSS': content.includes('tailwindcss.com'),
                '结构化数据': content.includes('application/ld+json'),
                '响应式设计': content.includes('viewport'),
                '颜色emoji': content.includes('🟡') && content.includes('🟢') && content.includes('🔵') && content.includes('🟣'),
                '分组内容': content.includes('Complete Answers'),
                '策略提示': content.includes('Strategy Tips'),
                '关于部分': content.includes('About NYT Connections'),
                '页脚': content.includes('footer')
            };
            
            console.log('\n📋 验证结果:');
            let passedChecks = 0;
            const totalChecks = Object.keys(checks).length;
            
            for (const [check, passed] of Object.entries(checks)) {
                console.log(`${passed ? '✅' : '❌'} ${check}`);
                if (passed) passedChecks++;
            }
            
            console.log(`\n📊 总体评分: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
            
            if (passedChecks === totalChecks) {
                console.log('🎉 所有检查通过！文章生成功能完美运行！');
            } else if (passedChecks >= totalChecks * 0.8) {
                console.log('✅ 大部分功能正常，有少量问题需要关注');
            } else {
                console.log('⚠️ 存在较多问题，需要进一步检查');
            }
            
        } else {
            console.log('❌ 无法获取文章进行验证');
        }
        
    } catch (error) {
        console.error('验证过程出错:', error.message);
    }
}

// 开始监控
monitorDeployment().catch(console.error);