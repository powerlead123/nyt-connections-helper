const cron = require('node-cron');
const ArticleGenerator = require('./article-generator');
// 导入数据获取功能
async function loadTodaysPuzzle() {
    try {
        // 直接使用优化的解析器
        const FixedConnectionsParser = require('./fixed-parser.js');
        const parser = new FixedConnectionsParser();
        const data = await parser.fetchMashableData();
        
        if (data && data.groups && data.groups.length === 4) {
            console.log('✅ 使用最新解析数据');
            return data;
        }
        
        // 如果解析失败，使用备用数据
        return {
            date: new Date().toISOString().split('T')[0],
            words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT', 'SPRING', 'SUMMER', 'FALL', 'WINTER', 'MARS', 'SNICKERS', 'TWIX', 'KITKAT', 'APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
            groups: [
                {
                    theme: 'Fish Types',
                    words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT'],
                    difficulty: 'yellow',
                    hint: 'These are all types of fish you might find on a restaurant menu'
                },
                {
                    theme: 'Seasons',
                    words: ['SPRING', 'SUMMER', 'FALL', 'WINTER'],
                    difficulty: 'green',
                    hint: 'The four periods of the year'
                },
                {
                    theme: 'Candy Bars',
                    words: ['MARS', 'SNICKERS', 'TWIX', 'KITKAT'],
                    difficulty: 'blue',
                    hint: 'Popular chocolate bar brands'
                },
                {
                    theme: 'Tech Companies',
                    words: ['APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
                    difficulty: 'purple',
                    hint: 'Major technology corporations'
                }
            ]
        };
    } catch (error) {
        console.log('Using fallback puzzle data');
        return {
            date: new Date().toISOString().split('T')[0],
            words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT', 'SPRING', 'SUMMER', 'FALL', 'WINTER', 'MARS', 'SNICKERS', 'TWIX', 'KITKAT', 'APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
            groups: [
                {
                    theme: 'Fish Types',
                    words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT'],
                    difficulty: 'yellow',
                    hint: 'These are all types of fish you might find on a restaurant menu'
                },
                {
                    theme: 'Seasons',
                    words: ['SPRING', 'SUMMER', 'FALL', 'WINTER'],
                    difficulty: 'green',
                    hint: 'The four periods of the year'
                },
                {
                    theme: 'Candy Bars',
                    words: ['MARS', 'SNICKERS', 'TWIX', 'KITKAT'],
                    difficulty: 'blue',
                    hint: 'Popular chocolate bar brands'
                },
                {
                    theme: 'Tech Companies',
                    words: ['APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
                    difficulty: 'purple',
                    hint: 'Major technology corporations'
                }
            ]
        };
    }
}

class DailyArticleScheduler {
    constructor() {
        this.articleGenerator = new ArticleGenerator();
        this.isRunning = false;
    }

    start() {
        console.log('🚀 Starting daily article scheduler...');
        
        // Schedule for 6:00 AM EST every day (after NYT publishes)
        cron.schedule('0 6 * * *', async () => {
            await this.generateTodaysArticle();
        }, {
            scheduled: true,
            timezone: "America/New_York"
        });

        // Also schedule a backup run at 8:00 AM EST
        cron.schedule('0 8 * * *', async () => {
            await this.generateTodaysArticle(true);
        }, {
            scheduled: true,
            timezone: "America/New_York"
        });

        console.log('✅ Daily article scheduler started');
        console.log('📅 Articles will be generated at 6:00 AM and 8:00 AM EST');
    }

    async generateTodaysArticle(isBackup = false) {
        if (this.isRunning) {
            console.log('⏳ Article generation already in progress...');
            return;
        }

        this.isRunning = true;
        
        try {
            console.log(`${isBackup ? '🔄 Backup run:' : '📝'} Generating today's article...`);
            
            // Load today's puzzle data
            const puzzleData = await loadTodaysPuzzle();
            
            if (!puzzleData || !puzzleData.groups) {
                throw new Error('No puzzle data available');
            }

            // Check if article already exists for today
            const today = new Date();
            const dateStr = this.formatDateForFilename(today);
            const articleExists = await this.checkArticleExists(dateStr);
            
            if (articleExists && !isBackup) {
                console.log('📄 Article already exists for today');
                return;
            }

            // Generate the article
            const article = await this.articleGenerator.generateDailyArticle(puzzleData, today);
            
            // Generate social media content
            await this.generateSocialContent(article, puzzleData);
            
            // Update RSS feed
            await this.updateRSSFeed(article);
            
            console.log('✅ Daily article generation completed successfully!');
            
            // Send notification (optional)
            await this.sendNotification(article);
            
        } catch (error) {
            console.error('❌ Failed to generate daily article:', error);
            
            // Send error notification
            await this.sendErrorNotification(error);
        } finally {
            this.isRunning = false;
        }
    }

    async checkArticleExists(dateStr) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const filename = `connections-${dateStr}.md`;
            const filepath = path.join('./articles', filename);
            await fs.access(filepath);
            return true;
        } catch {
            return false;
        }
    }

    async generateSocialContent(article, puzzleData) {
        const socialContent = {
            twitter: this.generateTwitterPost(article, puzzleData),
            facebook: this.generateFacebookPost(article, puzzleData),
            linkedin: this.generateLinkedInPost(article, puzzleData)
        };

        // Save social content for manual posting or API integration
        const fs = require('fs').promises;
        const socialPath = `./social/social-${this.formatDateForFilename(new Date())}.json`;
        
        await fs.mkdir('./social', { recursive: true });
        await fs.writeFile(socialPath, JSON.stringify(socialContent, null, 2));
        
        console.log('📱 Social media content generated');
    }

    generateTwitterPost(article, puzzleData) {
        const themes = puzzleData.groups.map(g => g.theme).slice(0, 2).join(' & ');
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return `🧩 ${date} NYT Connections solved! 

Today's themes: ${themes} and more!

🟢 Easy to 🟣 Tricky - we've got all the answers and explanations.

Need hints? Try our AI helper! 🤖

${article.meta.canonical}

#NYTConnections #WordPuzzle #PuzzleGame`;
    }

    generateFacebookPost(article, puzzleData) {
        const date = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        
        return `🧩 ${date} NYT Connections - Complete Solutions!

Stuck on today's word grouping puzzle? We've got you covered with:
✅ All 4 group answers
💡 Detailed explanations  
🎯 Solving strategies
🤖 AI-powered hints

Today's puzzle features some clever wordplay - don't let it stump you!

Check out our complete guide: ${article.meta.canonical}`;
    }

    generateLinkedInPost(article, puzzleData) {
        return `Daily brain training with NYT Connections! 🧠

Today's puzzle showcases the beauty of language and word associations. Our comprehensive guide breaks down each group with detailed explanations.

Perfect for:
• Daily mental exercise
• Vocabulary building  
• Pattern recognition skills
• Fun team building activity

What's your solving strategy? Share in the comments!

${article.meta.canonical}`;
    }

    async updateRSSFeed(article) {
        const fs = require('fs').promises;
        const rssPath = './rss.xml';
        
        try {
            let rss = await fs.readFile(rssPath, 'utf8');
            
            const newItem = `
        <item>
            <title>${article.title}</title>
            <link>https://yoursite.com${article.meta.canonical}</link>
            <description>${article.meta.description}</description>
            <pubDate>${new Date().toUTCString()}</pubDate>
            <guid>https://yoursite.com${article.meta.canonical}</guid>
        </item>`;

            // Insert after opening <channel>
            rss = rss.replace('<channel>', '<channel>' + newItem);
            
            await fs.writeFile(rssPath, rss, 'utf8');
            console.log('📡 RSS feed updated');
        } catch (error) {
            console.error('❌ Failed to update RSS feed:', error);
        }
    }

    async sendNotification(article) {
        // Placeholder for notification system
        // Could integrate with Slack, Discord, email, etc.
        console.log(`📧 Notification: New article published - ${article.title}`);
    }

    async sendErrorNotification(error) {
        // Placeholder for error notification
        console.log(`🚨 Error notification: Article generation failed - ${error.message}`);
    }

    formatDateForFilename(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Manual trigger for testing
    async generateNow() {
        console.log('🔧 Manual article generation triggered...');
        await this.generateTodaysArticle();
    }
}

// CLI interface
if (require.main === module) {
    const scheduler = new DailyArticleScheduler();
    
    const command = process.argv[2];
    
    if (command === 'start') {
        scheduler.start();
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n👋 Shutting down scheduler...');
            process.exit(0);
        });
        
    } else if (command === 'generate') {
        scheduler.generateNow().then(() => {
            console.log('✅ Manual generation completed');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Manual generation failed:', error);
            process.exit(1);
        });
        
    } else {
        console.log(`
Usage:
  node daily-article-scheduler.js start     # Start the daily scheduler
  node daily-article-scheduler.js generate  # Generate article now
        `);
    }
}

module.exports = DailyArticleScheduler;