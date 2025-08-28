// Cloudflare Workers Cron Trigger Handler
export default {
    async scheduled(event, env, ctx) {
        // 每天早上 6:00 UTC (大约北京时间下午2点) 执行
        console.log('Running daily update cron job...');
        
        try {
            // 调用定时任务函数
            const response = await fetch(`${env.SITE_URL}/functions/scheduled`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'daily-update',
                    secret: env.CRON_SECRET || 'your-secret-key-here'
                })
            });
            
            const result = await response.json();
            console.log('Daily update result:', result);
            
            return result;
            
        } catch (error) {
            console.error('Cron job error:', error);
            throw error;
        }
    }
};