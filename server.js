/**
 * Simple server for NYT Connections Helper
 * This server handles API requests and scheduled data scraping
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs').promises;
const ArticleGenerator = require('./public/js/article-generator');

// Initialize app
const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = 'https://mashable.com';

// Use middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files from root directory

// 添加tips路由
app.get('/tips', (req, res) => {
    res.sendFile(path.join(__dirname, 'tips.html'));
});

// Data storage (in production, use a proper database)
global.puzzleData = {
    latest: null,
    archive: []
};

// 缓存配置
const cacheConfig = {
    enabled: true,
    ttl: 5 * 60 * 1000, // 缓存有效期（5分钟）
    archiveCache: new Map(),
    lastCacheTime: null
};

// Load initial data if exists
async function loadInitialData() {
    try {
        console.log('Loading existing puzzle data');
        const dataFilePath = path.join(__dirname, 'data', 'puzzles.json');
        
        // 检查文件是否存在
        try {
            await fs.access(dataFilePath);
            console.log('Data file exists, loading data');
            
            // 读取文件内容
            const rawData = await fs.readFile(dataFilePath, 'utf8');
            const loadedData = JSON.parse(rawData);
            
            // 检查数据是否有效
            if (!loadedData || !loadedData.archive || !Array.isArray(loadedData.archive)) {
                console.warn('Invalid data structure, initializing new data');
                global.puzzleData = { latest: null, archive: [] };
                await saveData();
            } else {
                // 检查最新数据的日期是否是今天
                const today = new Date();
                const todayFormatted = formatDate(today);
                
                if (loadedData.latest && loadedData.latest.date === todayFormatted) {
                    console.log('Found valid data for today');
                    global.puzzleData = loadedData;
                } else {
                    console.log('Latest data is not from today, initializing new data');
                    global.puzzleData = { 
                        latest: null,
                        archive: loadedData.archive // 保留存档数据
                    };
                    await saveData();
                }
            }
            
            console.log('Data loaded successfully:', 
                global.puzzleData.latest ? `Latest puzzle: ${global.puzzleData.latest.date}` : 'No latest puzzle',
                `Archive count: ${global.puzzleData.archive.length}`);
            
        } catch (err) {
            // 文件不存在，创建新数据结构
            if (err.code === 'ENOENT') {
                console.log('No existing puzzle data found, creating new file');
                global.puzzleData = { latest: null, archive: [] };
                await saveData();
                console.log('Created new empty data file');
            } else {
                throw err;
            }
        }
    } catch (error) {
        console.error('Error loading puzzle data:', error);
        global.puzzleData = { latest: null, archive: [] };
        try {
            await saveData();
            console.log('Initialized empty data structure after error');
        } catch (saveError) {
            console.error('Failed to save initial empty data:', saveError);
            throw saveError;
        }
    }
}

// API routes
app.get('/api/today', async (req, res) => {
    // 设置不缓存的响应头
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // 只在管理员手动请求时尝试刷新数据
    const isAdmin = req.query.admin === 'true';
    const shouldRefresh = isAdmin && req.query.refresh === 'true';
    
    if (shouldRefresh) {
        console.log('管理员请求刷新数据');
        try {
            const newPuzzle = await scrapeDailyPuzzle();
            console.log('数据刷新完成:', newPuzzle.isSampleData ? '返回示例数据' : '获取新数据');
        } catch (error) {
            console.error('强制刷新失败:', error);
        }
    }
    
    if (global.puzzleData.latest) {
        // 返回克隆对象避免修改原始数据
        const responseData = JSON.parse(JSON.stringify(global.puzzleData.latest));
        res.json(responseData);
    } else {
        res.status(404).json({ error: 'No puzzle data available yet' });
    }
});

// 扩展存档数据结构
function extendPuzzleData(puzzleData) {
    return {
        ...puzzleData,
        metadata: {
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            accessCount: 0,
            completionStats: {
                totalAttempts: 0,
                successfulAttempts: 0,
                averageTime: 0,
                totalTime: 0
            }
        }
    };
}

// 更新访问统计
async function updateAccessStats(puzzleDate) {
    try {
        const puzzle = global.puzzleData.archive.find(p => p.date === puzzleDate);
        if (puzzle && puzzle.metadata) {
            puzzle.metadata.lastAccessed = new Date().toISOString();
            puzzle.metadata.accessCount++;
            await saveData();
        }
    } catch (error) {
        console.error('更新访问统计失败:', error);
    }
}

// 更新完成统计
async function updateCompletionStats(puzzleDate, timeSpent, isSuccess) {
    try {
        const puzzle = global.puzzleData.archive.find(p => p.date === puzzleDate);
        if (puzzle && puzzle.metadata) {
            const stats = puzzle.metadata.completionStats;
            stats.totalAttempts++;
            if (isSuccess) {
                stats.successfulAttempts++;
            }
            stats.totalTime += timeSpent;
            stats.averageTime = stats.totalTime / stats.totalAttempts;
            await saveData();
        }
    } catch (error) {
        console.error('更新完成统计失败:', error);
    }
}

// 获取存档列表（带缓存）
async function getArchiveList(filters = {}) {
    // 检查缓存是否有效
    if (cacheConfig.enabled && 
        cacheConfig.lastCacheTime && 
        Date.now() - cacheConfig.lastCacheTime < cacheConfig.ttl) {
        const cachedData = cacheConfig.archiveCache.get(JSON.stringify(filters));
        if (cachedData) {
            return cachedData;
        }
    }

    // 获取并过滤数据
    let filteredPuzzles = [...global.puzzleData.archive];
    
    if (filters.month) {
        filteredPuzzles = filteredPuzzles.filter(puzzle => {
            const puzzleDate = new Date(puzzle.date);
            return puzzleDate.getMonth() === filters.month - 1;
        });
    }
    
    if (filters.difficulty) {
        filteredPuzzles = filteredPuzzles.filter(puzzle => 
            puzzle.difficulty === filters.difficulty
        );
    }
    
    // 按日期降序排序（从新到旧）
    filteredPuzzles.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    // 添加统计信息
    const archiveWithStats = filteredPuzzles.map(puzzle => ({
        ...puzzle,
        stats: {
            completionRate: puzzle.metadata ? 
                (puzzle.metadata.completionStats.successfulAttempts / 
                 puzzle.metadata.completionStats.totalAttempts) || 0 : 0,
            averageTime: puzzle.metadata ? 
                puzzle.metadata.completionStats.averageTime || 0 : 0,
            popularity: puzzle.metadata ? 
                puzzle.metadata.accessCount || 0 : 0
        }
    }));
    
    // 更新缓存
    if (cacheConfig.enabled) {
        cacheConfig.archiveCache.set(JSON.stringify(filters), archiveWithStats);
        cacheConfig.lastCacheTime = Date.now();
    }
    
    return archiveWithStats;
}

// 清除缓存
function clearArchiveCache() {
    cacheConfig.archiveCache.clear();
    cacheConfig.lastCacheTime = null;
}

// 修改API路由
app.get('/api/archive', async (req, res) => {
    try {
        // 设置不缓存的响应头
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        const filters = {
            month: req.query.month ? parseInt(req.query.month) : null,
            difficulty: req.query.difficulty || null
        };
        
        // 检查缓存
        if (cacheConfig.enabled && 
            cacheConfig.lastCacheTime && 
            Date.now() - cacheConfig.lastCacheTime < cacheConfig.ttl) {
            const cachedData = cacheConfig.archiveCache.get(JSON.stringify(filters));
            if (cachedData) {
                return res.json(cachedData);
            }
        }
        
        // 获取并过滤数据
        let filteredPuzzles = [...global.puzzleData.archive];
        
        if (filters.month) {
            filteredPuzzles = filteredPuzzles.filter(puzzle => {
                const puzzleDate = new Date(puzzle.date);
                return puzzleDate.getMonth() === filters.month - 1;
            });
        }
        
        if (filters.difficulty) {
            filteredPuzzles = filteredPuzzles.filter(puzzle => 
                puzzle.difficulty === filters.difficulty
            );
        }
        
        // 添加统计信息
        const archiveWithStats = filteredPuzzles.map(puzzle => ({
            ...puzzle,
            stats: {
                completionRate: puzzle.metadata ? 
                    (puzzle.metadata.completionStats.successfulAttempts / 
                     puzzle.metadata.completionStats.totalAttempts) || 0 : 0,
                averageTime: puzzle.metadata ? 
                    puzzle.metadata.completionStats.averageTime || 0 : 0,
                popularity: puzzle.metadata ? 
                    puzzle.metadata.accessCount || 0 : 0
            }
        }));
        
        // 分页
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const response = {
            totalPuzzles: archiveWithStats.length,
            totalPages: Math.ceil(archiveWithStats.length / limit),
            currentPage: page,
            puzzles: archiveWithStats.slice(startIndex, endIndex)
        };
        
        // 更新缓存
        if (cacheConfig.enabled) {
            cacheConfig.archiveCache.set(JSON.stringify(filters), response);
            cacheConfig.lastCacheTime = Date.now();
        }
        
        res.json(response);
    } catch (error) {
        console.error('获取存档列表失败:', error);
        res.status(500).json({ error: '获取存档列表失败' });
    }
});

app.get('/api/puzzle/:date', (req, res) => {
    // 设置不缓存的响应头
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const requestedDate = req.params.date;
    
    // Check if it's today's puzzle
    if (global.puzzleData.latest && isSameDate(global.puzzleData.latest.date, requestedDate)) {
        return res.json(global.puzzleData.latest);
    }
    
    // Search in archive
    const puzzle = global.puzzleData.archive.find(p => isSameDate(p.date, requestedDate));
    
    if (puzzle) {
        res.json(puzzle);
    } else {
        res.status(404).json({ error: 'Puzzle not found for the specified date' });
    }
});

// Trigger manual scrape (would be scheduled in production)
app.post('/api/scrape', async (req, res) => {
    try {
        await scrapeDailyPuzzle();
        res.json({ success: true, message: 'Scrape completed successfully' });
    } catch (error) {
        console.error('Detailed scrape error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.stack,
            time: new Date().toISOString(),
            nextScheduled: getNextScheduledScrape() 
        });
    }
});

// Helper function to compare dates (ignoring time)
function isSameDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
}

// Helper function to format date for general use (e.g. YYYY-MM-DD)
function formatDate(date) {
    const d = date || new Date();
    return d.toISOString().split('T')[0];
}

// Helper function to format date for URL (e.g. april-16-2024)
function formatDateForUrl() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return { year, month, day };
}

// OpenRouter API configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * 直接从Mashable文章URL抓取NYT Connections谜题数据
 */
