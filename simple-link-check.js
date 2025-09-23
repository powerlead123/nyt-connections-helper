// 简单检查主页链接
async function checkLinks() {
    try {
        const response = await fetch('https://nyt-connections-helper.pages.dev/');
        const html = await response.text();
        
        console.log('🔍 检查主页中的文章链接：');
        
        // 查找所有包含日期的链接
        const dateLinks = html.match(/\/articles\/\d{4}-\d{2}-\d{2}\.html/g);
        
        if (dateLinks) {
            const uniqueLinks = [...new Set(dateLinks)];
            console.log('📋 找到的文章链接：');
            uniqueLinks.forEach(link => {
                console.log(`   ${link}`);
            });
            
            // 检查是否包含最新日期
            const hasLatest = uniqueLinks.some(link => link.includes('2025-09-22'));
            const hasYesterday = uniqueLinks.some(link => link.includes('2025-09-21'));
            
            console.log('');
            console.log('📊 链接状态：');
            console.log(`   最新文章 (9月22日): ${hasLatest ? '✅ 存在' : '❌ 缺失'}`);
            console.log(`   昨天文章 (9月21日): ${hasYesterday ? '✅ 存在' : '❌ 缺失'}`);
            
        } else {
            console.log('❌ 未找到任何文章链接');
        }
        
    } catch (error) {
        console.log(`❌ 检查失败: ${error.message}`);
    }
}

checkLinks();