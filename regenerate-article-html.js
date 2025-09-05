// 重新生成HTML格式的文章
const today = new Date().toISOString().split('T')[0];

async function regenerateArticle() {
    try {
        console.log(`🔄 重新生成 ${today} 的HTML文章...`);
        
        // 步骤1: 触发文章重新生成
        console.log('\n步骤1: 触发文章重新生成');
        const response = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate-article',
                secret: 'your-secret-key-here'
            })
        });
        
        console.log(`生成状态: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 文章重新生成成功!');
            console.log('结果:', result);
        } else {
            const errorText = await response.text();
            console.log('❌ 文章重新生成失败');
            console.log('错误:', errorText);
            return;
        }
        
        // 步骤2: 等待一下，然后检查新文章
        console.log('\n步骤2: 等待3秒后检查新文章...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const checkResponse = await fetch(`https://nyt-connections-helper.pages.dev/api/article/${today}`);
        console.log(`文章检查状态: ${checkResponse.status}`);
        
        if (checkResponse.ok) {
            const content = await checkResponse.text();
            console.log(`文章长度: ${content.length} 字符`);
            
            // 检查格式
            const isHTML = content.includes('<!DOCTYPE html>') || content.includes('<html');
            const isMarkdown = content.includes('# NYT Connections') && !content.includes('<html');
            
            console.log(`是HTML格式: ${isHTML}`);
            console.log(`是Markdown格式: ${isMarkdown}`);
            
            // 检查内容
            const hasTitle = content.includes('NYT Connections');
            const hasAnswers = content.includes('Complete Answers');
            const hasGroups = content.includes('Yellow') || content.includes('Green') || content.includes('Blue') || content.includes('Purple');
            const hasTailwind = content.includes('tailwindcss.com');
            const hasStructuredData = content.includes('application/ld+json');
            
            console.log(`\n内容检查:`);
            console.log(`包含标题: ${hasTitle}`);
            console.log(`包含答案: ${hasAnswers}`);
            console.log(`包含分组: ${hasGroups}`);
            console.log(`包含Tailwind CSS: ${hasTailwind}`);
            console.log(`包含结构化数据: ${hasStructuredData}`);
            
            if (isHTML && hasTitle && hasAnswers && hasGroups && hasTailwind) {
                console.log('\n✅ 文章现在是正确的HTML格式!');
                
                // 显示文章开头
                console.log('\n文章开头预览:');
                console.log('='.repeat(50));
                console.log(content.substring(0, 300));
                console.log('='.repeat(50));
            } else {
                console.log('\n❌ 文章格式仍然有问题');
            }
            
        } else {
            console.log('❌ 无法获取重新生成的文章');
        }
        
    } catch (error) {
        console.error('重新生成失败:', error.message);
    }
}

regenerateArticle();