async function scrapeDailyPuzzle() {
    try {
        const { year, month, day } = formatDateForUrl();
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = monthNames[month - 1];
        const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
        console.log(`Scraping puzzle from: ${url}`);

        // 尝试从Mashable获取数据
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // 查找包含答案的部分
        const answerSection = $('h2:contains("What is the answer to Connections today")').next();
        
        if (!answerSection.length) {
            console.log('Could not find answer section, returning sample data');
            return getDefaultSampleData();
        }

        // 解析答案部分
        let categories = [];
        
        // 查找答案行
        const answerLines = answerSection.find('li').toArray();
        
        if (answerLines.length !== 4) {
            console.log('Could not find correct number of categories, returning sample data');
            return getDefaultSampleData();
        }
        
        // 处理每个类别
        answerLines.forEach(line => {
            const text = $(line).text().trim();
            const parts = text.split(':');
            
            if (parts.length !== 2) {
                console.warn('Invalid answer line format:', text);
                return;
            }
            
            const categoryName = parts[0].trim();
            const wordsText = parts[1].trim();
            const words = wordsText.split(',').map(word => word.trim());
            
            if (words.length !== 4) {
                console.warn('Invalid word count for category:', categoryName);
                return;
            }
            
            categories.push({
                name: categoryName,
                words: words
            });
        });
        
        if (categories.length !== 4) {
            console.log('Invalid number of categories found, returning sample data');
            return getDefaultSampleData();
        }

        // 获取难度
        const difficultyText = $('h2:contains("Here are today\'s Connections categories")').prevAll('p').first().text();
        let difficulty = "medium";
        
        if (difficultyText.toLowerCase().includes('easy')) {
            difficulty = "easy";
        } else if (difficultyText.toLowerCase().includes('hard')) {
            difficulty = "hard";
        }

        // 创建谜题数据
        let puzzleData = extendPuzzleData({
            date: formatDate(),
            categories: categories,
            difficulty: difficulty,
            lastUpdated: new Date().toISOString(),
            isSampleData: false
        });

        if (!validatePuzzleData(puzzleData)) {
            console.log('Invalid puzzle data format, returning sample data');
            return getDefaultSampleData();
        }
        
        console.log('Successfully scraped puzzle data from Mashable');
        
        // 设置为最新谜题
        global.puzzleData.latest = puzzleData;
        
        // 检查是否需要添加到存档
        const existingArchiveEntry = global.puzzleData.archive.find(p => 
            p.date === puzzleData.date
        );
        
        if (!existingArchiveEntry) {
            global.puzzleData.archive.push(puzzleData);
            console.log('Added new puzzle to archive');
        } else {
            // 更新现有条目，但保留其元数据
            existingArchiveEntry.categories = puzzleData.categories;
            existingArchiveEntry.difficulty = puzzleData.difficulty;
            existingArchiveEntry.words = puzzleData.words;
            console.log('Updated existing puzzle in archive');
        }
        
        // 清除缓存
        clearArchiveCache();
        
        // 保存数据到文件
        await saveData();
        
        return puzzleData;
    } catch (error) {
        console.error('Error scraping daily puzzle:', error.message);
        return getDefaultSampleData();
    }
}

