/**
 * NYT Connections 游戏实现
 * 处理游戏机制、数据加载和交互
 */

// 游戏状态
let gameData = {
    words: [],
    categories: [],
    selectedTiles: [],
    solvedCategories: [],
    attempts: 0,
    maxAttempts: 4
};

// DOM 元素
const gameGrid = document.getElementById('game-grid');
const submitBtn = document.getElementById('submit-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const clearBtn = document.getElementById('clear-btn');
const categoriesContainer = document.querySelector('.categories-container');
const dailyContent = document.getElementById('daily-content');

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // 事件监听器
    submitBtn.addEventListener('click', submitSelection);
    shuffleBtn.addEventListener('click', shuffleWords);
    clearBtn.addEventListener('click', clearSelection);
});

/**
 * 通过获取今日的谜题数据初始化游戏
 */
async function initGame() {
    try {
        // 从localStorage加载数据
        const data = await fetchGameData();
        
        if (data) {
            gameData.words = data.words;
            gameData.categories = data.categories;
            
            // 如果有文章内容，加载它
            if (data.articleContent && dailyContent) {
                dailyContent.innerHTML = data.articleContent;
            }
            
            renderGameBoard();
        } else {
            throw new Error('无法加载游戏数据');
        }
    } catch (error) {
        console.error('初始化游戏失败:', error);
        document.getElementById('ai-message').innerHTML = 
            '<p>加载今日谜题时出错。请刷新页面重试。</p>';
        
        // 使用示例数据作为备用
        useBackupData();
    }
}

/**
 * 从localStorage获取游戏数据或使用示例数据
 */
async function fetchGameData() {
    try {
        // 尝试从localStorage加载数据
        const puzzleDataString = localStorage.getItem('puzzleData');
        if (!puzzleDataString) {
            // 如果没有数据，尝试抓取
            console.log('未找到保存的数据，尝试抓取...');
            if (window.scrapeTodaysPuzzle) {
                await window.scrapeTodaysPuzzle();
                // 再次尝试加载
                const newData = localStorage.getItem('puzzleData');
                if (newData) {
                    return JSON.parse(newData).latest;
                }
            }
            
            // 如果还是没有数据，使用示例数据
            return getSampleData();
        }
        
        // 解析数据并返回最新的谜题
        const puzzleData = JSON.parse(puzzleDataString);
        return puzzleData.latest || getSampleData();
    } catch (error) {
        console.error('获取游戏数据失败:', error);
        return getSampleData();
    }
}

/**
 * 使用备用示例数据
 */
function useBackupData() {
    const sampleData = getSampleData();
    gameData.words = sampleData.words;
    gameData.categories = sampleData.categories;
    renderGameBoard();
}

/**
 * 获取示例数据用于开发和备用
 */
function getSampleData() {
    return {
        words: [
            "CASTLE", "BISHOP", "KNIGHT", "ROOK", 
            "MOUNTAIN", "OCEAN", "DESERT", "FOREST", 
            "DOLLAR", "EURO", "POUND", "YEN", 
            "FORD", "CHEVY", "TOYOTA", "HONDA"
        ],
        categories: [
            {
                name: "Chess pieces",
                words: ["CASTLE", "BISHOP", "KNIGHT", "ROOK"],
                color: "yellow"
            },
            {
                name: "Natural landscapes",
                words: ["MOUNTAIN", "OCEAN", "DESERT", "FOREST"],
                color: "green"
            },
            {
                name: "Currencies",
                words: ["DOLLAR", "EURO", "POUND", "YEN"],
                color: "blue"
            },
            {
                name: "Car manufacturers",
                words: ["FORD", "CHEVY", "TOYOTA", "HONDA"],
                color: "purple"
            }
        ],
        articleContent: `
            <p>Today's NYT Connections features words related to Chess pieces, Natural landscapes, Currencies, and Car manufacturers.</p>
            <p>The "Chess pieces" category includes CASTLE (or rook), BISHOP, KNIGHT, and ROOK. Many players found this category challenging because "CASTLE" can be both a chess piece and a building.</p>
            <p>The "Natural landscapes" category contains MOUNTAIN, OCEAN, DESERT, and FOREST, representing major types of geographical features on Earth.</p>
            <p>The "Currencies" category includes DOLLAR, EURO, POUND, and YEN - major world currencies.</p>
            <p>Finally, the "Car manufacturers" category features FORD, CHEVY, TOYOTA, and HONDA, all major automobile companies.</p>
        `
    };
}

/**
 * 渲染游戏面板上的单词方块
 */
function renderGameBoard() {
    gameGrid.innerHTML = '';
    
    // 打乱单词顺序
    const shuffledWords = [...gameData.words].sort(() => Math.random() - 0.5);
    
    // 创建单词方块
    shuffledWords.forEach(word => {
        const tile = document.createElement('div');
        tile.className = 'word-tile';
        tile.textContent = word;
        
        // 检查单词是否属于已解决的类别
        const solvedCategory = gameData.solvedCategories.find(category => 
            category.words.includes(word));
            
        if (solvedCategory) {
            tile.classList.add(`solved-${solvedCategory.color}`);
        } else {
            // 只为未解决的单词添加点击事件
            tile.addEventListener('click', () => toggleWordSelection(tile, word));
        }
        
        gameGrid.appendChild(tile);
    });
    
    // 更新已解决类别的显示
    renderSolvedCategories();
}

/**
 * 切换单词方块的选择状态
 */
