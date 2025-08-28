const fs = require('fs').promises;
const path = require('path');

class ArticleGenerator {
    constructor() {
        this.articlesDir = './articles';
        this.templatesDir = './templates';
    }

    async generateDailyArticle(puzzleData, date) {
        const dateStr = this.formatDate(date);
        const dateForSlug = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const slug = `connections-${dateForSlug}`;
        
        const article = {
            title: `NYT Connections ${dateStr} - Answers, Hints & Solutions`,
            slug: slug,
            date: date.toISOString(),
            content: await this.generateContent(puzzleData, dateStr),
            meta: this.generateMeta(dateStr, puzzleData),
            schema: this.generateSchema(dateStr, puzzleData)
        };

        await this.saveArticle(article);
        await this.updateSitemap(article);
        
        return article;
    }

    async generateContent(puzzleData, dateStr) {
        const difficultyEmojis = {
            'green': '🟢',
            'yellow': '🟡', 
            'blue': '🔵',
            'purple': '🟣'
        };

        const difficultyNames = {
            'green': 'Easy',
            'yellow': 'Medium',
            'blue': 'Hard', 
            'purple': 'Tricky'
        };

        let content = `# NYT Connections ${dateStr} - Complete Guide & Solutions

Welcome to today's Connections puzzle solution! If you're stuck on the ${dateStr} NYT Connections game, you've come to the right place. Below you'll find all the answers, hints, and detailed explanations to help you solve today's word grouping challenge.

## 🎯 Quick Summary - ${dateStr} Connections

Today's puzzle features themes around **${this.getMainThemes(puzzleData)}**. The difficulty ranges from straightforward word associations to some tricky wordplay that might catch you off guard.

## 📋 Complete Answers - ${dateStr}

Here are all four groups for today's Connections puzzle:

`;

        // Add each group with detailed explanation
        puzzleData.groups.forEach((group, index) => {
            const emoji = difficultyEmojis[group.difficulty] || '⚪';
            const diffName = difficultyNames[group.difficulty] || 'Unknown';
            
            content += `
### ${emoji} ${group.theme} (${diffName})

**Words:** ${group.words.join(', ')}

**Explanation:** ${this.generateExplanation(group)}

**Hint:** ${group.hint || `These words are all related to "${group.theme}"`}

---

`;
        });

        content += `## 💡 Solving Strategy for ${dateStr}

### Recommended Approach:
1. **Start with the obvious** - Look for clear categories first
2. **Watch for wordplay** - Today's puzzle includes some clever connections
3. **Consider multiple meanings** - Some words have double meanings
4. **Use elimination** - If you're sure about 3 words, the 4th often becomes clear

### Common Mistakes to Avoid:
- Don't rush - take time to consider all possibilities
- Watch out for red herrings - some obvious connections might be traps
- Remember that proper nouns and brand names are fair game

## 🎮 How to Play Connections

If you're new to the NYT Connections game:

1. **Find groups of 4** - Each puzzle has exactly 4 groups of 4 words
2. **Look for common themes** - Words in each group share something in common
3. **Difficulty levels** - Groups are color-coded from easy (green) to hard (purple)
4. **Limited mistakes** - You get 4 wrong guesses before the game ends

## 🔍 Today's Themes Explained

${this.generateThemeAnalysis(puzzleData)}

## 📅 More Connections Solutions

Looking for other days? Check out our complete archive:
- [Yesterday's Connections](./connections-yesterday)
- [Connections Archive](./connections-archive)
- [Connections Tips & Strategies](./connections-strategy-guide)

## 🤖 Need More Help?

Try our [Interactive Connections Helper](/) with AI-powered hints that can guide you through today's puzzle step by step!

---

*Last updated: ${new Date().toISOString()}*
*Difficulty Rating: ${this.calculateDifficulty(puzzleData)}/5*
`;

        return content;
    }

    generateMeta(dateStr, puzzleData) {
        const themes = this.getMainThemes(puzzleData);
        
        return {
            title: `NYT Connections ${dateStr} Answers & Hints - Complete Solutions`,
            description: `Complete solutions for NYT Connections ${dateStr}. Get all answers, hints, and explanations for today's word grouping puzzle featuring ${themes}.`,
            keywords: [
                `connections ${dateStr.toLowerCase()}`,
                `nyt connections ${dateStr.toLowerCase()} answers`,
                `connections puzzle ${dateStr.toLowerCase()}`,
                `connections ${dateStr.toLowerCase()} hints`,
                `connections ${dateStr.toLowerCase()} solutions`,
                ...puzzleData.groups.map(g => g.theme.toLowerCase()),
                'word puzzle', 'connections game', 'nyt games'
            ].join(', '),
            canonical: `/connections-${dateStr.toLowerCase().replace(/\s+/g, '-')}`,
            ogImage: `/images/connections-${dateStr.toLowerCase().replace(/\s+/g, '-')}.jpg`
        };
    }