// 辅助函数：验证谜题数据的完整性
function validatePuzzleData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.categories)) return false;
    if (data.categories.length === 0) return false;
    
    // 验证每个类别
    for (const category of data.categories) {
        if (!category.name || typeof category.name !== 'string') return false;
        if (!Array.isArray(category.words)) return false;
        if (category.words.length !== 4) return false; // 每个类别应该有4个单词
    }
    
    return true;
}

// 辅助函数：基于内容确定难度
function determineDifficulty(categories, words) {
    // 这里可以实现一个简单的难度判断算法
    // 例如基于单词长度、常见程度等
    return "medium"; // 默认返回medium
}

// 辅助函数：获取默认的示例数据
function getDefaultSampleData() {
    return {
        date: formatDate(),
        difficulty: "medium",
        categories: [
            {
                name: "Central section of the body",
                words: ["CORE", "MIDRIFF", "TORSO", "TRUNK"]
            },
            {
                name: "Components of a pizza",
                words: ["CHEESE", "CRUST", "SAUCE", "TOPPINGS"]
            },
            {
                name: "Units of beer",
                words: ["CASE", "FORTY", "GROWLER", "SIX-PACK"]
            },
            {
                name: "Baseball greats",
                words: ["BONDS", "MANTLE", "TROUT", "YOUNG"]
            }
        ],
        lastUpdated: new Date().toISOString(),
        isSampleData: true
    };
}

