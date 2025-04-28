/**
 * NYT Connections AI Helper - Frontend JavaScript
 * Handles AI hints and explanations for the game
 */

// Import configurations
import { config } from './config.js';

// AI 状态变量
let aiApiAvailable = false;
let aiApiKey = null;

// 生成轻度提示
async function generateLightHint(puzzleData) {
  // 获取当前游戏状态
  const remainingTiles = document.querySelectorAll('#game-grid div');
  const remainingWords = Array.from(remainingTiles).map(tile => tile.dataset.word);
  
  // 获取已找到的类别
  const foundGroups = document.getElementById('found-groups')?.children || [];
  const foundCategoryNames = Array.from(foundGroups).map(group => 
    group.querySelector('div')?.textContent || ''
  );
  
  // 创建提示上下文
  const prompt = `You are helping with the NYT Connections puzzle.

PUZZLE ANSWER:
The complete solution for today's puzzle is:
${puzzleData.categories.map(cat => `- Category "${cat.name}": ${cat.words.join(', ')}`).join('\n')}

CURRENT GAME STATE:
- Remaining words: "${remainingWords.join('", "')}"
${foundCategoryNames.length > 0 ? `- Already found categories: ${foundCategoryNames.join(', ')}` : '- No categories found yet'}

Based on the complete solution above and the current game state, please give a very gentle hint that guides the player in the right direction. The hint should be subtle and not reveal specific categories or direct connections. Focus on general patterns or themes that might help them spot a connection.`;
  
  try {
    return await generateAIHint(prompt, aiApiKey, 'light');
  } catch (error) {
    console.error('Error generating light hint with AI:', error);
    return generateLocalGameStateHint(puzzleData, 'light');
  }
}

// 生成中度提示
async function generateMediumHint(puzzleData) {
  // 获取当前游戏状态
  const remainingTiles = document.querySelectorAll('#game-grid div');
  const remainingWords = Array.from(remainingTiles).map(tile => tile.dataset.word);
  
  // 获取已找到的类别
  const foundGroups = document.getElementById('found-groups')?.children || [];
  const foundCategoryNames = Array.from(foundGroups).map(group => 
    group.querySelector('div')?.textContent || ''
  );
  
  // 创建提示上下文
  const prompt = `You are helping with the NYT Connections puzzle.

PUZZLE ANSWER:
The complete solution for today's puzzle is:
${puzzleData.categories.map(cat => `- Category "${cat.name}": ${cat.words.join(', ')}`).join('\n')}

CURRENT GAME STATE:
- Remaining words: "${remainingWords.join('", "')}"
${foundCategoryNames.length > 0 ? `- Already found categories: ${foundCategoryNames.join(', ')}` : '- No categories found yet'}

Based on the complete solution above and the current game state, please give a medium-level hint. You can mention one of the remaining categories or suggest a possible connection, but don't give away all the answers. Focus on one specific remaining category and provide a clear clue about its theme or pattern.`;

  try {
    return await generateAIHint(prompt, aiApiKey, 'medium');
  } catch (error) {
    console.error('Error generating medium hint with AI:', error);
    return generateLocalGameStateHint(puzzleData, 'medium');
  }
}

// 生成答案提示
async function generateAnswerHint(puzzleData) {
  // 获取当前游戏状态
  const remainingTiles = document.querySelectorAll('#game-grid div');
  const remainingWords = Array.from(remainingTiles).map(tile => tile.dataset.word);
  
  // 获取已找到的类别
  const foundGroups = document.getElementById('found-groups')?.children || [];
  const foundCategoryNames = Array.from(foundGroups).map(group => 
    group.querySelector('div')?.textContent || ''
  );
  
  // 创建提示上下文
  const prompt = `You are helping with the NYT Connections puzzle.

PUZZLE ANSWER:
The complete solution for today's puzzle is:
${puzzleData.categories.map(cat => `- Category "${cat.name}": ${cat.words.join(', ')}`).join('\n')}

CURRENT GAME STATE:
- Remaining words: "${remainingWords.join('", "')}"
${foundCategoryNames.length > 0 ? `- Already found categories: ${foundCategoryNames.join(', ')}` : '- No categories found yet'}

Based on the complete solution above and the current game state, please give a direct answer hint. Choose one of the remaining unsolved categories and clearly state its name and all words that belong to it. Make sure to pick a category that hasn't been found yet.`;

  try {
    return await generateAIHint(prompt, aiApiKey, 'answer');
  } catch (error) {
    console.error('Error generating answer hint with AI:', error);
    return generateLocalGameStateHint(puzzleData, 'answer');
  }
}