function toggleWordSelection(tile, word) {
    const index = gameData.selectedTiles.indexOf(word);
    
    if (index === -1) {
        // 如果还未选择且选择少于4个，则添加到选择中
        if (gameData.selectedTiles.length < 4) {
            gameData.selectedTiles.push(word);
            tile.classList.add('selected');
        }
    } else {
        // 从选择中移除
        gameData.selectedTiles.splice(index, 1);
        tile.classList.remove('selected');
    }
    
    // 更新AI助手显示
    updateAIHelper();
}

/**
 * 提交当前选择，检查是否形成一个类别
 */
function submitSelection() {
    // 需要正好选择4个单词
    if (gameData.selectedTiles.length !== 4) {
        document.getElementById('ai-message').innerHTML = 
            '<p>请选择恰好4个单词！</p>';
        return;
    }
    
    // 检查选择是否匹配任何类别
    const matchedCategory = gameData.categories.find(category => {
        const categoryWords = [...category.words].sort();
        const selectedWords = [...gameData.selectedTiles].sort();
        return categoryWords.every((word, index) => word === selectedWords[index]);
    });
    
    if (matchedCategory) {
        // 正确的分组！
        gameData.solvedCategories.push(matchedCategory);
        
        // 更新显示
        document.getElementById('ai-message').innerHTML = 
            `<p>你找到了"${matchedCategory.name}"类别！做得好！</p>`;
            
        // 清除选择
        gameData.selectedTiles = [];
        
        // 重新渲染游戏面板
        renderGameBoard();
        
        // 检查游戏是否完成
        if (gameData.solvedCategories.length === gameData.categories.length) {
            gameComplete();
        }
    } else {
        // 错误的分组
        gameData.attempts++;
        
        document.getElementById('ai-message').innerHTML = 
            `<p>那不是正确的类别。还剩${gameData.maxAttempts - gameData.attempts}次尝试。</p>`;
            
        // 检查游戏是否结束
        if (gameData.attempts >= gameData.maxAttempts) {
            gameOver();
        }
    }
}

/**
 * 重新打乱游戏面板上的单词
 */
function shuffleWords() {
    // 先清除选择
    clearSelection();
    
    // 重新渲染游戏面板(包含洗牌功能)
    renderGameBoard();
}

/**
 * 清除当前选择
 */
function clearSelection() {
    gameData.selectedTiles = [];
    
    // 移除所有方块的选中状态
    document.querySelectorAll('.word-tile.selected').forEach(tile => {
        tile.classList.remove('selected');
    });
    
    // 更新AI助手
    updateAIHelper();
}

/**
 * 渲染已解决的类别
 */
function renderSolvedCategories() {
    categoriesContainer.innerHTML = '';
    
    gameData.solvedCategories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = `category ${category.color}`;
        
        const nameElement = document.createElement('div');
        nameElement.className = 'category-name';
        nameElement.textContent = category.name;
        
        const wordsElement = document.createElement('div');
        wordsElement.className = 'category-words';
        
        category.words.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.className = 'category-word';
            wordElement.textContent = word;
            wordsElement.appendChild(wordElement);
        });
        
        categoryElement.appendChild(nameElement);
        categoryElement.appendChild(wordsElement);
        categoriesContainer.appendChild(categoryElement);
    });
}

/**
 * 根据当前选择更新AI助手
 */
function updateAIHelper() {
    const aiMessage = document.getElementById('ai-message');
    
    if (gameData.selectedTiles.length === 0) {
        aiMessage.innerHTML = '<p>选择一些单词，我会帮你找到连接点！</p>';
    } else if (gameData.selectedTiles.length < 4) {
        aiMessage.innerHTML = 
            `<p>你已选择${gameData.selectedTiles.length}个单词。
            再选择${4 - gameData.selectedTiles.length}个完成一组。</p>`;
    } else {
        aiMessage.innerHTML = 
            '<p>你已选择4个单词。让我思考它们可能的连接方式...</p>';
    }
}

/**
 * 处理游戏完成
 */
function gameComplete() {
    document.getElementById('ai-message').innerHTML = 
        '<p>恭喜！你已完成今天的NYT Connections谜题！🎉</p>';
    
    // 禁用游戏控制
    submitBtn.disabled = true;
    shuffleBtn.disabled = true;
    clearBtn.disabled = true;
    
    // 加载每日文章内容
    loadDailyContent();
}

/**
 * 处理游戏结束
 */
function gameOver() {
    document.getElementById('ai-message').innerHTML = 
        '<p>游戏结束！你已用完所有尝试机会。明天再来试试吧！</p>';
    
    // 揭示所有类别
    gameData.solvedCategories = [...gameData.categories];
    renderGameBoard();
    
    // 禁用游戏控制
    submitBtn.disabled = true;
    shuffleBtn.disabled = true;
    clearBtn.disabled = true;
    
    // 加载每日文章内容
    loadDailyContent();
}

/**
 * 加载每日文章内容
 */
function loadDailyContent() {
    // 尝试从游戏数据中获取文章内容
    try {
        const puzzleDataString = localStorage.getItem('puzzleData');
        if (puzzleDataString) {
            const puzzleData = JSON.parse(puzzleDataString);
            if (puzzleData.latest && puzzleData.latest.articleContent) {
                document.getElementById('daily-content').innerHTML = puzzleData.latest.articleContent;
                return;
            }
        }
    } catch (error) {
        console.error('加载文章内容失败:', error);
    }
    
    // 如果没有数据，使用示例内容
    const sampleContent = getSampleData().articleContent;
    document.getElementById('daily-content').innerHTML = sampleContent;
} 