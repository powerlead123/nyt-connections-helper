/**
 * NYT Connections Puzzle Scraper
 * 这个脚本用于从Mashable获取每日NYT Connections游戏题目
 * 
 * 注意：这是一个简化版，可以通过浏览器控制台运行
 * 实际部署时应通过Cloudflare Workers或类似服务自动执行
 */

// 配置
const MASHABLE_URL = 'https://mashable.com/category/games';
const DATA_FILE = 'data/puzzles.json'; // 数据保存的位置

// 主函数
async function scrapeTodaysPuzzle() {
  try {
    console.log('开始抓取今日的游戏数据...');
    
    // 使用与server.js相同的URL生成逻辑
    const { year, month, day } = formatDateForUrl();
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthName = monthNames[month - 1];
    const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
    
    console.log(`抓取URL: ${url}`);
    
    // 直接抓取文章页面
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`抓取文章失败: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 解析文章内容
    const puzzleData = extractPuzzleData(html);
    
    // 格式化数据
    const formattedData = formatPuzzleData(puzzleData);
    
    // 保存到localStorage
    savePuzzleData(formattedData);
    
    console.log('游戏数据抓取成功!');
    return formattedData;
    
  } catch (error) {
    console.error('抓取过程中出现错误:', error);
    return null;
  }
}

// 从文章HTML中提取游戏数据
function extractPuzzleData(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 查找包含答案的部分
  const answerSection = Array.from(doc.querySelectorAll('h2')).find(h2 => 
    h2.textContent.includes('What is the answer to Connections today')
  )?.nextElementSibling;
  
  if (!answerSection) {
    throw new Error('未找到答案部分');
  }
  
  // 解析答案部分
  const categories = [];
  const answerLines = answerSection.querySelectorAll('li');
  
  if (answerLines.length !== 4) {
    throw new Error('未找到正确数量的类别');
  }
  
  // 处理每个类别
  answerLines.forEach(line => {
    const text = line.textContent.trim();
    const parts = text.split(':');
    
    if (parts.length !== 2) {
      console.warn('无效的答案行格式:', text);
      return;
    }
    
    const categoryName = parts[0].trim();
    const wordsText = parts[1].trim();
    const words = wordsText.split(',').map(word => word.trim());
    
    if (words.length !== 4) {
      console.warn('类别单词数量无效:', categoryName);
      return;
    }
    
    categories.push({
      name: categoryName,
      words: words
    });
  });
  
  if (categories.length !== 4) {
    throw new Error('未找到正确数量的类别');
  }
  
  // 获取难度
  const difficultyText = Array.from(doc.querySelectorAll('h2')).find(h2 => 
    h2.textContent.includes('Here are today\'s Connections categories')
  )?.previousElementSibling?.textContent || '';
  
  let difficulty = "medium";
  if (difficultyText.toLowerCase().includes('easy')) {
    difficulty = "easy";
  } else if (difficultyText.toLowerCase().includes('hard')) {
    difficulty = "hard";
  }
  
  return {
    date: formatDate(),
    categories: categories,
    difficulty: difficulty
  };
}

// 格式化数据为游戏所需格式
function formatPuzzleData(puzzleData) {
  // Connections游戏的标准颜色
  const colors = ['yellow', 'green', 'blue', 'purple'];
  
  // 将所有单词放入一个数组
  const allWords = [];
  
  // 为类别添加颜色
  const formattedCategories = puzzleData.categories.map((category, index) => {
    // 将单词添加到allWords数组
    category.words.forEach(word => {
      if (!allWords.includes(word)) {
        allWords.push(word);
      }
    });
    
    return {
      name: category.name,
      words: category.words,
      color: colors[index % colors.length]
    };
  });
  
  // 生成文章内容
  const articleContent = generateArticleContent(puzzleData);
  
  return {
    date: puzzleData.date,
    difficulty: puzzleData.difficulty,
    words: allWords,
    categories: formattedCategories,
    articleContent: articleContent,
    lastUpdated: new Date().toISOString()
  };
}

// 生成文章内容
function generateArticleContent(puzzleData) {
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
  puzzleData.categories.forEach(category => {
    categoryText += `<p>The "${category.name}" category includes ${category.words.join(', ')}.</p>`;
  });
  
  const lastCategory = puzzleData.categories.length > 0 ? 
    puzzleData.categories[puzzleData.categories.length - 1].name : 'final category';
  
  return `
    <h3>NYT Connections Puzzle for ${date}</h3>
    <p>Today's NYT Connections puzzle is ${difficultyText}. Let's break down each category:</p>
    ${categoryText}
    <p>Players found the "${lastCategory}" category to be the most challenging, as it requires thinking outside the box.</p>
    <p>If you're stuck on today's puzzle, try using our AI helper for customized hints based on your progress!</p>
  `;
}

// 保存游戏数据（在浏览器环境中使用localStorage）
function savePuzzleData(data) {
  // 尝试获取现有数据
  let puzzleData = {
    latest: null,
    archive: []
  };
  
  try {
    const existingData = localStorage.getItem('puzzleData');
    if (existingData) {
      puzzleData = JSON.parse(existingData);
    }
  } catch (e) {
    console.error('读取现有数据失败:', e);
  }
  
  // 检查是否已存在相同日期的数据
  const sameDate = (date1, date2) => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };
  
  const existingIndex = puzzleData.archive.findIndex(p => sameDate(p.date, data.date));
  
  if (existingIndex >= 0) {
    // 更新现有条目
    puzzleData.archive[existingIndex] = data;
  } else {
    // 添加新条目
    puzzleData.archive.push(data);
  }
  
  // 设置为最新
  puzzleData.latest = data;
  
  // 保存回localStorage
  localStorage.setItem('puzzleData', JSON.stringify(puzzleData));
  localStorage.setItem('lastUpdated', new Date().toISOString());
  
  console.log('数据已保存到localStorage');
}

// 加载游戏数据（在游戏初始化时调用）
function loadPuzzleData() {
  try {
    const data = localStorage.getItem('puzzleData');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载数据失败:', e);
  }
  
  return {
    latest: null,
    archive: []
  };
}

// 检查是否需要更新（如果上次更新是一天前）
function checkForUpdate() {
  const lastUpdated = localStorage.getItem('lastUpdated');
  if (!lastUpdated) {
    return true;
  }
  
  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  
  // 如果上次更新是昨天或更早，则需要更新
  return !isSameDate(lastUpdateDate, now);
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 获取保存的数据
  const puzzleData = loadPuzzleData();
  
  // 如果今天还没有更新数据，尝试抓取
  if (checkForUpdate()) {
    console.log('检测到需要更新数据...');
    try {
      await scrapeTodaysPuzzle();
      console.log('数据已更新');
    } catch (error) {
      console.error('更新数据时出错:', error);
    }
  }
  
  // 此时可以使用puzzleData初始化游戏
  // 通常这将在game.js中处理
});

// 导出函数供其他脚本使用
window.scrapeTodaysPuzzle = scrapeTodaysPuzzle;
window.loadPuzzleData = loadPuzzleData;

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

// Helper function to compare dates (ignoring time)
function isSameDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
} 