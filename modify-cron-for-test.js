const fs = require('fs');

console.log('⏰ 临时修改定时时间进行测试');

// 计算5分钟后的UTC时间
const now = new Date();
const testTime = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟后
const utcHour = testTime.getUTCHours();
const utcMinute = testTime.getUTCMinutes();

console.log(`当前UTC时间: ${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`);
console.log(`建议测试时间: ${utcHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')} UTC`);
console.log(`需要修改cron为: '${utcMinute} ${utcHour} * * *'`);

// 读取当前工作流文件
const workflowPath = '.github/workflows/generate-static-articles.yml';
if (fs.existsSync(workflowPath)) {
    let content = fs.readFileSync(workflowPath, 'utf8');
    
    // 显示当前的cron设置
    const cronMatch = content.match(/cron:\s*['"]([^'"]+)['"]/);
    if (cronMatch) {
        console.log(`\n当前cron设置: ${cronMatch[1]}`);
        console.log(`新的cron设置: ${utcMinute} ${utcHour} * * *`);
        
        console.log('\n🔧 修改步骤:');
        console.log('1. 编辑 .github/workflows/generate-static-articles.yml');
        console.log(`2. 将 cron: '${cronMatch[1]}' 改为 cron: '${utcMinute} ${utcHour} * * *'`);
        console.log('3. 提交更改到GitHub');
        console.log('4. 等待定时触发');
        console.log('5. 测试完成后记得改回原来的时间！');
    }
} else {
    console.log('❌ 工作流文件不存在');
}

console.log('\n⚠️ 重要提醒:');
console.log('- 测试完成后务必改回原来的定时时间');
console.log('- GitHub Actions可能有几分钟延迟');
console.log('- 推荐使用方法1进行快速测试');