// Generate article content
function generateArticleContent(puzzleData) {
    // In production, this would call an AI service
    // For now, returning a template-based article
    
    const date = puzzleData.date;
    const difficulty = puzzleData.difficulty;
    
    let difficultyText = '';
    if (difficulty === 'easy') {
        difficultyText = 'relatively straightforward';
    } else if (difficulty === 'medium') {
        difficultyText = 'moderately challenging';
    } else {
        difficultyText = 'quite challenging';
    }
    
    let categoryText = '';
    puzzleData.categories.forEach((category) => {
        categoryText += `<p>The "${category.name}" category includes ${category.words.join(', ')}.</p>`;
    });
    
    return `
        <h3>NYT Connections Puzzle for ${date}</h3>
        <p>Today's NYT Connections puzzle is ${difficultyText}. Let's break down each category:</p>
        ${categoryText}
        <p>Players found the "${puzzleData.categories[puzzleData.categories.length-1]?.name || 'last'}" category to be the most challenging, as it requires thinking outside the box.</p>
        <p>If you're stuck on today's puzzle, try using our AI helper for customized hints based on your progress!</p>
    `;
}

// 备份配置
const backupConfig = {
    maxBackups: 5,  // 保留的最大备份数量
    backupInterval: 24 * 60 * 60 * 1000, // 备份间隔（24小时）
    backupDir: path.join(__dirname, 'backups')
};

