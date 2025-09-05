// 今日谜题数据 (从服务器获取)
let todaysPuzzle = null;

// 游戏状态
let gameState = {
    selectedWords: [],
    foundGroups: [],
    mistakesCount: 0,
    gameOver: false,
    availableWords: []
};

let usedHints = [];
let currentHintIndex = 0;

// 初始化页面
async function initializePage() {
    showLoadingMessage();
    
    // 检查管理员模式
    checkAdminMode();
    
    try {
        await loadTodaysPuzzle();
        initializeGame();
        displayWords();
        setupEventListeners();
        addAssistantMessage("Ready to tackle today's Connections? Select four words that share something in common, then click Submit! Don't worry - you have unlimited attempts and I'm here to help with hints!");
    } catch (error) {
        console.error('Failed to load puzzle:', error);
        addAssistantMessage("Sorry, couldn't load today's puzzle. Please try again later or click the refresh button.");
        showRefreshButton();
    }
}

// Show loading message
function showLoadingMessage() {
    const wordsGrid = document.getElementById('wordsGrid');
    wordsGrid.innerHTML = '<div class="col-span-4 text-center text-gray-500">Loading today\'s puzzle...</div>';
    
    // Update date display to show loading
    const puzzleDateElement = document.getElementById('puzzleDate');
    const puzzleStatusElement = document.getElementById('puzzleStatus');
    const puzzleInfoElement = document.getElementById('puzzleInfo');
    
    if (puzzleDateElement) {
        puzzleDateElement.textContent = 'Loading puzzle date...';
        puzzleStatusElement.textContent = '🔄';
        puzzleInfoElement.textContent = 'Fetching today\'s puzzle...';
        puzzleInfoElement.className = 'text-sm text-blue-600 mt-1';
    }
    
    addAssistantMessage("Getting today's latest Connections puzzle for you...");
}

// Load today's puzzle from server
async function loadTodaysPuzzle() {
    console.log('Loading puzzle from API...');
    const response = await fetch('/api/today?t=' + Date.now()); // 添加时间戳防止缓存
    if (!response.ok) {
        throw new Error('Unable to fetch puzzle data');
    }
    
    todaysPuzzle = await response.json();
    console.log('Today\'s puzzle loaded successfully:', todaysPuzzle);
    console.log('Puzzle date:', todaysPuzzle.date);
    console.log('Puzzle source:', todaysPuzzle.source);
    console.log('First few words:', todaysPuzzle.words?.slice(0, 4));
    
    // Update puzzle date display
    updatePuzzleDateDisplay();
}

// Update puzzle date display
function updatePuzzleDateDisplay() {
    console.log('Updating puzzle date display...');
    const puzzleDateElement = document.getElementById('puzzleDate');
    const puzzleStatusElement = document.getElementById('puzzleStatus');
    const puzzleInfoElement = document.getElementById('puzzleInfo');
    
    if (todaysPuzzle && todaysPuzzle.date) {
        const puzzleDate = new Date(todaysPuzzle.date);
        const today = new Date();
        
        console.log('Puzzle date:', puzzleDate.toDateString());
        console.log('Today date:', today.toDateString());
        
        // Format the date nicely
        const formattedDate = puzzleDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        console.log('Formatted date:', formattedDate);
        puzzleDateElement.textContent = formattedDate;
        
        // Check if it's today's puzzle
        const isToday = puzzleDate.toDateString() === today.toDateString();
        const isYesterday = puzzleDate.toDateString() === new Date(today.getTime() - 24*60*60*1000).toDateString();
        
        console.log('Is today:', isToday);
        console.log('Is yesterday:', isYesterday);
        
        if (isToday) {
            puzzleStatusElement.textContent = '✅';
            puzzleInfoElement.textContent = 'Latest puzzle - Updated today!';
            puzzleInfoElement.className = 'text-sm text-green-600 mt-1';
        } else if (isYesterday) {
            puzzleStatusElement.textContent = '⚠️';
            puzzleInfoElement.textContent = 'Yesterday\'s puzzle - New puzzle may be available';
            puzzleInfoElement.className = 'text-sm text-yellow-600 mt-1';
        } else {
            puzzleStatusElement.textContent = '📅';
            puzzleInfoElement.textContent = 'Archived puzzle';
            puzzleInfoElement.className = 'text-sm text-gray-600 mt-1';
        }
        
        // Update the article link
        const articleLink = document.getElementById('todayArticleLink');
        if (articleLink) {
            articleLink.href = `/api/article/${todaysPuzzle.date}`;
        }
    } else {
        puzzleDateElement.textContent = 'Date unavailable';
        puzzleStatusElement.textContent = '❓';
        puzzleInfoElement.textContent = 'Unable to determine puzzle date';
        puzzleInfoElement.className = 'text-sm text-red-600 mt-1';
    }
}

