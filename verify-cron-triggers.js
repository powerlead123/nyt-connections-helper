// 验证Cloudflare Cron Triggers是否会自动执行
function verifyCronTriggers() {
    console.log('=== 验证Cloudflare Cron Triggers配置 ===');
    
    console.log('\n--- 当前配置检查 ---');
    console.log('我们刚才部署的配置:');
    console.log('1. functions/scheduled.js - 包含scheduled()函数');
    console.log('2. wrangler.toml - 包含cron配置');
    
    console.log('\n--- 问题分析 ---');
    console.log('🤔 实际上，我们可能遇到了一个问题:');
    console.log('Cloudflare Pages 和 Cloudflare Workers 的Cron Triggers配置不同！');
    
    console.log('\n--- Cloudflare Pages vs Workers ---');
    console.log('❌ Cloudflare Pages Functions:');
    console.log('   - 主要用于HTTP请求处理');
    console.log('   - 不直接支持Cron Triggers');
    console.log('   - wrangler.toml可能不会生效');
    
    console.log('\n✅ Cloudflare Workers:');
    console.log('   - 支持Cron Triggers');
    console.log('   - 需要单独的Worker配置');
    console.log('   - 可以调用Pages Functions');
    
    console.log('\n--- 解决方案选择 ---');
    console.log('我们有几个选择:');
    
    console.log('\n方案1: 使用外部定时服务');
    console.log('  - 使用免费的cron服务（如cron-job.org）');
    console.log('  - 每天定时调用我们的scheduled端点');
    console.log('  - 简单可靠，立即可用');
    
    console.log('\n方案2: 创建Cloudflare Worker');
    console.log('  - 单独创建一个Worker来处理Cron');
    console.log('  - Worker调用Pages的scheduled端点');
    console.log('  - 需要额外配置');
    
    console.log('\n方案3: 修复GitHub Actions');
    console.log('  - 找出为什么GitHub Actions停止工作');
    console.log('  - 重新激活定时任务');
    console.log('  - 使用现有的基础设施');
    
    console.log('\n--- 立即可行的验证方法 ---');
    console.log('让我们先验证scheduled端点是否正常工作:');
    
    return {
        pagesSupportsDirectCron: false,
        needsExternalTrigger: true,
        recommendedSolution: 'external-cron-service'
    };
}

// 测试scheduled端点的完整功能
async function testScheduledEndpoint() {
    console.log('\n=== 测试scheduled端点功能 ===');
    
    try {
        console.log('调用scheduled端点...');
        
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'your-secret-key-here'
            })
        });
        
        console.log('响应状态:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('执行结果:', result);
            
            // 检查是否成功抓取数据
            if (result.success && result.result) {
                const scrapeResult = result.result.scrape;
                const articleResult = result.result.article;
                
                console.log('\n--- 抓取结果分析 ---');
                console.log('数据抓取:', scrapeResult.success ? '✅ 成功' : '❌ 失败');
                console.log('数据源:', scrapeResult.source);
                console.log('单词数量:', scrapeResult.wordsCount);
                
                console.log('\n--- 文章生成结果 ---');
                console.log('文章生成:', articleResult.success ? '✅ 成功' : '❌ 失败');
                console.log('文章长度:', articleResult.articleLength);
                
                if (scrapeResult.source.includes('Backup')) {
                    console.log('\n⚠️ 注意: 当前使用备用数据');
                    console.log('原因: Mashable解析可能失败');
                    console.log('建议: 调试Mashable解析逻辑');
                } else {
                    console.log('\n✅ 成功获取真实数据！');
                }
                
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('测试失败:', error);
        return false;
    }
}

// 推荐外部定时服务设置
function recommendExternalCronService() {
    console.log('\n=== 推荐外部定时服务设置 ===');
    
    console.log('🎯 最简单的解决方案: 使用免费的外部Cron服务');
    
    console.log('\n--- 推荐服务 ---');
    console.log('1. cron-job.org (免费)');
    console.log('   - 网址: https://cron-job.org');
    console.log('   - 免费账户支持每分钟1次调用');
    console.log('   - 可靠性高');
    
    console.log('\n2. EasyCron (免费层)');
    console.log('   - 网址: https://www.easycron.com');
    console.log('   - 免费账户支持每小时1次');
    
    console.log('\n3. Uptime Robot (免费)');
    console.log('   - 网址: https://uptimerobot.com');
    console.log('   - 主要用于监控，但可以用作定时触发');
    
    console.log('\n--- 设置步骤 (以cron-job.org为例) ---');
    console.log('1. 访问 https://cron-job.org 并注册账户');
    console.log('2. 创建新的Cron Job');
    console.log('3. 设置URL: https://nyt-connections-helper.pages.dev/scheduled');
    console.log('4. 设置方法: POST');
    console.log('5. 设置请求体:');
    console.log('   {');
    console.log('     "action": "daily-update",');
    console.log('     "secret": "your-secret-key-here"');
    console.log('   }');
    console.log('6. 设置时间: 每天 01:00 UTC');
    console.log('7. 启用Cron Job');
    
    console.log('\n--- 验证方法 ---');
    console.log('设置完成后，可以通过以下方式验证:');
    console.log('1. 查看cron-job.org的执行日志');
    console.log('2. 检查/api/today的数据源变化');
    console.log('3. 观察网站首页的谜题更新');
    
    console.log('\n✅ 这种方法的优势:');
    console.log('- 立即可用，无需等待');
    console.log('- 不依赖GitHub Actions');
    console.log('- 不需要额外的Cloudflare配置');
    console.log('- 可以查看执行日志');
    console.log('- 免费且可靠');
}

// 运行验证
async function runVerification() {
    const analysis = verifyCronTriggers();
    
    if (analysis.needsExternalTrigger) {
        console.log('\n🎯 结论: 需要外部定时触发服务');
        
        const endpointWorks = await testScheduledEndpoint();
        
        if (endpointWorks) {
            console.log('\n✅ scheduled端点工作正常');
            recommendExternalCronService();
            
            console.log('\n📋 下一步行动:');
            console.log('1. 选择一个外部Cron服务（推荐cron-job.org）');
            console.log('2. 设置每天UTC 01:00的定时任务');
            console.log('3. 明天检查是否自动执行');
            console.log('4. 如果需要，我们可以帮你设置');
            
        } else {
            console.log('\n❌ scheduled端点有问题，需要先修复');
        }
    }
}

// 执行验证
runVerification();