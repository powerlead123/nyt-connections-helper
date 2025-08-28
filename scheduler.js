const ConnectionsAutoScraper = require('./auto-scraper');
const fs = require('fs').promises;

class DataScheduler {
    constructor() {
        this.scraper = new ConnectionsAutoScraper();
        this.isRunning = false;
        this.lastFetchTime = null;
        this.retryCount = 0;
        this.maxRetries = 5;
    }

    // 启动定时任务
    start() {
        console.log('🚀 启动自动数据获取调度器...');
        
        // 立即尝试获取一次
        this.fetchData();
        
        // 每小时检查一次
        setInterval(() => {
            this.checkAndFetch();
        }, 60 * 60 * 1000); // 1小时
        
        // 每天早上6点强制刷新
        this.scheduleDailyRefresh();
    }

    // 检查并获取数据
    async checkAndFetch() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        try {
            // 检查是否已有今日数据
            const cache = await this.readCache();
            
            if (!cache[today] || this.shouldRefresh(cache[today])) {
                console.log('📅 需要获取今日数据...');
                await this.fetchData();
            } else {
                console.log('✅ 今日数据已存在，无需更新');
            }
        } catch (error) {
            console.error('检查数据时出错:', error);
        }
    }

    // 获取数据
    async fetchData() {
        if (this.isRunning) {
            console.log('⏳ 数据获取正在进行中...');
            return;
        }

        this.isRunning = true;
        
        try {
            console.log('🔄 开始获取数据...');
            const data = await this.scraper.autoFetch();
            
            if (data) {
                await this.saveData(data);
                console.log('💾 数据保存成功!');
                console.log(`📊 来源: ${data.source}`);
                console.log(`📅 日期: ${data.date}`);
                
                this.retryCount = 0;
                this.lastFetchTime = new Date();
                
                // 显示获取到的数据
                data.groups.forEach((group, index) => {
                    console.log(`${index + 1}. ${group.theme}: ${group.words.join(', ')}`);
                });
                
            } else {
                console.log('❌ 未能获取到数据');
                await this.handleFetchFailure();
            }
            
        } catch (error) {
            console.error('获取数据时出错:', error);
            await this.handleFetchFailure();
        } finally {
            this.isRunning = false;
        }
    }

    // 处理获取失败
    async handleFetchFailure() {
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // 指数退避，最大30秒
            console.log(`🔄 ${retryDelay/1000}秒后重试 (${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.fetchData();
            }, retryDelay);
        } else {
            console.log('❌ 达到最大重试次数，使用备用数据');
            await this.useFallbackData();
            this.retryCount = 0;
        }
    }

    // 使用备用数据
    async useFallbackData() {
        const fallbackData = {
            date: new Date().toISOString().split('T')[0],
            words: [
                'APPLE', 'BANANA', 'ORANGE', 'GRAPE',
                'RED', 'BLUE', 'GREEN', 'YELLOW',
                'CAT', 'DOG', 'BIRD', 'FISH',
                'SOCCER', 'TENNIS', 'GOLF', 'BOXING'
            ],
            groups: [
                {
                    theme: '水果',
                    words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE'],
                    difficulty: 'green',
                    hint: '这些都是常见的水果'
                },
                {
                    theme: '颜色',
                    words: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
                    difficulty: 'yellow',
                    hint: '这些都是基本颜色'
                },
                {
                    theme: '动物',
                    words: ['CAT', 'DOG', 'BIRD', 'FISH'],
                    difficulty: 'blue',
                    hint: '这些都是常见的动物'
                },
                {
                    theme: '运动',
                    words: ['SOCCER', 'TENNIS', 'GOLF', 'BOXING'],
                    difficulty: 'purple',
                    hint: '这些都是体育运动'
                }
            ],
            source: 'Fallback Data'
        };

        await this.saveData(fallbackData);
        console.log('💾 备用数据已保存');
    }

    // 判断是否需要刷新
    shouldRefresh(data) {
        // 如果数据来源是备用数据，总是尝试刷新
        if (data.source === 'Fallback Data') {
            return true;
        }
        
        // 如果数据超过12小时，尝试刷新
        const dataTime = new Date(data.timestamp || data.date);
        const now = new Date();
        const hoursDiff = (now - dataTime) / (1000 * 60 * 60);
        
        return hoursDiff > 12;
    }

    // 安排每日刷新
    scheduleDailyRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0); // 早上6点
        
        const msUntilTomorrow = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            console.log('🌅 每日定时刷新开始...');
            this.fetchData();
            
            // 设置每日重复
            setInterval(() => {
                console.log('🌅 每日定时刷新开始...');
                this.fetchData();
            }, 24 * 60 * 60 * 1000); // 24小时
            
        }, msUntilTomorrow);
        
        console.log(`⏰ 下次自动刷新时间: ${tomorrow.toLocaleString()}`);
    }

    // 读取缓存
    async readCache() {
        try {
            const data = await fs.readFile('connections_cache.json', 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    // 保存数据
    async saveData(data) {
        const cache = await this.readCache();
        
        // 添加时间戳
        data.timestamp = new Date().toISOString();
        
        cache[data.date] = data;
        
        // 只保留最近30天的数据
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(cache).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete cache[date];
            }
        });
        
        await fs.writeFile('connections_cache.json', JSON.stringify(cache, null, 2));
    }

    // 手动触发获取
    async manualFetch() {
        console.log('🔄 手动触发数据获取...');
        this.retryCount = 0; // 重置重试计数
        await this.fetchData();
    }

    // 获取状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastFetchTime: this.lastFetchTime,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries
        };
    }
}

module.exports = DataScheduler;