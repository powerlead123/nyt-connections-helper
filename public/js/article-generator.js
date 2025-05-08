/**
 * 文章生成器
 * 用于生成每日谜题的文章HTML
 */
class ArticleGenerator {
  constructor() {
    // SEO关键词配置
    this.seoKeywords = {
      main: ['NYT Connections', 'Connections game', 'puzzle solutions', 'daily answers'],
      related: ['word puzzles', 'brain teasers', 'word games', 'NYT Games'],
      long_tail: ['how to solve NYT Connections', 'Connections game strategy', 'daily puzzle hints']
    };
  }

  /**
   * 生成文章HTML
   * @param {Object} puzzleData 谜题数据
   * @returns {string} 生成的HTML内容
   */
  generateHTML(puzzleData) {
    const { date, difficulty, categories } = puzzleData;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NYT Connections Puzzle Solutions & Hints - ${date} | Daily Answers Guide</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Complete walkthrough and solutions for NYT Connections puzzle ${date}. Find expert hints, strategies, and answers for all categories: ${categories.map(c => c.name).join(', ')}. Daily updated guides for puzzle solving.">
    <meta name="keywords" content="${this.generateMetaKeywords(categories)}">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="NYT Connections Solutions & Strategy Guide - ${date}">
    <meta property="og:description" content="Get expert hints and solutions for today's NYT Connections puzzle. Complete walkthrough with strategies.">
    <meta property="og:type" content="article">
    <meta property="article:published_time" content="${date}T00:00:00Z">
    <meta property="article:modified_time" content="${new Date().toISOString()}">
    <meta property="article:section" content="Game Guides">
    <meta property="article:tag" content="NYT Connections,Puzzle Solutions,Word Games,Daily Hints">
    
    <link rel="stylesheet" href="/css/article-style.css">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    
    <!-- Custom styles -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
        }
        