// 创建备份
async function createBackup() {
    try {
        // 确保备份目录存在
        await fs.mkdir(backupConfig.backupDir, { recursive: true });
        
        // 生成备份文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupConfig.backupDir, `puzzles-${timestamp}.json`);
        
        // 复制当前数据文件到备份
        const dataFile = path.join(__dirname, 'data', 'puzzles.json');
        await fs.copyFile(dataFile, backupFile);
        
        // 清理旧备份
        await cleanOldBackups();
        
        console.log(`备份创建成功: ${backupFile}`);
    } catch (error) {
        console.error('创建备份失败:', error);
    }
}

// 清理旧备份
async function cleanOldBackups() {
    try {
        const files = await fs.readdir(backupConfig.backupDir);
        const backupFiles = files.filter(f => f.startsWith('puzzles-')).sort();
        
        // 如果备份文件超过最大数量，删除最旧的
        while (backupFiles.length > backupConfig.maxBackups) {
            const oldestFile = path.join(backupConfig.backupDir, backupFiles.shift());
            await fs.unlink(oldestFile);
            console.log(`删除旧备份: ${oldestFile}`);
        }
    } catch (error) {
        console.error('清理旧备份失败:', error);
    }
}

// 恢复备份
async function restoreFromBackup(backupFile) {
    try {
        const backupPath = path.join(backupConfig.backupDir, backupFile);
        const dataFile = path.join(__dirname, 'data', 'puzzles.json');
        
        // 读取并验证备份数据
        const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
        if (!backupData || !backupData.archive || !Array.isArray(backupData.archive)) {
            throw new Error('无效的备份数据');
        }
        
        // 复制备份到数据文件
        await fs.copyFile(backupPath, dataFile);
        
        // 重新加载数据
        await loadInitialData();
        
        console.log(`从备份恢复成功: ${backupFile}`);
        return true;
    } catch (error) {
        console.error('恢复备份失败:', error);
        return false;
    }
}

// 修改saveData函数，添加自动备份
async function saveData() {
    try {
        // 验证global.puzzleData结构
        if (!global.puzzleData || typeof global.puzzleData !== 'object') {
            throw new Error('Invalid puzzleData: must be an object');
        }
        if (!Array.isArray(global.puzzleData.archive)) {
            throw new Error('Invalid puzzleData: archive must be an array');
        }
        if (global.puzzleData.latest !== null && typeof global.puzzleData.latest !== 'object') {
            throw new Error('Invalid puzzleData: latest must be null or an object');
        }

        // Ensure data directory exists
        const dataDir = path.join(__dirname, 'data');
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }
        
        const dataFile = path.join(dataDir, 'puzzles.json');
        const dataToSave = JSON.stringify(global.puzzleData, null, 2);
        
        // 检查是否需要创建备份
        const lastBackupTime = await getLastBackupTime();
        if (!lastBackupTime || Date.now() - lastBackupTime >= backupConfig.backupInterval) {
            await createBackup();
        }
        
        // 写入临时文件
        const tempFile = `${dataFile}.tmp`;
        await fs.writeFile(tempFile, dataToSave);
        
        // 验证临时文件
        try {
            const writtenData = await fs.readFile(tempFile, 'utf8');
            const parsedData = JSON.parse(writtenData);
            
            // 详细的数据验证
            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error('Written data validation failed: not an object');
            }
            if (!Array.isArray(parsedData.archive)) {
                throw new Error('Written data validation failed: archive not an array');
            }
            if (parsedData.latest !== null && typeof parsedData.latest !== 'object') {
                throw new Error('Written data validation failed: latest not null or object');
            }
            
            // 验证成功后,将临时文件重命名为正式文件
            await fs.rename(tempFile, dataFile);
            console.log('Data saved and validated successfully');
        } catch (validationError) {
            // 验证失败,删除临时文件
            try {
                await fs.unlink(tempFile);
            } catch (unlinkError) {
                console.error('Failed to delete temporary file:', unlinkError);
            }
            throw validationError;
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        throw error;
    }
}