// Show refresh button
function showRefreshButton() {
    const hintButtons = document.getElementById('hintButtons');
    const refreshButton = document.createElement('button');
    refreshButton.className = 'bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors';
    refreshButton.innerHTML = '🔄 Refresh Data';
    refreshButton.onclick = refreshPuzzleData;
    hintButtons.appendChild(refreshButton);
}

// Refresh puzzle data
async function refreshPuzzleData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.innerHTML;
    
    // 显示加载状态
    refreshBtn.innerHTML = '⏳ Refreshing...';
    refreshBtn.disabled = true;
    
    addUserMessage('Admin: Refresh data');
    addAssistantMessage("🔧 Admin: Manually refreshing puzzle data... This may take a moment while I fetch the latest data from Mashable.");
    
    try {
        const response = await fetch('/api/refresh', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.groups && result.data.groups.length === 4) {
            // 更新puzzle数据
            todaysPuzzle = result.data;
            
            // 重置游戏
            initializeGame();
            displayWords();
            
            // 更新日期显示
            updatePuzzleDateDisplay();
            
            // 清除已完成的分组
            document.getElementById('completedGroups').innerHTML = '';
            
            // 清除游戏消息
            document.getElementById('gameMessage').textContent = '';
            
            addAssistantMessage(`✅ Success! Data refreshed from ${result.data.source}. The puzzle has been updated with fresh data and the game has been reset. Ready to play with the latest puzzle!`);
            
            console.log('Refresh successful:', result.data);
            
        } else {
            // 刷新失败，保持当前数据
            addAssistantMessage(`⚠️ Refresh completed, but couldn't get fresh data: ${result.message || 'Unknown error'}. You're still playing with the current puzzle data.`);
            console.log('Refresh warning:', result);
            
            // 确保当前游戏状态正常
            if (!todaysPuzzle || !todaysPuzzle.groups || !todaysPuzzle.words) {
                addAssistantMessage("🔄 Reloading current puzzle data...");
                // 重新加载当前数据
                try {
                    await loadTodaysPuzzle();
                    console.log('Reloaded puzzle data:', todaysPuzzle);
                    
                    if (todaysPuzzle && todaysPuzzle.words && todaysPuzzle.groups) {
                        initializeGame();
                        displayWords();
                        addAssistantMessage("✅ Current puzzle data reloaded successfully.");
                    } else {
                        addAssistantMessage("❌ Reloaded data is incomplete. Please refresh the page.");
                        console.error('Incomplete puzzle data after reload:', todaysPuzzle);
                    }
                } catch (error) {
                    console.error('Failed to reload puzzle data:', error);
                    addAssistantMessage("❌ Failed to reload puzzle data. Please refresh the page.");
                }
            }
        }
        
    } catch (error) {
        console.error('Refresh failed:', error);
        addAssistantMessage("❌ Refresh failed due to a network error. Please check your connection and try again later.");
    } finally {
        // 恢复按钮状态
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
}

// 初始化游戏状态
function initializeGame() {
    console.log('Initializing game...');
    console.log('todaysPuzzle exists:', !!todaysPuzzle);
    console.log('todaysPuzzle.words exists:', !!todaysPuzzle?.words);
    console.log('todaysPuzzle.words length:', todaysPuzzle?.words?.length);
    
    if (!todaysPuzzle || !todaysPuzzle.words) {
        console.error('No puzzle data available for game initialization');
        console.error('todaysPuzzle:', todaysPuzzle);
        return;
    }
    
    console.log('Available words:', todaysPuzzle.words);
    
    gameState = {
        selectedWords: [],
        foundGroups: [],
        mistakesCount: 0,
        gameOver: false,
        availableWords: [...todaysPuzzle.words].sort(() => Math.random() - 0.5)
    };
    
    console.log('Game state initialized:', gameState);
    updateGameStatus();
}