// 生成本地游戏状态提示
function generateLocalGameStateHint(puzzleData, hintLevel = 'medium') {
  // 获取剩余单词
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
  
  if (remainingCategories.length === 0) {
    return "You've found all the categories! Great job!";
  }
  
  // 选择一个随机剩余类别作为提示
  const targetCategory = remainingCategories[Math.floor(Math.random() * remainingCategories.length)];
  
  // 根据提示级别生成提示
  switch (hintLevel) {
    case 'light':
      const lightHints = [
        `Try looking for words that share a common theme or characteristic.`,
        `One of the remaining groups contains words that are related to ${getVagueHint(targetCategory)}.`,
        `Think about different ways words can be connected - by topic, use, or meaning.`,
        `Look for patterns in the remaining words.`,
        `Consider how some of these words might be used together.`
      ];
      return lightHints[Math.floor(Math.random() * lightHints.length)];
      
    case 'medium':
      const categoryWords = targetCategory.words.filter(word => remainingWords.includes(word));
      if (categoryWords.length > 0) {
        const hintWord = categoryWords[Math.floor(Math.random() * categoryWords.length)];
        const mediumHints = [
          `The word "${hintWord}" is part of a group about ${getMediumHint(targetCategory)}.`,
          `Try to find words that connect with "${hintWord}".`,
          `"${hintWord}" belongs to a category related to ${getMediumHint(targetCategory)}.`,
          `Look for other words that share a connection with "${hintWord}".`
        ];
        return mediumHints[Math.floor(Math.random() * mediumHints.length)];
      } else {
        return `Look for words related to ${getMediumHint(targetCategory)}.`;
      }
      
    case 'answer':
      const answerHints = [
        `Here's the answer for one group: "${targetCategory.name}" contains the words: ${targetCategory.words.join(', ')}.`,
        `One complete category is "${targetCategory.name}" with these words: ${targetCategory.words.join(', ')}.`,
        `The "${targetCategory.name}" group includes: ${targetCategory.words.join(', ')}.`
      ];
      return answerHints[Math.floor(Math.random() * answerHints.length)];
      
    default:
      return `Look for words that might be connected to ${getMediumHint(targetCategory)}.`;
  }
}

// 导出 AI 相关函数
export {
    aiApiAvailable,
    aiApiKey,
    generateLightHint,
    generateMediumHint,
    generateAnswerHint,
    generateLocalGameStateHint,
    setupExternalAI
};

/**
 * Set up external AI API integration
 */
async function setupExternalAI() {
  try {
    // 优先使用 meta 标签中的 API 密钥
    const metaApiKey = document.querySelector('meta[name="ai-api-key"]')?.content;
    
    // 如果 meta 标签中没有有效的密钥，则使用配置文件中的密钥
    if (metaApiKey && metaApiKey !== 'demo-key') {
      aiApiKey = metaApiKey;
      console.log('AI API key found in meta tag, enabling AI features');
    } else {
      // 使用配置文件中的 API 密钥
      aiApiKey = config.ai.apiKey;
      console.log('Using API key from config file, enabling AI features');
    }
    
    // 测试 API 连接
    const testPrompt = "Say 'API connection successful' if you can read this.";
    const testResponse = await generateAIHint(testPrompt, aiApiKey, 'test');
    
    if (testResponse && testResponse.includes('successful')) {
      console.log('AI API connection verified successfully');
      aiApiAvailable = true;
      
      // 设置全局 AI 提示生成函数
      window.generateAiHint = async function(prompt, type) {
        try {
          return await generateAIHint(prompt, aiApiKey, type);
        } catch (error) {
          console.error('Error generating AI hint:', error);
          return simulateAIResponse(prompt);
        }
      };
    } else {
      console.warn('AI API test failed, falling back to local hints');
      aiApiAvailable = false;
      window.generateAiHint = simulateAIResponse;
    }
  } catch (error) {
    console.error('Error setting up external AI:', error);
    console.log('Falling back to local hints due to setup error');
    aiApiAvailable = false;
    window.generateAiHint = simulateAIResponse;
  }
}

