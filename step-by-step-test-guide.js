console.log('🚀 GitHub Actions 手动触发详细测试指南');
console.log('⏰ 开始时间:', new Date().toLocaleString());
console.log('='.repeat(60));

console.log('\n📋 第一步：访问GitHub仓库');
console.log('1. 打开浏览器（Chrome、Firefox、Edge等）');
console.log('2. 访问网址: https://github.com/powerlead123/nyt-connections-helper');
console.log('3. 确保你已经登录GitHub账号');

console.log('\n📋 第二步：进入Actions页面');
console.log('1. 在仓库页面顶部，找到导航栏');
console.log('2. 点击 "Actions" 标签页（在Code、Issues、Pull requests后面）');
console.log('3. 等待Actions页面加载完成');

console.log('\n📋 第三步：找到工作流');
console.log('1. 在左侧边栏中，查找 "Generate Static Articles" 工作流');
console.log('2. 如果没看到，检查是否有其他类似名称的工作流');
console.log('3. 点击该工作流名称');

console.log('\n📋 第四步：手动触发');
console.log('1. 在工作流页面右上角，找到 "Run workflow" 按钮');
console.log('2. 点击 "Run workflow" 按钮');
console.log('3. 在弹出的对话框中：');
console.log('   - 确认分支选择为 "master" 或 "main"');
console.log('   - 不需要修改其他设置');
console.log('4. 点击绿色的 "Run workflow" 按钮确认');

console.log('\n📋 第五步：监控执行');
console.log('1. 页面会自动刷新，显示新的执行记录');
console.log('2. 执行状态会显示为：');
console.log('   - 🟡 黄色圆点：正在执行');
console.log('   - ✅ 绿色勾号：执行成功');
console.log('   - ❌ 红色叉号：执行失败');
console.log('3. 点击执行记录可以查看详细日志');

console.log('\n📋 第六步：查看执行日志');
console.log('1. 点击最新的执行记录');
console.log('2. 点击 "generate-articles" 作业');
console.log('3. 展开各个步骤查看详细输出：');
console.log('   - Checkout repository');
console.log('   - Setup Node.js');
console.log('   - Install dependencies');
console.log('   - Generate static articles');
console.log('   - Check for changes');
console.log('   - Commit and push changes');

console.log('\n📊 预期的成功日志内容：');
console.log('✅ "🚀 开始高效生成静态文章文件..."');
console.log('✅ "📡 API地址: https://nyt-connections-helper.pages.dev"');
console.log('✅ "📅 扫描范围: 最近5天"');
console.log('✅ "📁 现有文章: X 篇"');
console.log('✅ "📥 智能获取最近5天的文章数据..."');
console.log('✅ "📚 需要处理: X 篇文章" 或 "✅ 没有新文章需要生成"');
console.log('✅ "📋 更新索引页面和站点地图..."');
console.log('✅ "🎉 快速更新完成!"');

console.log('\n📋 第七步：验证结果');
console.log('1. 检查仓库提交历史：');
console.log('   - 回到仓库主页');
console.log('   - 查看最新提交记录');
console.log('   - 如有新文章，会看到类似 "Auto-generate static articles 2025-09-19" 的提交');

console.log('\n2. 检查网站部署：');
console.log('   - 等待2-3分钟让Cloudflare Pages部署');
console.log('   - 访问: https://nyt-connections-helper.pages.dev/articles/');
console.log('   - 查看是否有新文章出现');
console.log('   - 测试文章链接是否正常工作');

console.log('\n⚠️ 可能遇到的情况：');
console.log('1. 如果没有新谜题：');
console.log('   - 日志会显示 "✅ 没有新文章需要生成"');
console.log('   - 这是正常的，说明系统工作正常');
console.log('   - 索引页面和sitemap仍会更新');

console.log('\n2. 如果有新谜题：');
console.log('   - 会生成新的文章文件');
console.log('   - 自动提交到GitHub');
console.log('   - Cloudflare Pages自动部署');
console.log('   - 网站会显示新文章');

console.log('\n🎯 测试成功的标志：');
console.log('✅ GitHub Actions显示绿色成功状态');
console.log('✅ 执行日志完整且无错误');
console.log('✅ 网站可以正常访问');
console.log('✅ 文章页面加载正常');

console.log('\n💡 现在开始测试吧！');
console.log('如果遇到任何问题，请告诉我具体的错误信息。');