// 显示单词网格
function displayWords() {
    const wordsGrid = document.getElementById('wordsGrid');
    wordsGrid.innerHTML = '';
    
    if (!gameState.availableWords || gameState.availableWords.length === 0) {
        wordsGrid.innerHTML = '<div class="col-span-4 text-center text-red-500">Unable to load word data</div>';
        return;
    }
    
    gameState.availableWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-tile bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-center font-semibold hover:bg-gray-200 cursor-pointer transition-colors';
        wordElement.textContent = word;
        wordElement.dataset.word = word;
        wordElement.addEventListener('click', () => toggleWordSelection(word, wordElement));
        wordsGrid.appendChild(wordElement);
    });
}

// 切换单词选择状态
function toggleWordSelection(word, element) {
    if (gameState.gameOver) return;
    
    const isSelected = gameState.selectedWords.includes(word);
    
    if (isSelected) {
        // 取消选择
        gameState.selectedWords = gameState.selectedWords.filter(w => w !== word);
        element.classList.remove('bg-blue-200', 'border-blue-500');
        element.classList.add('bg-gray-100', 'border-gray-300');
    } else {
        // 选择单词
        if (gameState.selectedWords.length < 4) {
            gameState.selectedWords.push(word);
            element.classList.remove('bg-gray-100', 'border-gray-300');
            element.classList.add('bg-blue-200', 'border-blue-500');
        }
    }
    
    updateGameButtons();
}

// 更新游戏按钮状态
function updateGameButtons() {
    const deselectBtn = document.getElementById('deselectBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    deselectBtn.disabled = gameState.selectedWords.length === 0;
    submitBtn.disabled = gameState.selectedWords.length !== 4;
}

// 更新游戏状态显示
function updateGameStatus() {
    document.getElementById('mistakesCount').textContent = gameState.mistakesCount;
    document.getElementById('groupsFound').textContent = gameState.foundGroups.length;
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('deselectBtn').addEventListener('click', deselectAllWords);
    document.getElementById('submitBtn').addEventListener('click', submitGuess);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleWords);
}

// 取消选择所有单词
function deselectAllWords() {
    gameState.selectedWords = [];
    document.querySelectorAll('.word-tile').forEach(tile => {
        tile.classList.remove('bg-blue-200', 'border-blue-500');
        tile.classList.add('bg-gray-100', 'border-gray-300');
    });
    updateGameButtons();
}

// 重新排列单词
function shuffleWords() {
    gameState.availableWords.sort(() => Math.random() - 0.5);
    displayWords();
    deselectAllWords();
}

// 提交猜测
function submitGuess() {
    if (gameState.selectedWords.length !== 4 || gameState.gameOver) return;
    
    const selectedSet = new Set(gameState.selectedWords);
    let correctGroup = null;
    
    // 检查是否匹配任何分组
    for (const group of todaysPuzzle.groups) {
        const groupSet = new Set(group.words);
        if (selectedSet.size === groupSet.size && [...selectedSet].every(word => groupSet.has(word))) {
            correctGroup = group;
            break;
        }
    }
    
    if (correctGroup) {
        // 正确猜测
        handleCorrectGuess(correctGroup);
    } else {
        // 错误猜测
        handleIncorrectGuess();
    }
}

// 处理正确猜测
function handleCorrectGuess(group) {
    gameState.foundGroups.push(group);
    
    // 从可用单词中移除已找到的单词
    gameState.availableWords = gameState.availableWords.filter(word => !group.words.includes(word));
    
    // 显示完成的分组
    displayCompletedGroup(group);
    
    // 重新显示剩余单词
    displayWords();
    deselectAllWords();
    updateGameStatus();
    
    // Show success message
    showGameMessage(`🎉 Great! You found the "${group.theme}" group!`, 'success');
    addAssistantMessage(`🎉 Congratulations! You found the "${group.theme}" group: ${group.words.join(', ')}`);
    
    // Check if game is complete
    if (gameState.foundGroups.length === 4) {
        handleGameWin();
    }
}