    generateSchema(dateStr, puzzleData) {
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `NYT Connections ${dateStr} - Complete Solutions & Answers`,
            "description": `Complete guide to solving the ${dateStr} NYT Connections puzzle with all answers and explanations.`,
            "author": {
                "@type": "Organization",
                "name": "Connections Game Helper"
            },
            "publisher": {
                "@type": "Organization", 
                "name": "Connections Game Helper"
            },
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `/connections-${dateStr.toLowerCase().replace(/\s+/g, '-')}`
            },
            "about": {
                "@type": "Game",
                "name": "NYT Connections",
                "description": "Daily word grouping puzzle game"
            }
        };
    }

    getMainThemes(puzzleData) {
        return puzzleData.groups.slice(0, 2).map(g => g.theme).join(' and ');
    }

    generateExplanation(group) {
        // Generate contextual explanations based on theme
        const explanations = {
            'ANIMALS': 'All of these are common animals.',
            'COLORS': 'These words all represent different colors.',
            'FOOD': 'These are all types of food or dishes.',
            'SPORTS': 'These are all sports or athletic activities.',
            'MOVIES': 'These are all popular movies or films.',
            'MUSIC': 'These relate to music or musical terms.',
            'TECHNOLOGY': 'These are all technology-related terms.',
            'TRAVEL': 'These words all relate to travel or transportation.'
        };

        // Try to match theme or generate generic explanation
        const theme = group.theme.toUpperCase();
        for (const [key, explanation] of Object.entries(explanations)) {
            if (theme.includes(key)) {
                return explanation;
            }
        }

        return `These words are connected by the theme "${group.theme}". ${group.hint || 'Look for the common thread that links all four words together.'}`;
    }

    generateThemeAnalysis(puzzleData) {
        let analysis = '';
        
        puzzleData.groups.forEach((group, index) => {
            analysis += `**${group.theme}**: ${this.generateThemeInsight(group)}\n\n`;
        });

        return analysis;
    }

    generateThemeInsight(group) {
        // Generate insights about why this theme might be tricky or interesting
        const insights = [
            `This category focuses on ${group.theme.toLowerCase()} and requires recognizing the connection between ${group.words.slice(0, 2).join(' and ')}.`,
            `The ${group.theme.toLowerCase()} theme might be tricky because some words have multiple meanings.`,
            `Look for the common thread in ${group.theme.toLowerCase()} - all four words share this specific characteristic.`
        ];

        return insights[Math.floor(Math.random() * insights.length)];
    }

    calculateDifficulty(puzzleData) {
        const difficultyScores = { 'green': 1, 'yellow': 2, 'blue': 3, 'purple': 4 };
        const avgDifficulty = puzzleData.groups.reduce((sum, group) => 
            sum + (difficultyScores[group.difficulty] || 2), 0) / 4;
        return Math.round(avgDifficulty * 1.25); // Scale to 1-5
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    async saveArticle(article) {
        // Ensure articles directory exists
        await fs.mkdir(this.articlesDir, { recursive: true });
        
        // Save as markdown file
        const filename = `${article.slug}.md`;
        const filepath = path.join(this.articlesDir, filename);
        
        const frontMatter = `---
title: "${article.title}"
slug: "${article.slug}"
date: "${article.date}"
description: "${article.meta.description}"
keywords: "${article.meta.keywords}"
canonical: "${article.meta.canonical}"
schema: ${JSON.stringify(article.schema, null, 2)}
---

${article.content}`;

        await fs.writeFile(filepath, frontMatter, 'utf8');
        console.log(`✅ Article saved: ${filename}`);
    }

    async updateSitemap(article) {
        // Add to sitemap.xml
        const sitemapPath = './sitemap.xml';
        
        try {
            let sitemap = await fs.readFile(sitemapPath, 'utf8');
            
            const newUrl = `
    <url>
        <loc>https://yoursite.com${article.meta.canonical}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;

            // Insert before closing </urlset>
            sitemap = sitemap.replace('</urlset>', newUrl + '\n</urlset>');
            
            await fs.writeFile(sitemapPath, sitemap, 'utf8');
            console.log('✅ Sitemap updated');
        } catch (error) {
            console.error('❌ Failed to update sitemap:', error);
        }
    }
}

module.exports = ArticleGenerator;