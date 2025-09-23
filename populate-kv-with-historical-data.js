// 手动填充KV存储，获取最近几天的历史数据
console.log('🔄 手动填充KV存储...');

async function populateKVWithHistoricalData() {
    try {
        // 尝试获取最近几天的数据
        const dates = [];
        for (let i = 1; i <= 10; i++) { // 尝试最近10天
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push({
                dateStr: date.toISOString().split('T')[0],
                date: date
            });
        }
        
        console.log('尝试获取这些日期的数据:', dates.map(d => d.dateStr));
        
        for (const {dateStr, date} of dates) {
            try {
                console.log(`\n📅 尝试获取 ${dateStr} 的数据...`);
                
                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                                   'july', 'august', 'september', 'october', 'november', 'december'];
                const monthName = monthNames[date.getMonth()];
                const day = date.getDate();
                const year = date.getFullYear();
                
                const url = `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`;
                console.log('URL:', url);
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!response.ok) {
                    console.log(`❌ ${dateStr}: HTTP ${response.status}`);
                    continue;
                }
                
                const html = await response.text();
                
                // 检查是否有完整内容
                const hasContent = html.includes("Today's connections fall into the following categories:") &&
                                 html.includes("Looking for Wordle today?") &&
                                 html.includes("What is the answer to Connections today");
                
                if (!hasContent) {
                    console.log(`❌ ${dateStr}: 内容不完整`);
                    continue;
                }
                
                // 简单解析验证
                const startPhrase = "Today's connections fall into the following categories:";
                const startPos = html.indexOf(startPhrase);
                const endPhrase = "Looking for Wordle today?";
                const endPos = html.indexOf(endPhrase, startPos);
                
                if (startPos === -1 || endPos === -1) {
                    console.log(`❌ ${dateStr}: 无法找到边界`);
                    continue;
                }
                
                const hintSection = html.substring(startPos + startPhrase.length, endPos);
                const colors = ['Yellow:', 'Green:', 'Blue:', 'Purple:'];
                const hasAllColors = colors.every(color => hintSection.includes(color));
                
                if (!hasAllColors) {
                    console.log(`❌ ${dateStr}: 缺少颜色标记`);
                    continue;
                }
                
                console.log(`✅ ${dateStr}: 数据看起来完整，尝试通过API存储...`);
                
                // 通过scheduled API存储数据
                const storeResponse = await fetch('https://nyt-connections-helper.pages.dev/scheduled', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'scrape-data',
                        secret: 'your-secret-key-here',
                        date: dateStr // 如果API支持指定日期
                    })
                });
                
                if (storeResponse.ok) {
                    const storeData = await storeResponse.json();
                    if (storeData.success && storeData.result?.success) {
                        console.log(`🎉 ${dateStr}: 成功存储到KV!`);
                        break; // 找到一个成功的就够了
                    } else {
                        console.log(`❌ ${dateStr}: 存储失败 -`, storeData.result?.reason || storeData.result?.error);
                    }
                } else {
                    console.log(`❌ ${dateStr}: API调用失败`);
                }
                
            } catch (error) {
                console.log(`❌ ${dateStr}: 处理失败 -`, error.message);
            }
        }
        
        // 检查结果
        console.log('\n🔍 检查KV存储结果...');
        const todayResponse = await fetch('https://nyt-connections-helper.pages.dev/api/today');
        const todayData = await todayResponse.json();
        
        if (todayData.success) {
            console.log('🎉 成功！现在有可用数据了:');
            console.log('- 日期:', todayData.actualDate);
            console.log('- 数据源:', todayData.source);
            console.log('- 新鲜度:', todayData.freshness);
        } else {
            console.log('❌ 仍然没有可用数据:', todayData.message);
        }
        
    } catch (error) {
        console.log('❌ 填充过程失败:', error.message);
    }
}

populateKVWithHistoricalData();