// 处理错误猜测
function handleIncorrectGuess() {
    gameState.mistakesCount++;
    updateGameStatus();
    
    // 检查是否有3个正确单词
    let maxMatches = 0;
    for (const group of todaysPuzzle.groups) {
        const matches = gameState.selectedWords.filter(word => group.words.includes(word)).length;
        maxMatches = Math.max(maxMatches, matches);
    }
    
    let message = '';
    if (maxMatches === 3) {
        message = '😅 One away! You got 3 correct words';
        addAssistantMessage("So close! You got 3 words right, think carefully about the last one. Need a hint?");
    } else {
        message = '❌ These four words don\'t belong together';
        addAssistantMessage("Not quite right, but keep trying! No pressure - you have unlimited attempts. Want a hint?");
    }
    
    showGameMessage(message, 'error');
    deselectAllWords();
    
    // 移除游戏失败检查 - 现在可以无限尝试
}

// 显示已完成的分组
function displayCompletedGroup(group) {
    const completedGroups = document.getElementById('completedGroups');
    
    const difficultyColors = {
        'green': 'bg-green-500',
        'yellow': 'bg-yellow-500',
        'blue': 'bg-blue-500',
        'purple': 'bg-purple-500'
    };
    
    const colorClass = difficultyColors[group.difficulty] || 'bg-gray-500';
    
    const groupElement = document.createElement('div');
    groupElement.className = `${colorClass} text-white rounded-lg p-4 text-center`;
    groupElement.innerHTML = `
        <div class="font-bold text-lg mb-2">${group.theme}</div>
        <div class="text-sm">${group.words.join(', ')}</div>
    `;
    
    completedGroups.appendChild(groupElement);
}

// 显示游戏消息
function showGameMessage(message, type) {
    const gameMessage = document.getElementById('gameMessage');
    gameMessage.textContent = message;
    
    gameMessage.className = 'mt-4 text-center text-lg font-semibold ';
    if (type === 'success') {
        gameMessage.className += 'text-green-600';
    } else if (type === 'error') {
        gameMessage.className += 'text-red-600';
    } else {
        gameMessage.className += 'text-gray-600';
    }
    
    // 3秒后清除消息
    setTimeout(() => {
        gameMessage.textContent = '';
    }, 3000);
}

// Handle game win
function handleGameWin() {
    gameState.gameOver = true;
    showGameMessage('🎉 Congratulations! You completed today\'s Connections!', 'success');
    addAssistantMessage("🎉 Amazing! You successfully completed today's Connections puzzle in " + gameState.mistakesCount + " attempts! Want to try again or come back tomorrow for a new challenge!");
    
    // Only disable game selection buttons, keep restart available
    document.getElementById('deselectBtn').disabled = true;
    document.getElementById('submitBtn').disabled = true;
}

// 游戏现在没有失败概念 - 用户可以无限尝试

// 添加助手消息
function addAssistantMessage(message) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'assistant-message mb-3';
    messageDiv.innerHTML = `
        <div class="bg-blue-100 rounded-lg p-3 inline-block max-w-xs">
            ${message}
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 添加用户消息
function addUserMessage(message) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message mb-3 text-right';
    messageDiv.innerHTML = `
        <div class="bg-green-100 rounded-lg p-3 inline-block max-w-xs">
            ${message}
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Request hint
function requestHint(type) {
    let userMessage = '';
    let assistantResponse = '';
    
    switch(type) {
        case 'theme':
            userMessage = 'I need a theme hint';
            assistantResponse = getThemeHint();
            break;
        case 'difficulty':
            userMessage = 'Give me a difficulty hint';
            assistantResponse = getDifficultyHint();
            break;
        case 'word':
            userMessage = 'Give me some word hints';
            assistantResponse = getWordHint();
            break;
    }
    
    addUserMessage(userMessage);
    
    // 模拟思考时间
    setTimeout(() => {
        addAssistantMessage(assistantResponse);
        
        // 添加后续互动
        setTimeout(() => {
            addFollowUpQuestion();
        }, 1500);
    }, 800);
}

// Get theme hint
function getThemeHint() {
    if (!todaysPuzzle || !todaysPuzzle.groups) {
        return "Sorry, unable to get hint data.";
    }
    
    const availableGroups = todaysPuzzle.groups.filter(group => 
        !usedHints.includes(group.theme)
    );
    
    if (availableGroups.length === 0) {
        return "I've already given you theme hints for all groups! Try other types of hints.";
    }
    
    const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    usedHints.push(randomGroup.theme);
    
    return `💡 One group's theme is "${randomGroup.theme}". Can you find these four words?`;
}

