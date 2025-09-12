// 手动抓取今日谜题的脚本

// 方法1: 调用refresh API
async function refreshTodayPuzzle() {
    console.log('🔄 开始手动刷新今日谜题...');
    
    try {
        const response = await fetch('https://your-website.com/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 刷新成功！');
            console.log('数据源:', result.data.source);
            console.log('日期:', result.data.date);
            console.log('分组数:', result.data.groups.length);
        } else {
            console.log('❌ 刷新失败:', result.message);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ 请求失败:', error);
        return null;
    }
}

// 方法2: 调用scheduled端点
async function triggerScheduledUpdate() {
    console.log('🔄 触发定时更新任务...');
    
    try {
        const response = await fetch('https://your-website.com/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'daily-update',
                secret: 'your-secret-key' // 需要替换为实际的密钥
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 定时任务执行成功！');
            console.log('抓取结果:', result.scrape);
            console.log('文章生成:', result.article);
        } else {
            console.log('❌ 定时任务失败:', result.message);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ 请求失败:', error);
        return null;
    }
}

// 执行刷新
refreshTodayPuzzle();