        .article-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        
        .content-section {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .puzzle-metadata {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .difficulty-badge {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
        }
        
        .difficulty-badge.easy { background-color: #d1fae5; color: #065f46; }
        .difficulty-badge.medium { background-color: #fef3c7; color: #92400e; }
        .difficulty-badge.hard { background-color: #fee2e2; color: #991b1b; }
        
        .quick-nav {
            display: flex;
            gap: 1rem;
            margin: 2rem 0;
            padding: 1rem;
            background: #f3f4f6;
            border-radius: 0.5rem;
            overflow-x: auto;
        }
        
        .quick-nav a {
            color: #4b5563;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            white-space: nowrap;
        }
        
        .quick-nav a:hover {
            background: #e5e7eb;
        }
        
        .hints-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .hint-card {
            background: white;
            border-radius: 0.5rem;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .solutions-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .solution-card {
            border-radius: 0.5rem;
            padding: 1.5rem;
        }
        
        .solution-card.category-yellow { background-color: #fefce8; }
        .solution-card.category-green { background-color: #f0fdf4; }
        .solution-card.category-blue { background-color: #eff6ff; }
        .solution-card.category-purple { background-color: #faf5ff; }
        
        .word-list {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
        }
        
        .word-list li {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            background: white;
            border-radius: 0.25rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .knowledge-box {
            background: #f8fafc;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-top: 1rem;
        }
        
        @media (max-width: 768px) {
            .article-container {
                padding: 0 0.5rem;
            }
            
            .content-section {
                padding: 1rem;
            }
            
            .hints-container,
            .solutions-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- 主导航 -->
    <header class="bg-purple-600 text-white shadow-md mb-8">
        <div class="container mx-auto py-4 px-4">
            <div class="flex items-center justify-between">
                <a href="/" class="flex items-center gap-3 hover:opacity-90">
                    <img src="/assets/nyt-connections-logo.png" alt="NYT Connections Helper" class="w-12 h-12">
                    <div>
                        <h1 class="text-2xl font-bold">NYT Connections Helper</h1>
                        <p class="text-purple-100">Daily Solutions & Hints</p>
                    </div>
                </a>
                <nav class="hidden md:flex items-center space-x-6">
                    <a href="/" class="text-white hover:text-purple-200 font-medium">Play Today's Puzzle</a>
                    <a href="/archive" class="text-white hover:text-purple-200 font-medium">Puzzle Archive</a>
                    <a href="/tips" class="text-white hover:text-purple-200 font-medium">Tips & Strategies</a>
                </nav>
                <button class="md:hidden text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <main class="article-container">
        <article class="content-section" itemscope itemtype="https://schema.org/Article">
        <header>
            <h1 itemprop="headline">NYT Connections Solutions & Hints - ${date}</h1>
            <div class="puzzle-metadata">
                <span class="difficulty-badge ${difficulty.toLowerCase()}">${difficulty} Difficulty</span>
                <time datetime="${date}" itemprop="datePublished">${this.formatDate(date)}</time>
            </div>
            
            <!-- 快速导航 -->
            <nav class="quick-nav">
                <a href="#hints">Quick Hints</a>
                <a href="#solutions">Complete Solutions</a>
                <a href="#tips">Strategy Tips</a>
                <a href="#related">Related Puzzles</a>
            </nav>
        </header>

        <!-- 游戏介绍 -->
        <section class="game-intro">
            <h2>Today's NYT Connections Puzzle</h2>
            <p>Welcome to our daily NYT Connections puzzle guide for ${this.formatDate(date)}. Today's puzzle features an interesting mix of categories including ${categories.map(c => c.name.toLowerCase()).join(', ')}. The difficulty level is rated as ${difficulty.toLowerCase()}, making it ${this.getDifficultyDescription(difficulty)} to solve.</p>
            
            <div class="difficulty-explanation">
                <h3>What makes this puzzle ${difficulty.toLowerCase()}?</h3>
                <p>${this.generateDifficultyExplanation(difficulty, categories)}</p>
            </div>
        </section>

        <!-- 无剧透提示部分 -->
        <section id="hints" class="hints-section">
            <h2>Hints (No Spoilers)</h2>
            <div class="hints-container">
                ${categories.map((cat, index) => `
                    <div class="hint-card">
                        <h3>Group ${index + 1}</h3>
                        <p class="initial-hint">${this.generateHint(cat)}</p>
                        <div class="additional-hints">
                            <p class="extra-hint">${this.generateExtraHint(cat)}</p>
                            <p class="strategy-tip">${this.generateStrategyTip(cat)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- 完整解答部分 -->
        <section id="solutions" class="solutions-section">
            <h2>Complete Solutions</h2>
            <div class="solutions-container">
                ${categories.map((cat, index) => `
                    <div class="solution-card ${this.getCategoryColor(index)}">
                        <h3>${cat.name}</h3>
                        <ul class="word-list">
                            ${cat.words.map(word => `
                                <li>${word}</li>
                            `).join('')}
                        </ul>
                        <div class="solution-details">
                            <p class="explanation">${this.generateExplanation(cat)}</p>
                            <div class="knowledge-box">
                                <h4>Did you know?</h4>
                                <p>${this.generateTrivia(cat)}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- 策略和技巧 -->
        <section id="tips" class="strategy-section">
            <h2>Strategy Tips for NYT Connections</h2>
            <div class="tips-container">
                <div class="general-tips">
                    <h3>General Strategies</h3>
                    <ul>
                        ${this.generateGeneralTips()}
                    </ul>
                </div>
                <div class="specific-tips">
                    <h3>Tips for Today's Puzzle</h3>
                    <ul>
                        ${this.generateSpecificTips(categories)}
                    </ul>
                </div>
            </div>
        </section>

        <!-- 相关链接 -->
        <footer>
            <div class="navigation">
                <a href="/" class="nav-link">Puzzle Archive</a>
                <a href="/latest" class="nav-link">Today's Puzzle</a>
                <a href="/tips" class="nav-link">Strategy Guide</a>
            </div>
            <div class="metadata">
                <p>Last updated: ${new Date().toLocaleString()}</p>
                <p class="disclaimer">This guide is fan-made and not affiliated with The New York Times.</p>
            </div>
        </footer>
    </article>
    </main>

    <!-- 页脚导航 -->
    <footer class="mt-12 bg-gray-100 py-6 border-t">
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row justify-between items-center">
                <div class="mb-4 md:mb-0">
                    <p class="text-gray-600 text-sm">
                        NYT Connections Helper &copy; 2024
                    </p>
                    <p class="text-gray-500 text-xs mt-1">
                        This website is not affiliated with The New York Times.
                    </p>
                </div>
                <nav class="flex space-x-4">
                    <a href="/" class="text-purple-600 hover:text-purple-800">Home</a>
                    <a href="/archive" class="text-purple-600 hover:text-purple-800">Archive</a>
                    <a href="/tips" class="text-purple-600 hover:text-purple-800">Tips</a>
                    <a href="/about" class="text-purple-600 hover:text-purple-800">About</a>
                </nav>
            </div>
        </div>
    </footer>

    <!-- 结构化数据 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "NYT Connections Solutions & Hints - ${date}",
      "datePublished": "${date}T00:00:00Z",
      "dateModified": "${new Date().toISOString()}",
      "author": {
        "@type": "Organization",
        "name": "NYT Connections Guide"
      },
      "description": "Complete walkthrough and solutions for NYT Connections puzzle ${date}. Find expert hints and answers."
    }
    </script>
</body>
</html>`;
  }

  /**
   * 生成Meta关键词
   * @param {Array} categories 类别数组
   * @returns {string} 关键词字符串
   */
  generateMetaKeywords(categories) {
    const categoryKeywords = categories.map(c => c.name.toLowerCase());
    return [...this.seoKeywords.main, ...this.seoKeywords.related, ...categoryKeywords].join(', ');
  }

  /**
   * 获取难度描述
   * @param {string} difficulty 难度级别
   * @returns {string} 难度描述
   */
  getDifficultyDescription(difficulty) {
    const descriptions = {
      'easy': 'a great starting point for newcomers',
      'medium': 'challenging but approachable',
      'hard': 'particularly challenging and requires careful thinking'
    };
    return descriptions[difficulty.toLowerCase()] || 'interesting';
  }

  /**
   * 生成难度解释
   * @param {string} difficulty 难度级别
   * @param {Array} categories 类别数组
   * @returns {string} 难度解释
   */
  generateDifficultyExplanation(difficulty, categories) {
    switch(difficulty.toLowerCase()) {
      case 'easy':
        return `This puzzle features straightforward categories with clear connections. The words in each group have obvious relationships, making it easier to spot the patterns.`;
      case 'medium':
        return `Some categories require more lateral thinking, while others are more straightforward. Watch out for potential red herrings between different groups.`;
      case 'hard':
        return `The connections between words are subtle and may require creative thinking. Multiple words could seemingly fit in different categories, so careful consideration is needed.`;
      default:
        return `The puzzle offers a balanced challenge with interesting word connections.`;
    }
  }

  /**
   * 生成额外提示
   * @param {Object} category 类别对象
   * @returns {string} 额外提示
   */
  generateExtraHint(category) {
    const hints = {
      'Gum flavors': 'These items might refresh your memory',
      'Starting point': 'Think about what gets things moving',
      'Great American songbook songs': 'These classics have stood the test of time',
      '__ Tube': 'Consider different contexts where this word appears'
    };
    return hints[category.name] || 'Look for common themes or patterns';
  }

  /**
   * 生成策略提示
   * @param {Object} category 类别对象
   * @returns {string} 策略提示
   */
  generateStrategyTip(category) {
    const tips = {
      'Gum flavors': 'Try grouping words that share similar sensory experiences',
      'Starting point': 'Look for words that share a common function or purpose',
      'Great American songbook songs': 'Consider famous musical pieces from a specific era',
      '__ Tube': 'Think about different types of cylindrical objects or passages'
    };
    return tips[category.name] || 'Try to identify the underlying pattern';
  }

  /**
   * 生成趣味知识
   * @param {Object} category 类别对象
   * @returns {string} 趣味知识
   */
  generateTrivia(category) {
    const trivia = {
      'Gum flavors': 'The first commercial chewing gum was produced in 1848, and peppermint became one of the earliest popular flavors.',
      'Starting point': 'The word "catalyst" comes from the Greek words "kata" (down) and "lyein" (to loosen).',
      'Great American songbook songs': 'The Great American Songbook era spans from the 1920s to the 1950s, representing the golden age of American popular music.',
      '__ Tube': 'The vacuum tube, invented in 1904, played a crucial role in the development of electronic devices before transistors.'
    };
    return trivia[category.name] || 'This category represents an interesting collection of related concepts.';
  }

  /**
   * 生成通用技巧
   * @returns {string} HTML列表项
   */
  generateGeneralTips() {
    return `
      <li>Start with the most obvious connections first</li>
      <li>Look for words that share similar meanings or contexts</li>
      <li>Consider multiple meanings of words</li>
      <li>Don't be afraid to try different combinations</li>
      <li>Use the process of elimination</li>
    `;
  }

  /**
   * 生成针对性技巧
   * @param {Array} categories 类别数组
   * @returns {string} HTML列表项
   */
  generateSpecificTips(categories) {
    return categories.map(cat => `
      <li>For the ${cat.name.toLowerCase()} category, focus on ${this.generateStrategyTip(cat)}</li>
    `).join('');
  }

  /**
   * 格式化日期显示
   * @param {string} dateStr YYYY-MM-DD格式的日期
   * @returns {string} 格式化后的日期
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * 生成不剧透的提示
   * @param {Object} category 类别对象
   * @returns {string} 生成的提示
   */
  generateHint(category) {
    // 根据类别生成提示，不直接透露答案
    const hints = {
      'Gum flavors': 'Think about different tastes you might find in the candy aisle',
      'Starting point': 'These words all relate to beginning something',
      'Great American songbook songs': 'Classic tunes from the American musical tradition',
      '__ Tube': 'Different types of cylindrical objects or passages'
    };

    return hints[category.name] || `Think about words related to ${category.name.toLowerCase()}`;
  }

  /**
   * 生成类别解释
   * @param {Object} category 类别对象
   * @returns {string} 生成的解释
   */
  generateExplanation(category) {
    return `These words are all ${category.name.toLowerCase()}. Each word in this group represents ${this.getExplanationDetail(category.name)}.`;
  }

  /**
   * 获取类别详细解释
   * @param {string} categoryName 类别名称
   * @returns {string} 详细解释
   */
  getExplanationDetail(categoryName) {
    const explanations = {
      'Gum flavors': 'a distinct taste you might find in chewing gum',
      'Starting point': 'something that helps initiate or begin an action or process',
      'Great American songbook songs': 'a classic song from the American musical tradition',
      '__ Tube': 'a type of tube or tubular structure'
    };

    return explanations[categoryName] || 'a related concept';
  }

  /**
   * 获取类别颜色类名
   * @param {number} index 类别索引
   * @returns {string} 颜色类名
   */
  getCategoryColor(index) {
    const colors = ['yellow', 'green', 'blue', 'purple'];
    return `category-${colors[index]}`;
  }
}

// 修改导出语句
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ArticleGenerator: ArticleGenerator
  };
} else if (typeof window !== 'undefined') {
  window.ArticleGenerator = ArticleGenerator;
} 