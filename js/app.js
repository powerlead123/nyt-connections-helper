/**
 * NYT Connections Helper - Frontend JavaScript
 */

// Import configurations
import { config } from './config.js';
import { 
    aiApiAvailable,
    aiApiKey,
    generateLightHint,
    generateMediumHint,
    generateAnswerHint,
    generateLocalGameStateHint,
    setupExternalAI
} from './ai-helper.js';

// Global variables
let currentPuzzle = null;
let apiBaseUrl = 'https://nyct-connections.workers.dev'; // Cloudflare Worker URL

// Initialize the application after DOM is loaded
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the application
 */
async function init() {
  console.log('Initializing NYT Connections Helper');

  // 强制清除浏览器缓存 - 添加时间戳到所有请求以防止缓存
  console.log('Clearing browser cache by forcing fresh requests');
  
  // Initialize AI features
  await setupExternalAI();

  // Set API base URL for local development
  apiBaseUrl = 'http://localhost:3000'; // 使用本地服务器
  
  // Get and set API key
  const apiKeyMeta = document.querySelector('meta[name="ai-api-key"]');
  if (apiKeyMeta && apiKeyMeta.content) {
    console.log('AI API key found');
  } else {
    console.warn('AI API key not found, some features may be limited');
  }

  // Initialize UI elements
  setupUIElements();
  
  // Add event listeners to buttons
  setupEventListeners();
  
  try {
    // 显示加载状态
    showLoading();
    
    // 加载今日谜题
    console.log('Loading today\'s puzzle data...');
    await loadTodaysPuzzle();
    
    // 加载谜题存档
    await loadPuzzleArchive();
    
    hideLoading();
  } catch (error) {
    console.error("Failed to load data from API, using sample data instead:", error);
    hideLoading();
    await displaySampleData();
  }
}

/**
 * Display sample data when API is unavailable
 */
async function displaySampleData() {
  try {
    console.log('尝试加载示例数据...');
    
    // 从服务器获取示例数据
    const response = await fetch(`${apiBaseUrl}/api/sample`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '无法加载示例数据');
    }
    
    if (data.puzzle) {
      console.log('成功加载示例数据');
      displayPuzzle(data.puzzle);
      if (data.archive) {
        displayArchiveList(data.archive);
      }
    } else {
      throw new Error('示例数据格式无效');
    }
    
  } catch (error) {
    console.error('加载示例数据失败:', error);
    showErrorMessage('无法加载任何数据。请检查网络连接后重试。');
  }
}

/**
 * Set up UI elements
 */
function setupUIElements() {
  // Clear the initial loading message
  const mainElement = document.querySelector('main');
  mainElement.innerHTML = '';
  
  // Create main UI container (if it doesn't exist)
  if (!document.getElementById('puzzle-container')) {
    const container = document.createElement('div');
    container.id = 'puzzle-container';
    container.className = 'flex flex-col p-4 bg-white rounded-lg shadow-md';
    mainElement.appendChild(container);
    
    // Create puzzle title
    const titleSection = document.createElement('div');
    titleSection.id = 'puzzle-title';
    titleSection.className = 'mb-4 text-xl font-bold text-center';
    titleSection.textContent = 'Today\'s NYT Connections Puzzle';
    container.appendChild(titleSection);
    
    // Create puzzle date and difficulty
    const metaSection = document.createElement('div');
    metaSection.id = 'puzzle-meta';
    metaSection.className = 'mb-4 text-sm text-gray-600 text-center';
    container.appendChild(metaSection);
    
    // Create categories container
    const categoriesContainer = document.createElement('div');
    categoriesContainer.id = 'categories-container';
    categoriesContainer.className = 'grid grid-cols-1 gap-4 mb-4';
    container.appendChild(categoriesContainer);
    
    // Create archive section
    const archiveSection = document.createElement('div');
    archiveSection.id = 'archive-section';
    archiveSection.className = 'mt-8';
    
    const archiveTitle = document.createElement('h2');
    archiveTitle.textContent = 'Puzzle Archive';
    archiveTitle.className = 'text-lg font-bold mb-2';
    archiveSection.appendChild(archiveTitle);
    
    const archiveList = document.createElement('div');
    archiveList.id = 'archive-list';
    archiveList.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2';
    archiveSection.appendChild(archiveList);
    
    mainElement.appendChild(archiveSection);
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50 hidden';
    loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>';
    document.body.appendChild(loadingIndicator);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add window error handling
  window.addEventListener('error', function(e) {
    console.error('Global error:', e.message);
    hideLoading();
  });
  
  // Listen for archive item clicks
  document.getElementById('archive-list').addEventListener('click', async function(e) {
    const archiveItem = e.target.closest('.archive-item');
    if (archiveItem) {
      const date = archiveItem.dataset.date;
      if (date) {
        await loadPuzzleByDate(date);
      }
    }
  });
}

/**
 * Show loading indicator
 */
function showLoading() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.classList.add('hidden');
  }
}

/**
 * Load today's puzzle data
 */
async function loadTodaysPuzzle() {
  console.log('正在加载今日谜题数据...');
  
  try {
    // 显示加载状态
    showLoading();
    
    // 尝试从API获取数据
    const response = await fetch(`${apiBaseUrl}/api/today`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '无法加载谜题数据');
    }
    
    // 显示谜题数据
    displayPuzzle(data);
    
    // 隐藏加载状态
    hideLoading();
    
  } catch (error) {
    console.error('加载谜题数据失败:', error);
    hideLoading();
    
    // 显示错误信息
    showErrorMessage(error.message || '无法加载谜题数据。请稍后再试。');
    
    // 尝试显示示例数据
    try {
      await displaySampleData();
    } catch (sampleError) {
      console.error('加载示例数据也失败了:', sampleError);
    }
  }
}

/**
 * Load puzzle by date
 */
