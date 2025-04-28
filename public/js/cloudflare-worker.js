/**
 * Cloudflare Worker脚本 - NYT Connections Helper
 * 用于抓取Mashable网站的NYT Connections文章并提供API服务
 */

// 环境变量（在Cloudflare管理界面设置）
// AI_API_KEY - AI API密钥，用于生成提示和解释

// KV命名空间（在Cloudflare管理界面创建）
// PUZZLES - 用于存储抓取的谜题数据

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 定时抓取任务 (每天6AM UTC运行)
addEventListener('scheduled', event => {
  event.waitUntil(handleSchedule(event.scheduledTime));
});

/**
 * 处理计划任务 - 每天抓取新的谜题
 */
async function handleSchedule(scheduledTime) {
  console.log(`开始计划任务: ${new Date(scheduledTime).toISOString()}`);
  try {
    const puzzleData = await scrapeTodaysPuzzle();
    if (puzzleData) {
      // 存储到KV
      await savePuzzleData(puzzleData);
      console.log(`成功抓取并保存: ${puzzleData.date}`);
    }
  } catch (error) {
    console.error(`抓取失败: ${error}`);
  }
}

/**
 * 处理HTTP请求
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 允许跨域请求
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  // 处理预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  // API路由
  if (url.pathname.startsWith('/api/')) {
    // 在API请求上添加CORS头
    return handleApiRequest(request, url, corsHeaders);
  }
  
  // 为HTML页面注入动态内容
  const response = await fetch(request);
  return rewriteResponse(response);
}

/**
 * 处理API请求
 */