// 获取最后备份时间
async function getLastBackupTime() {
    try {
        const files = await fs.readdir(backupConfig.backupDir);
        const backupFiles = files.filter(f => f.startsWith('puzzles-')).sort();
        
        if (backupFiles.length === 0) return null;
        
        const lastBackup = backupFiles[backupFiles.length - 1];
        const stats = await fs.stat(path.join(backupConfig.backupDir, lastBackup));
        return stats.mtime.getTime();
    } catch (error) {
        return null;
    }
}

// 获取下一次计划的抓取时间
function getNextScheduledScrape() {
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(0, 10, 0, 0);
    
    // 如果当前时间已过今天的抓取时间,则计划在明天抓取
    if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime;
}

// Start the server
async function startServer() {
    // Load initial data
    await loadInitialData();
    
    // Try to scrape today's puzzle if we don't have it
    const today = new Date();
    const todayFormatted = formatDate(today);
    
    if (!global.puzzleData.latest || global.puzzleData.latest.date !== todayFormatted) {
        try {
            console.log('No data for today, attempting to scrape');
            const result = await scrapeDailyPuzzle();
            
            // 如果返回的是示例数据，且当前时间在6-13点之间，设置小时级重试
            if (result.isSampleData) {
                const currentHour = today.getHours();
                if (currentHour >= 6 && currentHour < 13) {
                    scheduleHourlyRetries();
                }
            }
        } catch (error) {
            console.error('Initial scrape failed:', error);
        }
    }
    
    // Schedule daily scrapes
    scheduleDailyScrape();
    
    // Start listening
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// 安排小时级重试
function scheduleHourlyRetries() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 如果当前时间已经超过14:10，不再重试
    if (currentHour > 14 || (currentHour === 14 && currentMinute > 10)) {
        console.log('当前时间已超过14:10，不再安排重试');
        return;
    }
    
    // 计算下一次重试的时间（整点+10分钟）
    const nextTry = new Date(now);
    nextTry.setHours(currentHour + 1, 10, 0, 0);
    
    // 如果下一次重试时间超过14:10，则设置为14:10
    if (nextTry.getHours() > 14 || (nextTry.getHours() === 14 && nextTry.getMinutes() > 10)) {
        nextTry.setHours(14, 10, 0, 0);
    }
    
    // 计算到下一次重试的毫秒数
    const timeUntilNextTry = nextTry - now;
    
    console.log(`安排下一次重试抓取，时间: ${nextTry.getHours()}:10`);
    
    // 设置定时器，在下一个时间点尝试抓取
    setTimeout(async () => {
        console.log(`执行重试抓取，时间: ${new Date().getHours()}:10`);
        try {
            const result = await scrapeDailyPuzzle();
            
            // 如果仍然是示例数据，继续安排下一个小时的重试
            if (result.isSampleData) {
                scheduleHourlyRetries();
            } else {
                console.log('重试抓取成功获取真实数据，不再安排后续重试');
            }
        } catch (error) {
            console.error('重试抓取失败:', error);
            // 尽管失败，仍然安排下一次重试
            scheduleHourlyRetries();
        }
    }, timeUntilNextTry);
}

