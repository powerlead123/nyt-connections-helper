// 检查正确的部署URL
console.log('🔍 检查部署URL和域名配置...');

// 检查可能的URL
const possibleUrls = [
    'https://connections-helper-chinese.pages.dev',
    'https://nyt-connections-helper.pages.dev', 
    'https://powerlead123.github.io/nyt-connections-helper',
    'https://nyt-connections-helper-powerlead123.pages.dev',
    'https://connections-helper.pages.dev'
];

console.log('📋 可能的部署URL:');
possibleUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
});

console.log('\n🔧 问题分析:');
console.log('DNS_PROBE_FINISHED_NXDOMAIN 错误表示:');
console.log('1. 域名不存在或配置错误');
console.log('2. Cloudflare Pages项目名称可能不同');
console.log('3. 部署可能失败或未完成');

console.log('\n📝 解决方案:');
console.log('1. 检查Cloudflare Pages控制台');
console.log('2. 确认项目的实际域名');
console.log('3. 检查GitHub仓库名称是否正确');

console.log('\n🌐 GitHub仓库信息:');
console.log('仓库名: nyt-connections-helper');
console.log('用户名: powerlead123');
console.log('预期Cloudflare Pages URL: https://nyt-connections-helper.pages.dev');

console.log('\n🎯 下一步操作:');
console.log('1. 登录Cloudflare Pages控制台');
console.log('2. 查看项目列表和实际域名');
console.log('3. 如果项目不存在，重新连接GitHub仓库');
console.log('4. 确认部署状态和构建日志');

// 检查当前git配置
console.log('\n📊 当前Git配置:');
try {
    const { execSync } = require('child_process');
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    console.log('Git远程URL:', remoteUrl);
    
    const repoMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (repoMatch) {
        const [, username, repoName] = repoMatch;
        console.log('用户名:', username);
        console.log('仓库名:', repoName);
        console.log('预期Cloudflare URL:', `https://${repoName}.pages.dev`);
    }
} catch (error) {
    console.log('无法获取Git信息:', error.message);
}

console.log('\n⚠️  重要提醒:');
console.log('如果域名确实不存在，需要:');
console.log('1. 重新在Cloudflare Pages中创建项目');
console.log('2. 连接到GitHub仓库');
console.log('3. 配置构建设置');
console.log('4. 等待首次部署完成');