async function handleApiRequest(request, url, corsHeaders) {
  // 获取今天的谜题
  if (url.pathname === '/api/today') {
    const todayPuzzle = await getTodaysPuzzle();
    return new Response(JSON.stringify(todayPuzzle), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  
  // 获取特定日期的谜题
  if (url.pathname === '/api/puzzle') {
    const date = url.searchParams.get('date');
    if (!date) {
      return new Response(JSON.stringify({ error: "Date parameter required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    const puzzle = await getPuzzleByDate(date);
    if (!puzzle) {
      return new Response(JSON.stringify({ error: "Puzzle not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify(puzzle), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  
  // 获取存档列表
  if (url.pathname === '/api/archive') {
    const archiveList = await getArchiveList();
    return new Response(JSON.stringify(archiveList), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  
  // 手动触发抓取（可以添加密钥保护）
  if (url.pathname === '/api/scrape') {
    try {
      const puzzleData = await scrapeTodaysPuzzle();
      if (puzzleData) {
        await savePuzzleData(puzzleData);
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Puzzle scraped successfully",
          data: puzzleData
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Failed to scrape puzzle",
        error: error.toString()
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  
  // 不支持的API端点
  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

/**
 * 重写HTML响应，注入动态内容
 */
async function rewriteResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    let html = await response.text();
    
    // 获取环境变量中的API密钥
    const apiKey = AI_API_KEY || "";
    
    // 注入API密钥
    html = html.replace('<meta name="ai-api-key" content="">', 
                       `<meta name="ai-api-key" content="${apiKey}">`);
    
    // 创建新的响应对象，保留原始响应的头信息
    const newHeaders = new Headers(response.headers);
    
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
  return response;
}

/**
 * 抓取今天的谜题数据
 */
async function scrapeTodaysPuzzle() {
  try {
    console.log("开始抓取今日谜题");
    
    // 使用与server.js相同的URL生成逻辑
    const { year, month, day } = formatDateForUrl();
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthName = monthNames[month - 1];
    const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
    
    console.log(`抓取URL: ${url}`);

    // 直接抓取文章页面
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`抓取文章页面失败: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 使用cheerio解析HTML
    const $ = cheerio.load(html);

    // 查找包含答案的部分
    const answerSection = $('h2:contains("What is the answer to Connections today")').next();
    
    if (!answerSection.length) {
      throw new Error('未找到答案部分');
    }

    // 解析答案部分
    let categories = [];
    
    // 查找答案行
    const answerLines = answerSection.find('li').toArray();
    
    if (answerLines.length !== 4) {
      throw new Error('未找到正确数量的类别');
    }
    
    // 处理每个类别
    answerLines.forEach(line => {
      const text = $(line).text().trim();
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
    const difficultyText = $('h2:contains("Here are today\'s Connections categories")').prevAll('p').first().text();
    let difficulty = "medium";
    
    if (difficultyText.toLowerCase().includes('easy')) {
      difficulty = "easy";
    } else if (difficultyText.toLowerCase().includes('hard')) {
      difficulty = "hard";
    }

    // 创建谜题数据
    const puzzleData = {
      date: formatDate(),
      categories: categories,
      difficulty: difficulty,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('成功抓取谜题数据');
    return puzzleData;
    
  } catch (error) {
    console.error(`抓取谜题失败: ${error}`);
    throw error;
  }
}

/**
 * 保存谜题数据到KV存储
 */
async function savePuzzleData(puzzleData) {
  if (!puzzleData || !puzzleData.date) {
    throw new Error("无效的谜题数据");
  }
  
  // 格式化日期为YYYY-MM-DD作为键
  const dateObj = new Date(puzzleData.date);
  const dateKey = dateObj.toISOString().split('T')[0];
  
  // 保存到KV
  await PUZZLES.put(dateKey, JSON.stringify(puzzleData));
  
  // 更新索引
  let indexData = {};
  try {
    const existingIndex = await PUZZLES.get('index', 'json');
    if (existingIndex) {
      indexData = existingIndex;
    }
  } catch (error) {
    console.warn("无法获取现有索引，创建新索引");
  }
  
  // 添加或更新索引条目
  indexData[dateKey] = {
    date: puzzleData.date,
    difficulty: puzzleData.difficulty
  };
  
  // 保存更新的索引
  await PUZZLES.put('index', JSON.stringify(indexData));
  
  return dateKey;
}

/**
 * 获取今天的谜题
 */
async function getTodaysPuzzle() {
  // 获取今天的日期
  const today = new Date();
  const todayKey = formatDate(today);
  
  // 尝试从KV获取今天的谜题
  let puzzleData = null;
  try {
    puzzleData = await PUZZLES.get(todayKey, 'json');
  } catch (error) {
    console.warn(`无法获取今天的谜题: ${error}`);
  }
  
  // 如果找不到今天的谜题，尝试抓取
  if (!puzzleData) {
    try {
      console.log("KV中没有今天的谜题，尝试抓取");
      puzzleData = await scrapeTodaysPuzzle();
      if (puzzleData) {
        await savePuzzleData(puzzleData);
      }
    } catch (error) {
      console.error(`尝试抓取今天的谜题失败: ${error}`);
      
      // 尝试获取最新的谜题作为备用
      puzzleData = await getLatestPuzzle();
    }
  }
  
  return puzzleData;
}

/**
 * 按日期获取谜题
 */
async function getPuzzleByDate(dateStr) {
  // 验证日期格式 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error("无效的日期格式，请使用YYYY-MM-DD");
  }
  
  // 从KV获取谜题
  try {
    return await PUZZLES.get(dateStr, 'json');
  } catch (error) {
    console.error(`获取日期 ${dateStr} 的谜题失败: ${error}`);
    return null;
  }
}

/**
 * 获取最新的谜题
 */
async function getLatestPuzzle() {
  try {
    // 获取索引
    const index = await PUZZLES.get('index', 'json');
    if (!index) {
      throw new Error("找不到谜题索引");
    }
    
    // 获取所有日期键并排序
    const dateKeys = Object.keys(index).filter(key => key !== 'index');
    if (dateKeys.length === 0) {
      throw new Error("索引中没有谜题");
    }
    
    // 按日期排序并获取最新的
    dateKeys.sort();
    const latestKey = dateKeys[dateKeys.length - 1];
    
    // 获取最新的谜题
    return await PUZZLES.get(latestKey, 'json');
  } catch (error) {
    console.error(`获取最新谜题失败: ${error}`);
    return null;
  }
}

/**
 * 获取存档列表
 */
async function getArchiveList() {
  try {
    // 获取索引
    const index = await PUZZLES.get('index', 'json');
    if (!index) {
      return [];
    }
    
    // 过滤掉索引键本身
    const archiveList = Object.entries(index)
      .filter(([key]) => key !== 'index')
      .map(([key, value]) => ({
        date: key,
        displayDate: value.date,
        difficulty: value.difficulty
      }));
    
    // 按日期排序
    archiveList.sort((a, b) => b.date.localeCompare(a.date));
    
    return archiveList;
  } catch (error) {
    console.error(`获取存档列表失败: ${error}`);
    return [];
  }
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

// Helper function to compare dates (ignoring time)
function isSameDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
} 