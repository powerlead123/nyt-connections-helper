// 检查主页的文章链接是否已更新
console.log('🔍 检查主页文章链接状态');

async function checkHomepageLinks() {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/');
        const content = await response.text();
        
        console.log('📋 检查主页链接：');
        
        // 检查各个按钮的链接
        const links = {
            'Read Complete Solution Guide': content.match(/href="([^"]*)" class="[^"]*"[^>]*>[\s\S]*?📚 Read Complete Solution Guide/),
            'Latest Solution': content.match(/href="([^"]*)" class="[^"]*"[^>]*>[\s\S]*?📄 Latest Solution/),
            'Yesterday\'s': content.match(/href="([^"]*)" class="[^"]*"[^>]*>[\s\S]*?📅 Yesterday's/)
        };
        
        Object.entries(links).forEach(([name, match]) => {
            if (match && match[1]) {
                const link = match[1];
                console.log(`   ${name}: ${link}`);
                
                // 检查是否是最新日期
                if (link.includes('2025-09-22')) {
                    console.log(`     ✅ 指向最新文章 (9月22日)`);
                } else if (link.includes('2025-09-21')) {
                    console.log(`     ✅ 指向昨天文章 (9月21日)`);
                } else {
                    console.log(`     ⚠️  可能不是最新链接`);
                }
            } else {
                console.log(`   ${name}: 未找到链接`);
            }
        });
        
        console.log('');
        console.log('💡 如果链接显示正确但你看到的是旧链接：');
        console.log('1. 按 Ctrl+F5 强制刷新主页');
        console.log('2. 或者清除浏览器缓存');
        console.log('3. 或者使用无痕模式访问');
        
    } catch (error) {
        console.log(`❌ 检查失败: ${error.message}`);
    }
}

checkHomepageLinks().catch(console.error);