/**
 * Generate hints using AI API
 */
async function generateAIHint(prompt, apiKey, type) {
  // Create system message based on hint type and config
  let systemMessage = '';
  switch(type) {
    case 'light':
      systemMessage = `You are an AI assistant helping with the NYT Connections game. ${config.hints.light.description}`;
      break;
    case 'medium':
      systemMessage = `You are an AI assistant helping with the NYT Connections game. ${config.hints.medium.description}`;
      break;
    case 'answer':
      systemMessage = `You are an AI assistant helping with the NYT Connections game. ${config.hints.answer.description}`;
      break;
    default:
      systemMessage = `You are an AI assistant helping with the NYT Connections game. Provide helpful hints without giving away too much information.`;
  }
  
  try {
    // 使用 config 中的 API 配置
    const apiEndpoint = config.ai.endpoint;
    const apiModel = config.ai.model;
    const actualApiKey = apiKey || config.ai.apiKey;
    
    if (!actualApiKey) {
      throw new Error('No API key available');
    }
    
    console.log(`Sending AI request to ${apiEndpoint} using model ${apiModel}`);
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NYT Connections Helper'
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API error:', errorData || response.statusText);
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const message = data.choices && data.choices[0] && data.choices[0].message;
    
    if (!message || !message.content) {
      throw new Error('Invalid response format from API');
    }
    
    return message.content.trim();
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

/**
 * Simulate AI responses (fallback when API is unavailable)
 */
function simulateAIResponse(prompt, type = 'light') {
  const promptLower = prompt.toLowerCase();
  
  // Simulate delay for natural feel
  return new Promise((resolve) => {
    setTimeout(() => {
      let response = '';
      
      // Generate response based on hint type
      switch(type) {
        case 'light':
          response = generateLightHint(prompt);
          break;
        case 'medium':
          response = generateMediumHint(prompt);
          break;
        case 'answer':
          response = generateAnswerHint(prompt);
          break;
        default:
          response = generateLightHint(prompt);
      }
      
      resolve(response);
    }, 800);
  });
}

/**
 * 获取特定类型的提示
 */
function getVagueHint(category) {
  const name = category.name.toLowerCase();
  
  if (name.includes('body') || name.includes('central') || name.includes('section')) {
    return "人体的中部区域";
  } else if (name.includes('pizza') || name.includes('components')) {
    return "一种特定食物的组成部分";
  } else if (name.includes('beer') || name.includes('units')) {
    return "酒类的量词或容器";
  } else if (name.includes('baseball') || name.includes('greats')) {
    return "某项体育运动中的著名人物";
  }
  
  return "有一个共同主题的事物";
}

/**
 * 获取中等详细程度的提示
 */
function getMediumHint(category) {
  const name = category.name.toLowerCase();
  
  if (name.includes('body') || name.includes('central') || name.includes('section')) {
    return "这些词都描述了人体的躯干部位";
  } else if (name.includes('pizza') || name.includes('components')) {
    return "制作一个圆形意大利食品所需的部分";
  } else if (name.includes('beer') || name.includes('units')) {
    return "啤酒的不同包装或容量单位";
  } else if (name.includes('baseball') || name.includes('greats')) {
    return "棒球历史上的传奇球员";
  }
  
  return "有共同特征的一组事物";
}

/**
 * 获取具体提示
 */
function getSpecificHint(category) {
  const name = category.name.toLowerCase();
  
  if (name.includes('body') || name.includes('central') || name.includes('section')) {
    return "身体的中心部位:核心、腰部、躯干等";
  } else if (name.includes('pizza') || name.includes('components')) {
    return "披萨的组成部分:奶酪、酱料等";
  } else if (name.includes('beer') || name.includes('units')) {
    return "啤酒的包装单位:6罐装、40盎司等";
  } else if (name.includes('baseball') || name.includes('greats')) {
    return "著名棒球运动员:Bonds、Mantle等";
  }
  
  return category.name;
}

/**
 * Generate hint for selected words
 */
function generateSelectionHint(selectedWords) {
  // Check for common patterns in selected words
  const patterns = [
    {
      test: words => words.some(w => w.endsWith('ice')),
      hint: "Some of these words share a common ending. Look for more words with the same pattern."
    },
    {
      test: words => words.some(w => w.includes('Vader') || w.includes('Thanos')),
      hint: "You might be onto something with characters from popular entertainment."
    },
    {
      test: words => words.some(w => ['Saddle', 'Bridle', 'Stirrup'].includes(w)),
      hint: "Think about equipment used with a particular animal."
    },
    {
      test: words => words.some(w => ['Taco', 'Egg', 'Pistachio'].includes(w)),
      hint: "Consider things that have a protective outer layer."
    }
  ];
  
  // Find matching pattern
  const matchingPattern = patterns.find(p => p.test(selectedWords));
  if (matchingPattern) {
    return matchingPattern.hint;
  }
  
  // Default hints if no pattern matches
  const defaultHints = [
    "These words might share a common theme or category, but not all of them fit together.",
    "Try thinking about different ways these words might be related - their function, appearance, or category.",
    "Look for words that share a more specific connection.",
    "Consider how these words might be used or what they represent."
  ];
  
  return defaultHints[Math.floor(Math.random() * defaultHints.length)];
}

/**
 * Generate hint for remaining words
 */
function generateRemainingWordsHint(remainingWords) {
  const hints = [
    "Look for words that might belong to the same category or share a specific characteristic.",
    "Some of these words might be connected by how they're used or what they represent.",
    "Try grouping words that have something in common - it could be their meaning, function, or even spelling.",
    "Think about different categories these words might belong to."
  ];
  
  return hints[Math.floor(Math.random() * hints.length)];
}

/**
 * Generate general hint
 */
function generateGeneralHint() {
  const hints = [
    "Try looking for words that share a common theme or category.",
    "Sometimes the connection between words isn't obvious at first - think creatively!",
    "Words can be connected by their meaning, usage, or even how they're spelled.",
    "Look for patterns in how the words are used or what they represent."
  ];
  
  return hints[Math.floor(Math.random() * hints.length)];
}

// 获取DOM元素
// 在文档加载完成后再获取DOM元素,并添加null检查
let hintBtn, explainBtn, aiMessage, submitBtn, gameData;

// 文档加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    hintBtn = document.getElementById('hint-btn');
    explainBtn = document.getElementById('explain-btn');
    aiMessage = document.getElementById('ai-message');
    submitBtn = document.getElementById('submit-button');
    
    // 初始化游戏数据
    gameData = {
        words: [],
        categories: [],
        solvedCategories: [],
        selectedTiles: []
    };
    
    // 只有当元素存在时才添加事件监听器
    if (hintBtn) {
        hintBtn.addEventListener('click', getHint);
    }
    
    if (explainBtn) {
        explainBtn.addEventListener('click', explainSelection);
    }
});

