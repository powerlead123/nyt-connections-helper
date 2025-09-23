// 简单状态检查
console.log('=== 简单状态检查 ===');
console.log('当前时间:', new Date().toLocaleString());
console.log('网站地址: https://nyt-connections-hint.pages.dev/');

// 检查关键文件
import { existsSync } from 'fs';
const files = [
    'functions/api/today.js',
    'functions/api/debug-today.js',
    'functions/scheduled.js',
    'wrangler.toml'
];

console.log('\n关键文件状态:');
files.forEach(file => {
    const exists = existsSync(file);
    console.log(`${file}: ${exists ? '✅' : '❌'}`);
});

console.log('\n最近的 git 提交:');
console.log('7b94011 - Add debug today API');
console.log('9645730 - Add KV direct test API');
console.log('e9f7d07 - Add manual store API');

console.log('\n建议操作:');
console.log('1. 在浏览器中访问: https://nyt-connections-hint.pages.dev/');
console.log('2. 测试 API: https://nyt-connections-hint.pages.dev/api/today');
console.log('3. 测试调试 API: https://nyt-connections-hint.pages.dev/api/debug-today');
console.log('4. 如果网站正常，问题可能在本地网络配置');