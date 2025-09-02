// 检查Mashable是否有9月2日的文章
console.log('🔍 检查Mashable是否有9月2日的Connections文章...');

async function checkMashableSept2() {
    const today = new Date();
    const year = today.getFullYear();
    
    // 可能的URL格式
    const possibleUrls = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-september-2-${year}`,
        `https://mashable.com/article/nyt-connections-answer-today-september-2-${year}`,
        `https://mashable.com/article/connections-hint-answer-today-september-2-${year}`,
        `https://mashable.com/article/nyt-connections-september-2-${year}`,
        `https://mashable.com/article/connections-september-2-${year}`
    ];
    
    console.log('📋 尝试的URL列表:');
    possibleUrls.forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
    });
    
    console.log('\n🌐 检查URL可访问性...');
    
    for (let i = 0; i < possibleUrls.length; i++) {
        const url = possibleUrls[i];
        console.log(`\n尝试 ${i + 1}: ${url}`);
        
        try {
            // 直接尝试访问
            const response = await fetch(url, {
                method: 'HEAD', // 只检查头部，不下载内容
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            console.log(`状态码: ${response.status}`);
            
            if (response.ok) {
                console.log('✅ 找到文章！');
                
                // 获取完整内容
                const fullResponse = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (fullResponse.ok) {
                    const html = await fullResponse.text();
                    console.log(`HTML长度: ${html.length}`);
                    
                    // 检查是否包含Connections相关内容
                    const hasConnections = html.toLowerCase().includes('connections');
                    const hasAnswer = html.toLowerCase().includes('answer');
                    const hasToday = html.toLowerCase().includes('today');
                    
                    console.log('内容检查:');
                    console.log(`- 包含"connections": ${hasConnections}`);
                    console.log(`- 包含"answer": ${hasAnswer}`);
                    console.log(`- 包含"today": ${hasToday}`);
                    
                    if (hasConnections && hasAnswer) {
                        console.log('✅ 这是正确的Connections文章！');
                        
                        // 显示文章标题
                        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
                        if (titleMatch) {
                            console.log(`文章标题: ${titleMatch[1]}`);
                        }
                        
                        // 查找答案部分
                        const answerSection = html.match(/What is the answer to Connections today[\s\S]{0,1000}/i);
                        if (answerSection) {
                            console.log('\n📝 找到答案部分:');
                            console.log(answerSection[0]);
                        } else {
                            console.log('\n❌ 未找到标准答案格式');
                            
                            // 查找其他可能的答案格式
                            const altFormats = [
                                /answer[\s\S]{0,500}/i,
                                /solution[\s\S]{0,500}/i,
                                /yellow[\s\S]{0,500}purple/i
                            ];
                            
                            for (const format of altFormats) {
                                const match = html.match(format);
                                if (match) {
                                    console.log(`\n找到替代格式: ${match[0].substring(0, 200)}...`);
                                    break;
                                }
                            }
                        }
                        
                        return url; // 返回正确的URL
                    } else {
                        console.log('⚠️  不是Connections文章或格式不同');
                    }
                } else {
                    console.log(`❌ 无法获取内容: ${fullResponse.status}`);
                }
            } else if (response.status === 404) {
                console.log('❌ 文章不存在 (404)');
            } else {
                console.log(`❌ 其他错误: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ 请求失败: ${error.message}`);
        }
    }
    
    console.log('\n💡 结论:');
    console.log('如果所有URL都失败，可能的原因:');
    console.log('1. Mashable还没发布9月2日的文章');
    console.log('2. URL格式发生了变化');
    console.log('3. 网站阻止了自动访问');
    console.log('4. 需要等待美国时间的发布时间');
    
    console.log('\n🔧 建议:');
    console.log('1. 手动访问 https://mashable.com 搜索今天的文章');
    console.log('2. 如果找到文章，复制正确的URL格式');
    console.log('3. 考虑使用其他数据源（如Reddit、Discord等）');
    console.log('4. 或者暂时手动维护数据');
}

checkMashableSept2();