/**
 * 根据当前游戏状态获取提示
 */
function getHint() {
    // 如果元素不存在则返回
    if (!aiMessage || !submitBtn || !gameData) return;
    
    // 检查游戏是否进行中
    if (submitBtn.disabled) {
        aiMessage.innerHTML = '<p>游戏已结束！明天再来挑战新的谜题。</p>';
        return;
    }
    
    // 使用未解决类别的单词生成提示
    const remainingWords = gameData.words.filter(word => {
        return !gameData.solvedCategories.some(category => 
            category.words.includes(word));
    });
    
    // 获取一个随机未解决的类别
    const unsolvedCategories = gameData.categories.filter(category => 
        !gameData.solvedCategories.some(solved => solved.name === category.name));
    
    if (unsolvedCategories.length === 0) {
        aiMessage.innerHTML = '<p>你已解决所有类别！做得好！</p>';
        return;
    }
    
    const randomCategory = unsolvedCategories[Math.floor(Math.random() * unsolvedCategories.length)];
    
    // 根据类别生成提示
    const hint = generateHintForCategory(randomCategory);
    
    aiMessage.innerHTML = `<p><strong>提示:</strong> ${hint}</p>`;
}

/**
 * 为特定类别生成提示
 */
function generateHintForCategory(category) {
    // 预设的提示（根据类别）
    const hints = {
        "Chess pieces": [
            "这些物品在棋盘上移动。",
            "想想一种战略性棋盘游戏。",
            "这些在一种皇家策略游戏中使用。",
            "一种目标是捕获国王的游戏。"
        ],
        "Natural landscapes": [
            "这些是地球的地理特征。",
            "这些是我们星球上的自然环境。",
            "想想不同种类的户外环境。",
            "《国家地理》杂志会在照片中展示这些。"
        ],
        "Currencies": [
            "在国际旅行时，你可能会使用这些。",
            "这些用于交换商品和服务。",
            "不同国家有不同版本的这些。",
            "访问外国时，你需要兑换这些。"
        ],
        "Car manufacturers": [
            "这些公司制造车辆。",
            "你可能会在汽车前部看到这些名称。",
            "这些是与交通工具相关的品牌。",
            "生产乘用车的公司。"
        ]
    };
    
    // 获取该类别的提示
    const categoryHints = hints[category.name];
    
    // 如果有可用提示，返回一个随机提示，否则返回通用提示
    if (categoryHints && categoryHints.length > 0) {
        return categoryHints[Math.floor(Math.random() * categoryHints.length)];
    } else {
        // 对于未预设的类别，尝试使用AI生成提示
        try {
            // 先检查我们是否在浏览器环境中有可用的AI API
            if (aiApiAvailable) {
                return window.generateAiHint(category.name, category.words);
            }
        } catch (e) {
            console.error("AI API调用失败:", e);
        }
        
        // 如果无法使用AI，返回通用提示
        return "寻找有共同点的单词。";
    }
}