// Schedule daily scrape
function scheduleDailyScrape() {
    const targetTime = getNextScheduledScrape();
    const now = new Date();
    const timeUntilScrape = targetTime - now;
    
    // Schedule the scrape
    setTimeout(async () => {
        console.log('执行计划的抓取任务');
        try {
            const result = await scrapeDailyPuzzle();
            if (result.isSampleData) {
                console.log('抓取返回示例数据，可能是因为文章尚未发布');
                
                // 首次抓取失败，安排小时级重试
                scheduleHourlyRetries();
            } else {
                console.log('成功抓取新数据');
            }
        } catch (error) {
            console.error('计划的抓取任务失败:', error);
            // 抓取失败也安排重试
            scheduleHourlyRetries();
        }
        
        // 无论成功与否，都安排下一天的抓取
        // 但由于重试可能会持续几个小时，我们需要确保不会重复安排
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0);
        
        const timeUntilTomorrow = tomorrow - now;
        setTimeout(() => {
            scheduleDailyScrape();
        }, timeUntilTomorrow);
        
    }, timeUntilScrape);
    
    const formattedDate = targetTime.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    console.log(`下次抓取计划在 ${formattedDate}`);
}

// Test route for OpenRouter API
app.get('/api/test-ai', async (req, res) => {
    try {
        const response = await axios.post(OPENROUTER_ENDPOINT, {
            model: 'google/gemma-3-12b-it:free',
            messages: [
                {
                    role: 'user',
                    content: '你好,请用中文介绍一下你自己,不要超过100字'
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': `http://localhost:${PORT}`,
                'X-Title': 'NYCT Connections AI Test',
                'Content-Type': 'application/json'
            }
        });

        console.log('API Response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(500).json({
            error: error.response?.data || error.message
        });
    }
});

// 添加完成统计API
app.post('/api/puzzle/:date/complete', async (req, res) => {
    try {
        const { timeSpent, isSuccess } = req.body;
        await updateCompletionStats(req.params.date, timeSpent, isSuccess);
        res.json({ success: true });
    } catch (error) {
        console.error('更新完成统计失败:', error);
        res.status(500).json({ error: '更新完成统计失败' });
    }
});

// 导出存档数据
app.get('/api/archive/export', async (req, res) => {
    try {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: global.puzzleData
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=puzzle-archive.json');
        res.json(exportData);
    } catch (error) {
        console.error('导出存档失败:', error);
        res.status(500).json({ error: '导出存档失败' });
    }
});

// 导入存档数据
app.post('/api/archive/import', async (req, res) => {
    try {
        const importData = req.body;
        
        // 验证导入数据
        if (!importData || !importData.version || !importData.data) {
            throw new Error('无效的导入数据格式');
        }
        
        // 验证数据结构
        if (!importData.data.archive || !Array.isArray(importData.data.archive)) {
            throw new Error('无效的存档数据结构');
        }
        
        // 备份当前数据
        await createBackup();
        
        // 合并数据
        const mergedArchive = [...global.puzzleData.archive];
        
        for (const puzzle of importData.data.archive) {
            const existingIndex = mergedArchive.findIndex(p => p.date === puzzle.date);
            
            if (existingIndex === -1) {
                // 添加新谜题
                mergedArchive.push(puzzle);
            } else {
                // 更新现有谜题，保留元数据
                const existing = mergedArchive[existingIndex];
                mergedArchive[existingIndex] = {
                    ...puzzle,
                    metadata: existing.metadata || puzzle.metadata
                };
            }
        }
        
        // 更新全局数据
        global.puzzleData.archive = mergedArchive;
        
        // 清除缓存
        clearArchiveCache();
        
        // 保存更新后的数据
        await saveData();
        
        res.json({
            success: true,
            message: `成功导入 ${importData.data.archive.length} 个谜题`
        });
    } catch (error) {
        console.error('导入存档失败:', error);
        res.status(500).json({ error: '导入存档失败: ' + error.message });
    }
});