async function loadPuzzleByDate(dateStr) {
  try {
    showLoading();
    console.log(`Loading puzzle for date: ${dateStr}`);
    
    // Validate date format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    const response = await fetch(`${apiBaseUrl}/api/puzzle/${dateStr}?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: Status ${response.status}, Text: ${errorText}`);
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const puzzleData = await response.json();
    console.log('Received puzzle data:', puzzleData);
    
    if (!puzzleData || !puzzleData.categories || !Array.isArray(puzzleData.categories)) {
      console.error('Invalid puzzle data format:', puzzleData);
      throw new Error('Invalid puzzle data format received');
    }
    
    // Display puzzle
    displayPuzzle(puzzleData);
    currentPuzzle = puzzleData;
    
    console.log(`Successfully loaded puzzle for ${dateStr}`);
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(`Failed to load puzzle for ${dateStr}:`, error);
    
    // Show more specific error message
    let errorMessage = `Unable to load puzzle for ${dateStr}. `;
    if (error.message.includes('Invalid date')) {
      errorMessage += 'Invalid date format.';
    } else if (error.message.includes('404')) {
      errorMessage += 'Puzzle not found for this date.';
    } else {
      errorMessage += 'Please try again later.';
    }
    
    showErrorMessage(errorMessage);
  } finally {
    hideLoading();
  }
}

/**
 * Load puzzle archive
 */