// Get difficulty hint
function getDifficultyHint() {
    if (!todaysPuzzle || !todaysPuzzle.groups) {
        return "Sorry, unable to get hint data.";
    }
    
    const difficultyColors = {
        'green': 'green (easiest)',
        'yellow': 'yellow (easy)', 
        'blue': 'blue (hard)',
        'purple': 'purple (hardest)'
    };
    
    const randomGroup = todaysPuzzle.groups[Math.floor(Math.random() * todaysPuzzle.groups.length)];
    const difficultyText = difficultyColors[randomGroup.difficulty] || randomGroup.difficulty;
    return `🌈 One group is ${difficultyText} difficulty. ${randomGroup.hint}`;
}

// Get word hint
function getWordHint() {
    if (!todaysPuzzle || !todaysPuzzle.groups) {
        return "Sorry, unable to get hint data.";
    }
    
    const randomGroup = todaysPuzzle.groups[Math.floor(Math.random() * todaysPuzzle.groups.length)];
    const randomWords = randomGroup.words.slice(0, 2);
    
    return `💡 "${randomWords[0]}" and "${randomWords[1]}" belong to the same group. Can you find the other two?`;
}

// Add follow-up question
function addFollowUpQuestion() {
    const followUpQuestions = [
        "Was that hint helpful? Need more hints?",
        "Did you find it? Need other types of hints?",
        "How's it going? Want to try a hint for another group?",
        "Making progress? I can give you more help!"
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    addAssistantMessage(randomQuestion);
}

// Show answer
function showAnswer() {
    addUserMessage('Show complete answer');
    
    setTimeout(() => {
        if (!todaysPuzzle || !todaysPuzzle.groups) {
            addAssistantMessage("Sorry, unable to get answer data.");
            return;
        }
        
        let answerText = "📋 Today's Answers:\n\n";
        todaysPuzzle.groups.forEach((group, index) => {
            const difficultyEmoji = {
                'green': '🟢',
                'yellow': '🟡', 
                'blue': '🔵',
                'purple': '🟣'
            };
            
            const emoji = difficultyEmoji[group.difficulty] || '⚪';
            answerText += `${emoji} ${group.theme}: ${group.words.join(', ')}\n`;
        });
        
        addAssistantMessage(answerText);
        
        setTimeout(() => {
            addAssistantMessage("Hope these answers help you! Come back tomorrow for a new puzzle! 🎉");
        }, 1000);
    }, 800);
}

// Restart game
function restartGame() {
    addUserMessage('Restart game');
    
    // Reset game state
    initializeGame();
    
    // Clear completed groups
    document.getElementById('completedGroups').innerHTML = '';
    
    // Redisplay words
    displayWords();
    
    // Clear game messages
    document.getElementById('gameMessage').textContent = '';
    
    addAssistantMessage("Game has been reset! Start the challenge again! Remember, you have unlimited attempts and I'm here to help with hints whenever you need them.");
}

// 设置今日文章链接
function setTodayArticleLink() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const articleLink = document.getElementById('todayArticleLink');
    if (articleLink) {
        articleLink.href = `/api/article/${dateStr}`;
    }
}

// 检查管理员模式
function checkAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    
    if (isAdmin) {
        // 显示管理员功能
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.remove('hidden');
            console.log('Admin mode activated via URL parameter');
            
            // 添加管理员提示
            setTimeout(() => {
                addAssistantMessage("🔧 Admin mode activated. You can now manually refresh puzzle data if needed.");
            }, 2000);
        }
    }
    
    // 添加键盘快捷键 (Ctrl+Shift+A) 来切换管理员模式
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault();
            toggleAdminMode();
        }
    });
}

// 切换管理员模式
function toggleAdminMode() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        const isHidden = refreshBtn.classList.contains('hidden');
        
        if (isHidden) {
            refreshBtn.classList.remove('hidden');
            addAssistantMessage("🔧 Admin mode activated. Manual refresh button is now available. (Ctrl+Shift+A to toggle)");
            console.log('Admin mode activated via keyboard shortcut');
        } else {
            refreshBtn.classList.add('hidden');
            addAssistantMessage("👤 Admin mode deactivated. Back to normal user mode.");
            console.log('Admin mode deactivated');
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setTodayArticleLink();
});