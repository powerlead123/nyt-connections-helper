const FixedConnectionsParser = require('./fixed-parser.js');

async function checkWords() {
    console.log('🔍 检查当前单词质量...');
    
    const parser = new FixedConnectionsParser();
    const data = await parser.fetchMashableData();
    
    if (data && data.words) {
        console.log('\n📝 当前提取的单词:');
        data.words.forEach((word, index) => {
            const hasError = word.endsWith('U') || word.endsWith('A') || word.endsWith('E') || word.endsWith('D');
            console.log(`${index + 1}. ${word} ${hasError ? '❌' : '✅'}`);
        });
        
        const errorWords = data.words.filter(word => 
            word.endsWith('U') || word.endsWith('A') || word.endsWith('E') || word.endsWith('D')
        );
        
        console.log(`\n📊 错误单词数: ${errorWords.length}/${data.words.length}`);
        if (errorWords.length > 0) {
            console.log('❌ 错误单词:', errorWords);
        } else {
            console.log('✅ 所有单词都正确!');
        }
    }
}

checkWords();