async function loadPuzzleArchive() {
  try {
    console.log('Loading puzzle archive...');
    
    // 添加时间戳参数防止缓存
    const timestamp = new Date().getTime();
    const response = await fetch(`${apiBaseUrl}/api/archive?_=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const archiveData = await response.json();
    if (!archiveData || !archiveData.puzzles) {
      console.warn('No archive list retrieved or invalid format');
      return;
    }
    
    // Display archive list (use the puzzles array from the response)
    displayArchiveList(archiveData.puzzles);
    
    console.log(`Puzzle archive loaded successfully: ${archiveData.puzzles.length} items`);
  } catch (error) {
    console.error('Failed to load puzzle archive:', error);
    document.getElementById('archive-list').innerHTML = '<p class="text-red-500">Unable to load archive list. Please refresh the page and try again.</p>';
  }
}

/**
 * Display puzzle
 */
function displayPuzzle(puzzleData) {
  if (!puzzleData) return;
  
  // 设置全局当前谜题数据
  currentPuzzle = puzzleData;
  
  // 清理旧内容
  const puzzleContainer = document.getElementById('puzzle-container');
  if (puzzleContainer) {
    // 保存AI Assistant部分
    const aiAssistant = document.getElementById('ai-assistant');
    if (aiAssistant) {
      aiAssistant.remove();
    }
    
    // 清空容器
    puzzleContainer.innerHTML = '';
    
    // 重建基本结构
    const titleEl = document.createElement('div');
    titleEl.id = 'puzzle-title';
    titleEl.className = 'text-center mb-6';
    puzzleContainer.appendChild(titleEl);
    
    const metaEl = document.createElement('div');
    metaEl.id = 'puzzle-meta';
    metaEl.className = 'flex justify-center items-center gap-2 mb-6';
    puzzleContainer.appendChild(metaEl);
    
    const categoriesContainer = document.createElement('div');
    categoriesContainer.id = 'categories-container';
    categoriesContainer.className = 'grid grid-cols-1 gap-4 mb-4';
    puzzleContainer.appendChild(categoriesContainer);
    
    // 如果之前有AI Assistant,重新添加到最后
    if (aiAssistant) {
      puzzleContainer.appendChild(aiAssistant);
    }
  }
  
  // Update puzzle title and date
  const titleEl = document.getElementById('puzzle-title');
  titleEl.className = 'text-center mb-6';
  
  // 创建日期显示容器
  const dateContainer = document.createElement('div');
  dateContainer.className = 'bg-purple-100 rounded-lg p-4 mb-4 text-center shadow-sm';
  
  // 添加标题标签
  const todayLabel = document.createElement('div');
  todayLabel.className = 'text-purple-600 font-medium mb-1';
  const date = new Date(puzzleData.date);
  const today = new Date();
  todayLabel.textContent = date.toDateString() === today.toDateString() ? "Today's Puzzle" : "Archived Puzzle";
  dateContainer.appendChild(todayLabel);
  
  // 添加日期
  const dateDisplay = document.createElement('div');
  dateDisplay.className = 'text-2xl font-bold text-purple-800';
  dateDisplay.textContent = formatDisplayDate(puzzleData.date);
  dateContainer.appendChild(dateDisplay);
  
  titleEl.appendChild(dateContainer);
  
  // Update puzzle metadata
  const metaEl = document.getElementById('puzzle-meta');
  metaEl.className = 'flex justify-center items-center gap-2 mb-6';
  metaEl.innerHTML = '';
  
  // 添加难度
  const difficultyBadge = document.createElement('span');
  difficultyBadge.className = 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium';
  difficultyBadge.textContent = `Difficulty: ${formatDifficulty(puzzleData.difficulty)}`;
  metaEl.appendChild(difficultyBadge);
  
  // 添加数据源标记
  const dataSourceBadge = document.createElement('span');
  dataSourceBadge.className = puzzleData.isSampleData 
    ? 'bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium'
    : 'bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium';
  dataSourceBadge.textContent = puzzleData.isSampleData ? 'Sample Data' : 'Live Data';
  metaEl.appendChild(dataSourceBadge);
  
  // Add source link if available
  if (puzzleData.sourceUrl) {
    const sourceLink = document.createElement('a');
    sourceLink.href = puzzleData.sourceUrl;
    sourceLink.target = '_blank';
    sourceLink.className = 'text-purple-600 hover:text-purple-800 text-sm font-medium';
    sourceLink.textContent = '查看原文';
    metaEl.appendChild(sourceLink);
  }
  
  // Clear categories container
  const categoriesContainer = document.getElementById('categories-container');
  categoriesContainer.innerHTML = '';
  
  // Add game mode toggle button
  const modeToggleDiv = document.createElement('div');
  modeToggleDiv.className = 'flex justify-center mb-4';
  
  const modeToggleButton = document.createElement('button');
  modeToggleButton.id = 'mode-toggle';
  modeToggleButton.className = 'px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors animate-solution-pulse';
  modeToggleButton.textContent = 'Show Solution';
  modeToggleDiv.appendChild(modeToggleButton);
  
  // Add animation style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes solution-pulse {
      0%, 100% {
        background-color: rgb(147, 51, 234);  /* purple-600 */
        box-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
        transform: scale(1);
      }
      50% {
        background-color: rgb(126, 34, 206);  /* purple-700 */
        box-shadow: 0 0 20px rgba(147, 51, 234, 0.9),
                   0 0 30px rgba(147, 51, 234, 0.4);
        transform: scale(1.05);
      }
    }
    .animate-solution-pulse {
      animation: solution-pulse 2.5s ease-in-out infinite;
      position: relative;
      font-weight: bold;
    }
    .animate-solution-pulse:after {
      content: '';
      position: absolute;
      inset: -3px;
      background: linear-gradient(45deg, #eab308, #22c55e, #3b82f6, #9333ea);
      border-radius: 8px;
      z-index: -1;
      animation: solution-border 16s linear infinite;
      opacity: 0.5;
    }
    @keyframes solution-border {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
  
  categoriesContainer.appendChild(modeToggleDiv);
  
  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.className = 'mb-6';
  categoriesContainer.appendChild(gameContainer);
  
  // Create solution container (initially hidden)
  const solutionContainer = document.createElement('div');
  solutionContainer.id = 'solution-container';
  solutionContainer.className = 'hidden';
  categoriesContainer.appendChild(solutionContainer);
  
  // Display game UI
  displayGameUI(puzzleData, gameContainer);
  
  // Display solution UI (but keep it hidden initially)
  displaySolutionUI(puzzleData, solutionContainer);
  
  // Add event listener to toggle button
  modeToggleButton.addEventListener('click', function() {
    const gameContainer = document.getElementById('game-container');
    const solutionContainer = document.getElementById('solution-container');
    
    if (gameContainer.classList.contains('hidden')) {
      // Switch to game mode
      gameContainer.classList.remove('hidden');
      solutionContainer.classList.add('hidden');
      this.textContent = 'Show Solution';
    } else {
      // Switch to solution mode
      gameContainer.classList.add('hidden');
      solutionContainer.classList.remove('hidden');
      this.textContent = 'Show Game';
    }
  });
}

/**
 * Display game UI
 */
function displayGameUI(puzzleData, container) {
  // Flatten all words from all categories into a single array
  let allWords = [];
  puzzleData.categories.forEach(category => {
    allWords = allWords.concat(category.words);
  });
  
  // Shuffle the words
  shuffleArray(allWords);
  
  // Create game status display (attempts counter, etc)
  const gameStatus = document.createElement('div');
  gameStatus.className = 'flex justify-between items-center mb-4';
  
  // Attempts counter
  const attemptsCounter = document.createElement('div');
  attemptsCounter.id = 'attempts-counter';
  attemptsCounter.className = 'text-sm font-medium';
  attemptsCounter.innerHTML = '<span class="font-bold">Attempts:</span> <span id="current-attempts">0</span>/4';
  gameStatus.appendChild(attemptsCounter);

  // Add status message area
  const statusMessage = document.createElement('div');
  statusMessage.id = 'status-message';
  statusMessage.className = 'text-sm text-gray-600';
  statusMessage.textContent = 'Find groups of 4 connected words';
  gameStatus.appendChild(statusMessage);
  
  container.appendChild(gameStatus);
  
  // Create the game board
  const gameBoard = document.createElement('div');
  gameBoard.className = 'mb-4';
  
  // Create found groups container
  const foundGroups = document.createElement('div');
  foundGroups.id = 'found-groups';
  foundGroups.className = 'space-y-2 mb-4';
  gameBoard.appendChild(foundGroups);
  
  // Create the game grid with NYT style
  const gameGrid = document.createElement('div');
  gameGrid.id = 'game-grid';
  gameGrid.className = 'grid grid-cols-4 gap-2 mb-4';
  
  // Add each word as a selectable tile with NYT style
  allWords.forEach(word => {
    const wordTile = document.createElement('div');
    wordTile.className = 'p-3 bg-gray-100 border border-gray-300 rounded cursor-pointer text-center font-medium hover:bg-gray-200 select-none transition-colors';
    wordTile.textContent = word;
    wordTile.dataset.word = word;
    
    // Add click event to select/deselect words
    wordTile.addEventListener('click', function() {
      // Only allow selection if not already part of a found group
      if (this.classList.contains('found')) return;
      
      const isSelected = this.classList.contains('selected');
      
      // Toggle selection
      if (isSelected) {
        this.classList.remove('selected', 'bg-blue-200', 'border-blue-400');
        this.classList.add('bg-gray-100', 'border-gray-300');
      } else {
        this.classList.add('selected', 'bg-blue-200', 'border-blue-400');
        this.classList.remove('bg-gray-100', 'border-gray-300');
      }
      
      // Count selected words
      const selectedWords = document.querySelectorAll('#game-grid .selected');
      
      // Update submit button state
      const submitButton = document.getElementById('submit-button');
      if (selectedWords.length === 4) {
        submitButton.disabled = false;
        submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        submitButton.classList.add('bg-green-600', 'hover:bg-green-700');
      } else {
        submitButton.disabled = true;
        submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        submitButton.classList.remove('bg-green-600', 'hover:bg-green-700');
      }
      
      // Update status message
      updateStatusMessage(selectedWords.length);
    });
    
    gameGrid.appendChild(wordTile);
  });
  
  gameBoard.appendChild(gameGrid);
  container.appendChild(gameBoard);
  
  // Game controls
  const gameControls = document.createElement('div');
  gameControls.className = 'flex flex-col sm:flex-row gap-2';
  
  // Submit button (initially disabled)
  const submitButton = document.createElement('button');
  submitButton.id = 'submit-button';
  submitButton.className = 'flex-1 py-2 px-4 bg-gray-400 text-white rounded font-medium cursor-not-allowed transition-colors';
  submitButton.textContent = 'Submit';
  submitButton.disabled = true;
  
  // Add submit handler
  submitButton.addEventListener('click', function() {
    checkSelection(puzzleData);
  });
  
  // Shuffle button
  const shuffleButton = document.createElement('button');
  shuffleButton.className = 'py-2 px-4 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition-colors';
  shuffleButton.textContent = 'Shuffle';
  
  // Add shuffle handler
  shuffleButton.addEventListener('click', function() {
    shuffleGameGrid();
  });
  
  // Deselect button
  const deselectButton = document.createElement('button');
  deselectButton.className = 'py-2 px-4 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition-colors';
  deselectButton.textContent = 'Deselect All';
  
  // Add deselect handler
  deselectButton.addEventListener('click', function() {
    deselectAllWords();
  });
  
  gameControls.appendChild(submitButton);
  gameControls.appendChild(shuffleButton);
  gameControls.appendChild(deselectButton);
  
  container.appendChild(gameControls);
  
  // Game help text
  const helpText = document.createElement('p');
  helpText.className = 'text-center text-gray-600 mt-4 text-sm';
  helpText.textContent = 'Select 4 words that share a connection, then press Submit';
  container.appendChild(helpText);
  
  // Create AI Assistant section
  const aiAssistantSection = document.createElement('div');
  aiAssistantSection.id = 'ai-assistant';
  aiAssistantSection.className = 'mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200';
  
  // AI Assistant header
  const aiHeader = document.createElement('div');
  aiHeader.className = 'flex items-center mb-3 sticky top-0 bg-blue-50 z-10';
  
  const aiIcon = document.createElement('div');
  aiIcon.className = 'w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2';
  aiIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg>';
  aiHeader.appendChild(aiIcon);
  
  const aiTitle = document.createElement('h3');
  aiTitle.className = 'font-bold text-blue-800';
  aiTitle.textContent = 'AI Assistant';
  aiHeader.appendChild(aiTitle);
  
  aiAssistantSection.appendChild(aiHeader);
  
  // AI messages container with fixed height and scrollbar
  const aiMessagesContainer = document.createElement('div');
  aiMessagesContainer.id = 'ai-messages';
  aiMessagesContainer.className = 'space-y-2 mb-3 bg-white rounded-lg border-2 border-blue-200 shadow-inner';
  aiMessagesContainer.style.cssText = `
    height: 300px !important;
    overflow-y: scroll !important;
    padding: 1rem;
    scrollbar-width: thin;
    scrollbar-color: #93C5FD transparent;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: -ms-autohiding-scrollbar;
  `;
  
  // Add initial message
  const initialMessage = document.createElement('div');
  initialMessage.className = 'p-2 bg-blue-50 rounded-lg shadow-sm';
  initialMessage.textContent = 'Hello! I\'m your AI assistant. I\'ll give you hints when you submit your guesses. Try to find groups of 4 connected words!';
  aiMessagesContainer.appendChild(initialMessage);
  
  aiAssistantSection.appendChild(aiMessagesContainer);
  
  // Hint button
  const hintButton = document.createElement('button');
  hintButton.className = 'w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
  hintButton.textContent = 'Ask for a Hint';
  
  // Add hint button handler
  hintButton.addEventListener('click', function() {
    provideHint(puzzleData);
  });
  
  aiAssistantSection.appendChild(hintButton);
  container.appendChild(aiAssistantSection);
}

/**
 * Update status message based on number of selected words
 */
function updateStatusMessage(selectedCount) {
  const statusMessage = document.getElementById('status-message');
  if (!statusMessage) return;
  
  if (selectedCount === 0) {
    statusMessage.textContent = 'Find groups of 4 connected words';
  } else if (selectedCount < 4) {
    statusMessage.textContent = `Select ${4 - selectedCount} more word${selectedCount === 3 ? '' : 's'}`;
  } else if (selectedCount === 4) {
    statusMessage.textContent = 'Press Submit to check your answer';
  }
}

/**
 * Shuffle the game grid
 */
function shuffleGameGrid() {
  const gameGrid = document.getElementById('game-grid');
  if (!gameGrid) return;
  
  // Get all word tiles that are not part of found groups
  const wordTiles = Array.from(gameGrid.querySelectorAll('div:not(.found)'));
  
  // Deselect all words first
  deselectAllWords();
  
  // Shuffle the array
  shuffleArray(wordTiles);
  
  // Reappend in new order
  wordTiles.forEach(tile => {
    gameGrid.appendChild(tile);
  });
}

/**
 * Deselect all words in the grid
 */
function deselectAllWords() {
  const selectedTiles = document.querySelectorAll('#game-grid .selected');
  selectedTiles.forEach(tile => {
    tile.classList.remove('selected', 'bg-blue-200', 'border-blue-400');
    tile.classList.add('bg-gray-100', 'border-gray-300');
  });
  
  // Update submit button state
  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');
    submitButton.classList.remove('bg-green-600', 'hover:bg-green-700');
  }
  
  // Update status message
  updateStatusMessage(0);
}

/**
 * Check if the selected words form a valid group
 */
function checkSelection(puzzleData) {
  // Get all selected words
  const selectedTiles = document.querySelectorAll('#game-grid .selected');
  if (selectedTiles.length !== 4) return;
  
  // Extract selected words
  const selectedWords = Array.from(selectedTiles).map(tile => tile.dataset.word);
  
  // Check if these words belong to the same category
  let matchedCategory = null;
  let isCorrect = false;
  
  // Check each category
  puzzleData.categories.forEach(category => {
    // Check if all selected words are in this category
    const allWordsInCategory = selectedWords.every(word => 
      category.words.includes(word)
    );
    
    if (allWordsInCategory) {
      matchedCategory = category;
      isCorrect = true;
    }
  });
  
  // Update attempts counter
  const attemptsElement = document.getElementById('current-attempts');
  if (attemptsElement) {
    const currentAttempts = parseInt(attemptsElement.textContent) + 1;
    attemptsElement.textContent = currentAttempts;
  }
  
  if (isCorrect) {
    // Handle correct answer
    handleCorrectAnswer(selectedTiles, matchedCategory);
  } else {
    // Handle incorrect answer
    handleIncorrectAnswer(selectedTiles, selectedWords, puzzleData);
  }
}

/**
 * Handle correct answer submission
 */
function handleCorrectAnswer(selectedTiles, category) {
  // Get category colors
  const categoryColors = getCategoryColors();
  const foundGroups = document.getElementById('found-groups');
  const gameGrid = document.getElementById('game-grid');
  const statusMessage = document.getElementById('status-message');
  
  // Determine color based on difficulty or name pattern
  let colorIndex = 0;
  if (category.name.toLowerCase().includes('movie') || 
      category.name.toLowerCase().includes('villain')) {
    colorIndex = 2; // Blue for movie category
  } else if (category.name.toLowerCase().includes('horse')) {
    colorIndex = 1; // Green for horse category
  } else if (category.name.toLowerCase().includes('ice')) {
    colorIndex = 3; // Purple for -ice words
  }
  
  // Create group container with appropriate color
  const groupContainer = document.createElement('div');
  groupContainer.className = `p-2 rounded-lg ${categoryColors[colorIndex].bg} ${categoryColors[colorIndex].text}`;
  
  // Add category name
  const categoryName = document.createElement('div');
  categoryName.className = 'font-bold text-center mb-1';
  categoryName.textContent = category.name;
  groupContainer.appendChild(categoryName);
  
  // Add words in a grid
  const wordsContainer = document.createElement('div');
  wordsContainer.className = 'grid grid-cols-4 gap-1';
  
  // Add each word
  selectedTiles.forEach(tile => {
    const word = document.createElement('div');
    word.className = 'p-1 text-center text-sm bg-white bg-opacity-20 rounded';
    word.textContent = tile.textContent;
    wordsContainer.appendChild(word);
    
    // Mark tile as found and remove from grid
    tile.remove();
  });
  
  groupContainer.appendChild(wordsContainer);
  
  // Add to found groups
  foundGroups.appendChild(groupContainer);
  
  // Update status message
  statusMessage.textContent = 'Great job! Group found.';
  
  // Add AI assistant message
  addAIMessage(`Great job! You found the "${category.name}" group. Keep going!`);
  
  // Check if game is complete
  const remainingTiles = gameGrid.querySelectorAll('div');
  if (remainingTiles.length === 0) {
    // Game complete
    const gameComplete = document.createElement('div');
    gameComplete.className = 'text-center p-4 bg-green-100 text-green-800 rounded mt-4';
    gameComplete.innerHTML = '<p class="font-bold">Puzzle Complete!</p><p>You\'ve found all the connections!</p>';
    
    document.getElementById('game-container').appendChild(gameComplete);
    
    // Final AI message
    addAIMessage("Congratulations! You've completed the puzzle! You've successfully identified all the connections.");
  }
}

/**
 * Handle incorrect answer submission
 */
function handleIncorrectAnswer(selectedTiles, selectedWords, puzzleData) {
  // Visual feedback for incorrect selection
  selectedTiles.forEach(tile => {
    // Briefly show red background
    tile.classList.add('bg-red-200', 'border-red-400');
    tile.classList.remove('bg-blue-200', 'border-blue-400');
    
    // Reset after animation
    setTimeout(() => {
      tile.classList.remove('selected', 'bg-red-200', 'border-red-400');
      tile.classList.add('bg-gray-100', 'border-gray-300');
    }, 1000);
  });
  
  // Update status message
  const statusMessage = document.getElementById('status-message');
  statusMessage.textContent = 'Not a valid group. Try again!';
  
  // Disable submit button
  const submitButton = document.getElementById('submit-button');
  submitButton.disabled = true;
  submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');
  submitButton.classList.remove('bg-green-600', 'hover:bg-green-700');
  
  // Generate AI hint for incorrect selection
  generateIncorrectSelectionHint(selectedWords, puzzleData);
}

/**
 * Generate hint for incorrect selection
 */
async function generateIncorrectSelectionHint(selectedWords, puzzleData) {
  // Show thinking status
  showAIThinking();

  try {
    // 使用真实AI生成提示
    if (aiApiAvailable) {
      // 创建提示上下文
      const context = {
        selectedWords: selectedWords,
        categories: puzzleData.categories,
        attempts: parseInt(document.getElementById('current-attempts').textContent)
      };
      
      // 调用AI API获取提示
      const message = await generateAIHintForIncorrectSelection(context);
      hideAIThinking();
      addAIMessage(message);
    } else {
      // 没有AI API可用，使用本地提示生成
      hideAIThinking();
      addAIMessage(generateLocalHint(selectedWords, puzzleData));
    }
  } catch (error) {
    console.error('Error getting AI hint:', error);
    hideAIThinking();
    addAIMessage('Sorry, there was an error generating the hint. Please try again later.');
  }
}

/**
 * 本地提示生成（作为备用）
 */
function generateLocalHint(selectedWords, puzzleData) {
  // Count how many words from each category are in the selection
  const categoryCounts = [];
  
  puzzleData.categories.forEach(category => {
    const count = selectedWords.filter(word => category.words.includes(word)).length;
    categoryCounts.push({
      category: category,
      count: count
    });
  });
  
  // Sort by count (highest first)
  categoryCounts.sort((a, b) => b.count - a.count);
  
  let message = "";
  
  // Check if there are words from the same category
  if (categoryCounts[0].count >= 2) {
    const bestCategory = categoryCounts[0].category;
    const matchingWords = selectedWords.filter(word => bestCategory.words.includes(word));
    
    message = `I notice that ${matchingWords.length} of your selected words (${matchingWords.join(', ')}) might be related. Try to find more words that connect with these!`;
  } else {
    // No clear pattern
    message = "These words don't seem to form a group. Look for words that share a common theme, category, or characteristic.";
  }
  
  // Get a random additional tip
  const tips = [
    "Try looking for words that belong to the same category.",
    "Consider different ways words can be related - by topic, use, or meaning.",
    "Sometimes the connection isn't obvious at first - think creatively!",
    "Look for patterns like words that start with the same letter or have similar meanings.",
    "The groups may be related to things like food, colors, sports, or other categories."
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  message += " " + randomTip;
  
  return message;
}

/**
 * 生成AI提示（使用外部AI API）
 */
async function generateAIHintForIncorrectSelection(context) {
  // 检查AI API是否可用
  if (!aiApiAvailable) {
    throw new Error("AI API not available");
  }
  
  // 创建提示字符串
  const prompt = `I'm playing NYT Connections and I've selected these words: "${context.selectedWords.join('", "')}". 
  But they don't form a valid group. The game has these categories:
  ${context.categories.map(cat => `- ${cat.name}: ${cat.words.join(', ')}`).join('\n')}
  
  Please give me a helpful hint that points me in the right direction without directly revealing the answer. I've made ${context.attempts} attempts so far.`;
  
  try {
    // 使用window.generateAiHint函数（由ai-helper.js提供）
    return await window.generateAiHint(prompt, 'incorrect_selection');
  } catch (error) {
    console.error("Error generating AI hint:", error);
    throw error;
  }
}

/**
 * Provide a hint based on the current game state
 */
async function provideHint(puzzleData) {
  // Show thinking status
  showAIThinking();

  try {
    // 使用真实AI生成提示
    if (aiApiAvailable) {
      // 获取游戏状态
      const remainingTiles = document.querySelectorAll('#game-grid div');
      const remainingWords = Array.from(remainingTiles).map(tile => tile.dataset.word);
      
      // 获取已找到的类别
      const foundGroups = document.getElementById('found-groups').children;
      const foundCategoryNames = Array.from(foundGroups).map(group => 
        group.querySelector('div').textContent
      );
      
      // 确定剩余类别
      const remainingCategories = puzzleData.categories.filter(category => 
        !foundCategoryNames.includes(category.name)
      );
      
      // 创建上下文
      const context = {
        remainingWords: remainingWords,
        remainingCategories: remainingCategories,
        foundCategories: foundCategoryNames,
        attempts: parseInt(document.getElementById('current-attempts').textContent)
      };
      
      // 调用AI API获取提示
      const message = await generateAIHintForGameState(context);
      hideAIThinking();
      addAIMessage(message);
    } else {
      // 没有AI API可用，使用本地提示生成
      hideAIThinking();
      addAIMessage(generateLocalGameStateHint(puzzleData));
    }
  } catch (error) {
    console.error('Error getting AI hint:', error);
    hideAIThinking();
    addAIMessage('Sorry, there was an error generating the hint. Please try again later.');
  }
}

/**
 * 使用AI API生成游戏状态提示
 */
async function generateAIHintForGameState(context) {
  // 检查AI API是否可用
  if (!aiApiAvailable) {
    throw new Error("AI API not available");
  }
  
  // 创建提示字符串
  const prompt = `I'm playing NYT Connections puzzle. So far I've found ${context.foundCategories.length} categories: ${context.foundCategories.join(', ')}.
  
  The remaining words are: "${context.remainingWords.join('", "')}"
  
  The remaining categories are: ${context.remainingCategories.map(cat => `${cat.name} (${cat.words.join(', ')})`).join('; ')}
  
  I've made ${context.attempts} attempts so far. Please give me a hint that helps me find one of the remaining categories without directly revealing the answer. Make your hint specific enough to be helpful but still require thinking.`;
  
  try {
    // 使用window.generateAiHint函数（由ai-helper.js提供）
    return await window.generateAiHint(prompt, 'game_state');
  } catch (error) {
    console.error("Error generating AI hint:", error);
    throw error;
  }
}

/**
 * Display solution UI
 */
function displaySolutionUI(puzzleData, container) {
  // Get category colors
  const categoryColors = getCategoryColors();
  
  // Display each category
  puzzleData.categories.forEach((category, index) => {
    const categoryEl = document.createElement('div');
    categoryEl.className = `p-3 rounded-lg ${categoryColors[index].bg} ${categoryColors[index].text} mb-4`;
    
    // Category name
    const nameEl = document.createElement('h3');
    nameEl.className = 'font-bold mb-2';
    nameEl.textContent = category.name;
    categoryEl.appendChild(nameEl);
    
    // Category words
    const wordsEl = document.createElement('div');
    wordsEl.className = 'grid grid-cols-2 gap-2';
    
    category.words.forEach(word => {
      const wordEl = document.createElement('div');
      wordEl.className = 'p-2 bg-white bg-opacity-20 rounded text-center';
      wordEl.textContent = word;
      wordsEl.appendChild(wordEl);
    });
    
    categoryEl.appendChild(wordsEl);
    container.appendChild(categoryEl);
  });
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Display archive list with pagination
 */
function displayArchiveList(archiveList) {
  const archiveListEl = document.getElementById('archive-list');
  archiveListEl.innerHTML = '';
  
  if (!archiveList || archiveList.length === 0) {
    archiveListEl.innerHTML = '<p class="col-span-full text-center text-gray-500">没有找到已存档的谜题</p>';
    return;
  }

  // 分页配置
  const itemsPerPage = 12; // 每页显示12个谜题
  const totalPages = Math.ceil(archiveList.length / itemsPerPage);
  let currentPage = 1;

  // 创建分页容器
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'col-span-full flex flex-col items-center gap-4 mt-4';
  
  // 添加分页信息
  const pageInfo = document.createElement('div');
  pageInfo.className = 'text-sm text-gray-600';
  pageInfo.textContent = `共 ${archiveList.length} 个谜题`;
  paginationContainer.appendChild(pageInfo);

  // 创建分页控制器
  const paginationControls = document.createElement('div');
  paginationControls.className = 'flex gap-2';

  // 显示指定页的内容
  function displayPage(page) {
    currentPage = page;
    archiveListEl.innerHTML = '';

    // 计算当前页的数据范围
    const start = (page - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, archiveList.length);
    const currentItems = archiveList.slice(start, end);

    // 显示当前页的谜题
    currentItems.forEach(item => {
      const archiveItemEl = document.createElement('div');
      archiveItemEl.className = 'archive-item p-3 border rounded cursor-pointer hover:bg-gray-100 transition-colors';
      archiveItemEl.dataset.date = item.date;
      
      const dateEl = document.createElement('div');
      dateEl.className = 'text-sm font-medium';
      try {
        dateEl.textContent = formatDisplayDate(item.date);
      } catch (error) {
        console.error('Error formatting date:', error);
        dateEl.textContent = 'Invalid Date';
      }
      archiveItemEl.appendChild(dateEl);
      
      const difficultyEl = document.createElement('div');
      difficultyEl.className = `text-xs ${getDifficultyColor(item.difficulty)}`;
      difficultyEl.textContent = formatDifficulty(item.difficulty);
      archiveItemEl.appendChild(difficultyEl);
      
      archiveListEl.appendChild(archiveItemEl);
    });

    // 更新分页按钮状态
    updatePaginationControls();
  }

  // 更新分页控制器状态
  function updatePaginationControls() {
    paginationControls.innerHTML = '';

    // 首页按钮
    const firstPageBtn = document.createElement('button');
    firstPageBtn.className = `px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`;
    firstPageBtn.textContent = '首页';
    firstPageBtn.disabled = currentPage === 1;
    firstPageBtn.onclick = () => displayPage(1);
    paginationControls.appendChild(firstPageBtn);

    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`;
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => displayPage(currentPage - 1);
    paginationControls.appendChild(prevBtn);

    // 页码显示
    const pageDisplay = document.createElement('span');
    pageDisplay.className = 'px-3 py-1 bg-purple-500 text-white rounded';
    pageDisplay.textContent = `${currentPage} / ${totalPages}`;
    paginationControls.appendChild(pageDisplay);

    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`;
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => displayPage(currentPage + 1);
    paginationControls.appendChild(nextBtn);

    // 末页按钮
    const lastPageBtn = document.createElement('button');
    lastPageBtn.className = `px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`;
    lastPageBtn.textContent = '末页';
    lastPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.onclick = () => displayPage(totalPages);
    paginationControls.appendChild(lastPageBtn);
  }

  // 添加分页控制器到容器
  paginationContainer.appendChild(paginationControls);
  
  // 显示第一页内容
  displayPage(1);
  
  // 添加分页容器到archive list
  archiveListEl.appendChild(paginationContainer);
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
  const container = document.getElementById('puzzle-container');
  if (container) {
    // 创建错误消息元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
    errorDiv.role = 'alert';
    
    // 添加错误消息
    const messageP = document.createElement('p');
    messageP.textContent = message;
    errorDiv.appendChild(messageP);
    
    // 添加重试按钮
    const retryButton = document.createElement('button');
    retryButton.className = 'mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded';
    retryButton.textContent = '重试';
    retryButton.onclick = async () => {
      errorDiv.remove();
      await loadTodaysPuzzle();
    };
    errorDiv.appendChild(retryButton);
    
    // 插入到容器开头
    container.insertBefore(errorDiv, container.firstChild);
  }
}

/**
 * Get category colors
 */
function getCategoryColors() {
  return [
    { bg: 'bg-yellow-500', text: 'text-yellow-900' },
    { bg: 'bg-green-500', text: 'text-green-900' },
    { bg: 'bg-blue-500', text: 'text-blue-900' },
    { bg: 'bg-purple-500', text: 'text-purple-900' }
  ];
}

/**
 * Get difficulty color class
 */
function getDifficultyColor(difficulty) {
  switch(difficulty.toLowerCase()) {
    case 'easy':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'hard':
      return 'text-orange-600';
    case 'very hard':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Format difficulty display
 */
function formatDifficulty(difficulty) {
  if (!difficulty) return 'Normal';
  
  switch(difficulty.toLowerCase()) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
    case 'very hard':
      return 'Very Hard';
    default:
      return difficulty;
  }
}

/**
 * Format date for display
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) {
    return 'Invalid Date';
  }

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const today = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Check if it's today's date
    if (date.toDateString() === today.toDateString()) {
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (Today)`;
    }
    
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch (error) {
    console.error('Error in formatDisplayDate:', error);
    return 'Invalid Date';
  }
}

/**
 * Get a vague hint for a category
 */
function getVagueHint(category) {
  const name = category.name.toLowerCase();
  
  if (name.includes('shell')) {
    return "things that provide protection";
  } else if (name.includes('horse')) {
    return "a certain animal";
  } else if (name.includes('movie') || name.includes('villain')) {
    return "characters from popular entertainment";
  } else if (name.includes('ice')) {
    return "words with a similar ending";
  }
  
  return "a common theme";
}

/**
 * Get a medium specificity hint for a category
 */
function getMediumHint(category) {
  const name = category.name.toLowerCase();
  
  if (name.includes('shell')) {
    return "objects that have shells or protective coverings";
  } else if (name.includes('horse')) {
    return "things associated with horseback riding";
  } else if (name.includes('movie') || name.includes('villain')) {
    return "antagonists from famous stories";
  } else if (name.includes('ice')) {
    return "words that end with the same three letters";
  }
  
  return "a common characteristic";
}

/**
 * Get a specific hint for a category
 */
function getSpecificHint(category) {
  const name = category.name.toLowerCase();
  
  if (name.includes('shell')) {
    return "things that have shells";
  } else if (name.includes('horse')) {
    return "horse equipment and locations";
  } else if (name.includes('movie') || name.includes('villain')) {
    return "movie or book villains";
  } else if (name.includes('ice')) {
    return "words ending with -ICE";
  }
  
  return category.name;
}

/**
 * Add AI message to the chat
 */
function addAIMessage(message) {
  const aiMessages = document.getElementById('ai-messages');
  if (!aiMessages) return;
  
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'p-2 bg-blue-50 rounded-lg shadow-sm mb-2';
  messageContainer.textContent = message;
  
  // Create hint level buttons container
  const hintLevelsContainer = document.createElement('div');
  hintLevelsContainer.className = 'flex gap-2 mt-2';
  
  // Create hint level buttons
  const lightHintBtn = document.createElement('button');
  lightHintBtn.className = 'flex-1 py-1 px-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm transition-colors';
  lightHintBtn.textContent = 'Give a little hint';
  lightHintBtn.onclick = () => generateHintByLevel('light');
  
  const mediumHintBtn = document.createElement('button');
  mediumHintBtn.className = 'flex-1 py-1 px-2 bg-blue-300 text-blue-800 rounded hover:bg-blue-400 text-sm transition-colors';
  mediumHintBtn.textContent = 'Give more hints';
  mediumHintBtn.onclick = () => generateHintByLevel('medium');
  
  const answerHintBtn = document.createElement('button');
  answerHintBtn.className = 'flex-1 py-1 px-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors';
  answerHintBtn.textContent = 'Show final answer';
  answerHintBtn.onclick = () => generateHintByLevel('answer');
  
  // Add buttons to container
  hintLevelsContainer.appendChild(lightHintBtn);
  hintLevelsContainer.appendChild(mediumHintBtn);
  hintLevelsContainer.appendChild(answerHintBtn);
  
  // Add hint levels container to message
  messageContainer.appendChild(hintLevelsContainer);
  
  // Add message to chat
  aiMessages.appendChild(messageContainer);
  
  // Scroll to bottom
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

/**
 * Show AI thinking status
 */
function showAIThinking() {
  const aiMessages = document.getElementById('ai-messages');
  if (!aiMessages) return;
  
  // Create thinking message container
  const thinkingContainer = document.createElement('div');
  thinkingContainer.id = 'ai-thinking';
  thinkingContainer.className = 'p-2 bg-gray-50 rounded-lg shadow-sm mb-2 flex items-center';
  
  // Add loading spinner
  const spinner = document.createElement('div');
  spinner.className = 'animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2';
  thinkingContainer.appendChild(spinner);
  
  // Add thinking text
  const text = document.createElement('span');
  text.className = 'text-gray-600 text-sm';
  text.textContent = 'AI is thinking...';
  thinkingContainer.appendChild(text);
  
  // Add to chat
  aiMessages.appendChild(thinkingContainer);
  
  // Scroll to bottom
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

/**
 * Hide AI thinking status
 */
function hideAIThinking() {
  const thinkingContainer = document.getElementById('ai-thinking');
  if (thinkingContainer) {
    thinkingContainer.remove();
  }
}

/**
 * Generate hint based on selected level
 */
async function generateHintByLevel(level) {
    // 如果 currentPuzzle 为 null,使用默认数据
    if (!currentPuzzle) {
        console.warn('No puzzle data available, using default puzzle data');
        // 使用默认示例数据
        currentPuzzle = {
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
            ]
        };
    }

    // Show thinking status
    showAIThinking();

    try {
        let hint;
        switch(level) {
            case 'light':
                hint = aiApiAvailable ? await generateLightHint(currentPuzzle) : generateLocalGameStateHint(currentPuzzle, 'light');
                break;
            case 'medium':
                hint = aiApiAvailable ? await generateMediumHint(currentPuzzle) : generateLocalGameStateHint(currentPuzzle, 'medium');
                break;
            case 'answer':
                hint = aiApiAvailable ? await generateAnswerHint(currentPuzzle) : generateLocalGameStateHint(currentPuzzle, 'answer');
                break;
            default:
                console.error('Invalid hint level');
                hideAIThinking();
                addAIMessage('Invalid hint level requested.');
                return;
        }

        // Hide thinking status before adding the message
        hideAIThinking();
        addAIMessage(hint);
    } catch (error) {
        console.error('Error generating hint:', error);
        hideAIThinking();
        addAIMessage('Sorry, there was an error generating the hint. Please try again later.');
    }
}

/**
 * Get remaining categories
 */
function getRemainingCategories() {
    // 确保有 puzzleData,如果没有则使用默认数据
    const puzzleData = currentPuzzle || {
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
        ]
    };
  
    // 获取已找到的类别
    const foundGroups = document.getElementById('found-groups');
    if (!foundGroups) return puzzleData.categories;
  
    const foundCategoryNames = Array.from(foundGroups.children).map(group => 
        group.querySelector('div')?.textContent || ''
    );
  
    // 返回未找到的类别
    return puzzleData.categories.filter(category => 
        !foundCategoryNames.includes(category.name)
    );
}

/**
 * Confirm before showing answer
 */
function confirmAndGenerateHint(level) {
  if (level === 'answer') {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
      <div class="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <h3 class="text-lg font-bold mb-2">Show Answer?</h3>
        <p class="text-gray-600 mb-4">Are you sure you want to see the answer? This might reduce the fun of solving the puzzle yourself.</p>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
          <button class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors" onclick="confirmShowAnswer(this)">Show Answer</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmDialog);
  } else {
    generateHintByLevel(level);
  }
}

/**
 * Handle confirmation to show answer
 */
function confirmShowAnswer(button) {
  // Remove dialog
  button.parentElement.parentElement.parentElement.remove();
  // Generate answer hint
  generateHintByLevel('answer');
} 