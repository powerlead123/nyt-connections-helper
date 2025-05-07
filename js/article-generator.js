/**
 * 文章生成器
 * 用于生成每日谜题的文章HTML
 */
class ArticleGenerator {
  constructor() {
    // SEO关键词配置
    this.seoKeywords = {
      main: ['NYT Connections', 'Connections game', 'puzzle solutions', 'daily answers', 'word association game'],
      related: ['word puzzles', 'brain teasers', 'word games', 'NYT Games', 'daily word games'],
      long_tail: ['how to solve NYT Connections', 'Connections game strategy', 'daily puzzle hints', 'NYT Connections tips and tricks', 'best strategy for Connections game']
    };
  }

  /**
   * 生成文章HTML
   * @param {Object} puzzleData 谜题数据
   * @returns {string} 生成的HTML内容
   */
  generateHTML(puzzleData) {
    const { date, difficulty, categories } = puzzleData;
    const canonicalUrl = `https://nyctconnections.com/puzzle/${date}`;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NYT Connections Puzzle Solutions & Hints - ${date} | Daily Answers Guide</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Complete walkthrough and solutions for NYT Connections puzzle ${date}. Find expert hints, strategies, and answers for all categories: ${categories.map(c => c.name).join(', ')}. Daily updated guides for puzzle solving.">
    <meta name="keywords" content="${this.generateMetaKeywords(categories)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="NYT Connections Solutions & Strategy Guide - ${date}">
    <meta property="og:description" content="Get expert hints and solutions for today's NYT Connections puzzle. Complete walkthrough with strategies.">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="NYCT Connections">
    <meta property="article:published_time" content="${date}T00:00:00Z">
    <meta property="article:modified_time" content="${new Date().toISOString()}">
    <meta property="article:section" content="Game Guides">
    <meta property="article:tag" content="NYT Connections,Puzzle Solutions,Word Games,Daily Hints">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="NYT Connections Solutions & Strategy Guide - ${date}">
    <meta name="twitter:description" content="Get expert hints and solutions for today's NYT Connections puzzle. Complete walkthrough with strategies.">
    
    <link rel="stylesheet" href="/css/article-style.css">
    
    <!-- Additional Schema.org Markup -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "mainEntity": {
        "@type": "Article",
        "headline": "NYT Connections Solutions & Strategy Guide - ${date}",
        "datePublished": "${date}T00:00:00Z",
        "dateModified": "${new Date().toISOString()}",
        "author": {
          "@type": "Organization",
          "name": "NYCT Connections"
        }
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["article", ".game-intro"]
      }
    }
    </script>
</head>
<body>
    <!-- 面包屑导航 -->
    <nav aria-label="breadcrumb">
        <ol itemscope itemtype="https://schema.org/BreadcrumbList">
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a href="/" itemprop="item"><span itemprop="name">Home</span></a>
                <meta itemprop="position" content="1" />
            </li>
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a href="/archive" itemprop="item"><span itemprop="name">Puzzle Archive</span></a>
                <meta itemprop="position" content="2" />
            </li>
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <span itemprop="name">Puzzle ${date}</span>
                <meta itemprop="position" content="3" />
            </li>
        </ol>
    </nav>

    <article class="puzzle-solution" itemscope itemtype="https://schema.org/Article">
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
                <a href="#faq">FAQ</a>
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
        <section id="hints" class="hints-section" itemscope itemtype="https://schema.org/HowTo">
            <h2 itemprop="name">How to Solve Today's Connections Puzzle</h2>
            <meta itemprop="totalTime" content="PT10M" />
            <div class="hints-container">
                ${categories.map((cat, index) => `
                    <div class="hint-card" itemprop="step" itemscope itemtype="https://schema.org/HowToStep">
                        <h3 itemprop="name">Group ${index + 1}</h3>
                        <div itemprop="text">
                            <p class="initial-hint">${this.generateHint(cat)}</p>
                            <div class="additional-hints">
                                <p class="extra-hint">${this.generateExtraHint(cat)}</p>
                                <p class="strategy-tip">${this.generateStrategyTip(cat)}</p>
                            </div>
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

        <!-- 相关谜题 -->
        <section id="related" class="related-section">
            <h2>Related Puzzles</h2>
            <div class="related-puzzles">
                <div class="similar-difficulty">
                    <h3>More ${difficulty} Puzzles</h3>
                    <ul>
                        ${this.generateRelatedPuzzles(difficulty, date)}
                    </ul>
                </div>
                <div class="similar-categories">
                    <h3>Puzzles with Similar Categories</h3>
                    <ul>
                        ${this.generateSimilarCategoryPuzzles(categories, date)}
                    </ul>
                </div>
            </div>
        </section>

        <!-- FAQ部分 -->
        <section id="faq" class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
            <h2>Frequently Asked Questions</h2>
            <div class="faq-container">
                <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 itemprop="name">What time does the NYT Connections puzzle reset?</h3>
                    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div itemprop="text">
                            <p>The NYT Connections puzzle resets at midnight Eastern Time (ET) every day.</p>
                        </div>
                    </div>
                </div>
                <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 itemprop="name">How many attempts do you get in NYT Connections?</h3>
                    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div itemprop="text">
                            <p>You get 4 attempts to solve each group in NYT Connections. Once you run out of attempts, the game is over for the day.</p>
                        </div>
                    </div>
                </div>
                <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 itemprop="name">What do the colors mean in NYT Connections?</h3>
                    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div itemprop="text">
                            <p>The colors in NYT Connections indicate difficulty levels: Yellow (easiest), Green (easy), Blue (medium), and Purple (hardest).</p>
                        </div>
                    </div>
                </div>
                <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 itemprop="name">What's the best strategy for solving NYT Connections?</h3>
                    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div itemprop="text">
                            <p>The best strategy is to start with the most obvious connections (usually yellow), look for common themes or patterns, and use the process of elimination. Pay attention to words that might have multiple meanings.</p>
                        </div>
                    </div>
                </div>
                <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 itemprop="name">Can I play old NYT Connections puzzles?</h3>
                    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div itemprop="text">
                            <p>No, NYT Connections only offers one puzzle per day. However, you can find our archive of past solutions and explanations to learn from previous puzzles.</p>
                        </div>
                    </div>
                </div>
                <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                    <h3 itemprop="name">Why are some Connections puzzles harder than others?</h3>
                    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                        <div itemprop="text">
                            <p>Puzzle difficulty varies based on factors like word ambiguity, obscure references, and the complexity of connections. Purple groups are typically the most challenging due to subtle or unexpected relationships.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 相关链接 -->
        <footer>
            <div class="navigation">
                <a href="/archive" class="nav-link">Puzzle Archive</a>
                <a href="/tips" class="nav-link">Tips & Strategies</a>
                <a href="/about" class="nav-link">About NYT Connections</a>
                <a href="/contact" class="nav-link">Contact Us</a>
            </div>
            <div class="social-share">
                <h3>Share this solution:</h3>
                <div class="share-buttons">
                    <a href="https://twitter.com/share?url=${encodeURIComponent(canonicalUrl)}" class="twitter-share">Share on Twitter</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}" class="facebook-share">Share on Facebook</a>
                </div>
            </div>
            <div class="copyright">
                <p>&copy; ${new Date().getFullYear()} NYCT Connections. All rights reserved.</p>
            </div>
        </footer>
    </article>
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

module.exports = new ArticleGenerator(); 