/**
 * 解释当前选择
 */
function explainSelection() {
    // 如果元素不存在则返回
    if (!aiMessage || !gameData) return;
    
    // 检查是否有选择的单词
    if (gameData.selectedTiles.length === 0) {
        aiMessage.innerHTML = '<p>请先选择一些单词！</p>';
        return;
    }
    
    const selectedWords = [...gameData.selectedTiles];
    
    // 检查所有选择的单词是否属于同一个类别
    let matchingCategory = null;
    let partialMatches = [];
    
    gameData.categories.forEach(category => {
        // 计算有多少选中的单词在这个类别中
        const matchCount = selectedWords.filter(word => 
            category.words.includes(word)).length;
            
        if (matchCount === selectedWords.length) {
            matchingCategory = category;
        } else if (matchCount >= 2 && selectedWords.length >= 2) {
            // 跟踪部分匹配（至少2个单词匹配）
            partialMatches.push({
                category: category,
                matchCount: matchCount
            });
        }
    });
    
    // 根据匹配情况生成解释
    if (matchingCategory) {
        // 所有选中的单词都属于同一个类别
        if (selectedWords.length === 4) {
            aiMessage.innerHTML = 
                `<p>这些单词都与"${matchingCategory.name}"有关。尝试提交你的选择！</p>`;
        } else {
            aiMessage.innerHTML = 
                `<p>这些单词似乎与"${matchingCategory.name}"有关。尝试找到更多这个类别的单词。</p>`;
        }
    } else if (partialMatches.length > 0) {
        // 按匹配数量排序（最高在前）
        partialMatches.sort((a, b) => b.matchCount - a.matchCount);
        
        // 获取最佳部分匹配
        const bestMatch = partialMatches[0];
        
        // 列出匹配的单词
        const matchingWords = selectedWords.filter(word => 
            bestMatch.category.words.includes(word));
            
        aiMessage.innerHTML = 
            `<p>${matchingWords.join(", ")}可能与"${bestMatch.category.name}"有关，
            但其他单词不符合这个模式。</p>`;
    } else {
        // 没有明显的模式
        aiMessage.innerHTML = 
            `<p>我看不出这些单词之间有明显的联系。
            尝试选择不同的组合。</p>`;
    }
} 