// 添加示例数据API端点
app.get('/api/sample', (req, res) => {
    const sampleData = {
        puzzle: {
            date: new Date().toISOString().split('T')[0],
            difficulty: "medium",
            categories: [
                {
                    name: "Gum flavors",
                    words: ["BUBBLEGUM", "CINNAMON", "MENTHOL", "WINTERGREEN"]
                },
                {
                    name: "Starting point",
                    words: ["CATALYST", "LAUNCHPAD", "SPARK", "SPRINGBOARD"]
                },
                {
                    name: "Great American songbook songs",
                    words: ["AUTUMN LEAVES", "SUMMERTIME", "UNFORGETTABLE", "WITCHCRAFT"]
                },
                {
                    name: "__ Tube",
                    words: ["FALLOPIAN", "INNER", "TEST", "VACUUM"]
                }
            ]
        },
        archive: [
            {
                date: "2025-04-24",
                difficulty: "easy",
                title: "Yesterday's Puzzle"
            },
            {
                date: "2025-04-23",
                difficulty: "hard",
                title: "Day Before Yesterday"
            }
        ]
    };
    
    res.json(sampleData);
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 添加今日文章路由
app.get('/articles/today', async (req, res) => {
    try {
        // 获取今天的谜题数据
        const today = new Date();
        const todayFormatted = formatDate(today);
        
        if (!global.puzzleData.latest) {
            return res.status(404).send('今日谜题尚未发布');
        }
        
        // 使用ArticleGenerator生成文章内容
        const articleGenerator = new ArticleGenerator();
        const articleHtml = articleGenerator.generateHTML(global.puzzleData.latest);
        
        // 返回生成的HTML页面
        res.send(articleHtml);
    } catch (error) {
        console.error('生成今日文章失败:', error);
        res.status(500).send('生成文章时发生错误');
    }
});

// 添加存档页面路由
app.get('/archive', async (req, res) => {
    try {
        // 获取存档数据
        const archiveData = await getArchiveList();
        
        // 返回HTML页面
        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYT Connections Puzzle Archive</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <header class="bg-purple-600 text-white shadow-md mb-8">
        <div class="container mx-auto py-4 px-4">
            <a href="/" class="text-white hover:text-purple-200">← Back to Home</a>
        </div>
    </header>
    
    <main class="container mx-auto px-4 max-w-4xl">
        <h1 class="text-3xl font-bold mb-8">NYT Connections Puzzle Archive</h1>
        
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${archiveData.map(puzzle => `
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold mb-2">${puzzle.date}</h2>
                    <div class="flex items-center gap-2 mb-4">
                        <span class="px-2 py-1 rounded text-sm ${
                            puzzle.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            puzzle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }">
                            ${puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)}
                        </span>
                    </div>
                    <div class="space-y-2">
                        ${puzzle.categories.map(cat => `
                            <p class="text-gray-600">${cat.name}</p>
                        `).join('')}
                    </div>
                    <a href="/articles/${puzzle.date}" class="mt-4 inline-block text-purple-600 hover:text-purple-800">
                        View Details →
                    </a>
                </div>
            `).join('')}
        </div>
    </main>
    
    <footer class="mt-12 text-center text-gray-500 text-sm pb-8">
        <p>Last updated: ${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>
        `);
    } catch (error) {
        console.error('生成存档页面失败:', error);
        res.status(500).send('生成存档页面时发生错误');
    }
});

// 添加特定日期文章路由
app.get('/articles/:date', async (req, res) => {
    try {
        const requestedDate = req.params.date;
        let puzzleData;
        
        // 检查是否是今天的谜题
        if (global.puzzleData.latest && global.puzzleData.latest.date === requestedDate) {
            puzzleData = global.puzzleData.latest;
        } else {
            // 从存档中查找
            puzzleData = global.puzzleData.archive.find(p => p.date === requestedDate);
        }
        
        if (!puzzleData) {
            return res.status(404).send('找不到该日期的谜题');
        }
        
        // 使用ArticleGenerator生成文章内容
        const articleGenerator = new ArticleGenerator();
        const articleHtml = articleGenerator.generateHTML(puzzleData);
        
        // 返回生成的HTML页面
        res.send(articleHtml);
    } catch (error) {
        console.error('生成文章失败:', error);
        res.status(500).send('生成文章时发生错误');
    }
});

// Start the server
startServer(); 