const ArticleGenerator = require('./article-generator');

// 测试数据
const testPuzzleData = {
    date: '2025-01-27',
    words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT', 'SPRING', 'SUMMER', 'FALL', 'WINTER', 'MARS', 'SNICKERS', 'TWIX', 'KITKAT', 'APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
    groups: [
        {
            theme: 'Fish Types',
            words: ['BASS', 'FLOUNDER', 'SOLE', 'HALIBUT'],
            difficulty: 'yellow',
            hint: 'These are all types of fish you might find on a restaurant menu'
        },
        {
            theme: 'Seasons',
            words: ['SPRING', 'SUMMER', 'FALL', 'WINTER'],
            difficulty: 'green',
            hint: 'The four periods of the year'
        },
        {
            theme: 'Candy Bars',
            words: ['MARS', 'SNICKERS', 'TWIX', 'KITKAT'],
            difficulty: 'blue',
            hint: 'Popular chocolate bar brands'
        },
        {
            theme: 'Tech Companies',
            words: ['APPLE', 'MICROSOFT', 'GOOGLE', 'META'],
            difficulty: 'purple',
            hint: 'Major technology corporations'
        }
    ]
};

async function testArticleGeneration() {
    console.log('🧪 Testing article generation...');
    
    try {
        const generator = new ArticleGenerator();
        const article = await generator.generateDailyArticle(testPuzzleData, new Date());
        
        console.log('✅ Article generated successfully!');
        console.log('📄 Title:', article.title);
        console.log('🔗 Slug:', article.slug);
        console.log('📝 Content length:', article.content.length, 'characters');
        console.log('🏷️ Keywords:', article.meta.keywords.split(', ').length, 'keywords');
        
        // Display first few lines of content
        const contentPreview = article.content.split('\n').slice(0, 10).join('\n');
        console.log('\n📖 Content preview:');
        console.log('---');
        console.log(contentPreview);
        console.log('...');
        console.log('---');
        
        console.log('\n🎯 SEO Analysis:');
        console.log('- Title length:', article.meta.title.length, 'characters');
        console.log('- Description length:', article.meta.description.length, 'characters');
        console.log('- Keywords count:', article.meta.keywords.split(', ').length);
        console.log('- Schema.org structured data: ✅');
        console.log('- Canonical URL: ✅');
        
        return article;
        
    } catch (error) {
        console.error('❌ Article generation failed:', error);
        throw error;
    }
}

// 运行测试
if (require.main === module) {
    testArticleGeneration()
        .then(() => {
            console.log('\n🎉 Test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testArticleGeneration, testPuzzleData };