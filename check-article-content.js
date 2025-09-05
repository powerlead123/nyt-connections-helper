// 检查今天生成的文章内容
const today = new Date().toISOString().split('T')[0];

async function checkArticleContent() {
    try {
        console.log(`检查 ${today} 的文章内容...`);
        
        const response = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`状态: ${response.status}`);
        
        if (response.ok) {
            const content = await response.text();
            console.log(`内容长度: ${content.length} 字符`);
            
            // 检查内容类型
            const isHTML = content.includes('<!DOCTYPE html>') || content.includes('<html');
            const isMarkdown = content.includes('# NYT Connections') && !content.includes('<html');
            
            console.log(`是HTML格式: ${isHTML}`);
            console.log(`是Markdown格式: ${isMarkdown}`);
            
            // 显示内容开头
            console.log('\n内容开头:');
            console.log('='.repeat(50));
            console.log(content.substring(0, 500));
            console.log('='.repeat(50));
            
            // 检查是否包含预期的元素
            const hasTitle = content.includes('NYT Connections');
            const hasAnswers = content.includes('Complete Answers') || content.includes('答案');
            const hasGroups = content.includes('Yellow') || content.includes('Green') || content.includes('Blue') || content.includes('Purple');
            
            console.log(`\n内容检查:`);
            console.log(`包含标题: ${hasTitle}`);
            console.log(`包含答案: ${hasAnswers}`);
            console.log(`包含分组: ${hasGroups}`);
            
            if (isHTML && hasTitle && hasAnswers && hasGroups) {
                console.log('\n✅ 文章内容完整且格式正确');
            } else if (isMarkdown && hasTitle && hasAnswers && hasGroups) {
                console.log('\n⚠️ 文章内容完整但格式为Markdown (应该是HTML)');
            } else {
                console.log('\n❌ 文章内容可能有问题');
            }
            
        } else {
            console.log('❌ 无法获取文章内容');
            const errorText = await response.text();
            console.log('错误:', errorText.substring(0, 200));
        }
        
    } catch (error) {
        console.error('检查失败:', error.message);
    }
}

checkArticleContent();