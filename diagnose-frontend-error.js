console.log('🔍 诊断前端加载错误');

async function diagnoseFrontendError() {
  const baseUrl = 'https://nyt-connections-helper.pages.dev';
  const today = new Date().toISOString().split('T')[0];
  
  console.log('当前日期:', today);
  console.log('当前时间:', new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}), '(北京时间)');
  
  console.log('\n=== 1. 检查主页是否正常 ===');
  try {
    const homeResponse = await fetch(baseUrl);
    console.log('主页状态:', homeResponse.status);
    console.log('主页内容类型:', homeResponse.headers.get('content-type'));
    
    if (homeResponse.ok) {
      const homeHTML = await homeResponse.text();
      console.log('主页大小:', homeHTML.length, '字符');
      
      // 检查script.js引用
      const scriptMatch = homeHTML.match(/script\.js\?v=([^"]+)/);
      console.log('Script版本:', scriptMatch ? scriptMatch[1] : '未找到');
    }
  } catch (error) {
    console.log('❌ 主页访问失败:', error.message);
  }
  
  console.log('\n=== 2. 检查/api/today端点 ===');
  try {
    const todayResponse = await fetch(`${baseUrl}/api/today`);
    console.log('Today API状态:', todayResponse.status);
    console.log('Today API内容类型:', todayResponse.headers.get('content-type'));
    
    if (todayResponse.ok) {
      const todayData = await todayResponse.json();
      console.log('Today API数据:');
      console.log('- 日期:', todayData.date);
      console.log('- 时间戳:', todayData.timestamp || '❌ 缺失');
      console.log('- 数据来源:', todayData.source);
      console.log('- 分组数量:', todayData.groups?.length || 0);
      console.log('- 单词数量:', todayData.words?.length || 0);
    } else {
      console.log('❌ Today API返回错误:', todayResponse.status);
      const errorText = await todayResponse.text();
      console.log('错误内容:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Today API访问失败:', error.message);
  }
  
  console.log('\n=== 3. 检查KV存储状态 ===');
  try {
    const kvResponse = await fetch(`${baseUrl}/api/kv-simple-test`);
    if (kvResponse.ok) {
      const kvData = await kvResponse.json();
      console.log('KV存储状态:');
      console.log('- 今日数据存在:', kvData.todayExists ? '✅' : '❌');
      console.log('- 今日数据时间戳:', kvData.todayTimestamp || '无');
    } else {
      console.log('❌ KV测试端点访问失败:', kvResponse.status);
    }
  } catch (error) {
    console.log('❌ KV测试失败:', error.message);
  }
  
  console.log('\n=== 4. 检查定时抓取状态 ===');
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const beijingHour = beijingTime.getUTCHours();
  const beijingMinute = beijingTime.getUTCMinutes();
  
  console.log('当前北京时间:', `${beijingHour.toString().padStart(2, '0')}:${beijingMinute.toString().padStart(2, '0')}`);
  console.log('定时抓取时间: 12:20');
  
  if (beijingHour < 12 || (beijingHour === 12 && beijingMinute < 20)) {
    console.log('⏰ 定时抓取还未执行（今天12:20执行）');
  } else {
    console.log('⏰ 定时抓取应该已经执行');
  }
  
  console.log('\n=== 5. 手动触发抓取测试 ===');
  try {
    const scheduledResponse = await fetch(`${baseUrl}/scheduled`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'daily-update',
        secret: 'your-secret-key-here'
      })
    });
    
    if (scheduledResponse.ok) {
      const scheduledResult = await scheduledResponse.json();
      console.log('手动抓取结果:');
      console.log('- 执行成功:', scheduledResult.success ? '✅' : '❌');
      console.log('- 抓取成功:', scheduledResult.result?.scrape?.success ? '✅' : '❌');
      console.log('- KV存储成功:', scheduledResult.result?.scrape?.kvStored ? '✅' : '❌');
    } else {
      console.log('❌ 手动抓取失败:', scheduledResponse.status);
    }
  } catch (error) {
    console.log('❌ 手动抓取出错:', error.message);
  }
  
  console.log('\n=== 🎯 问题诊断结果 ===');
  console.log('请等待诊断完成后查看上述结果');
  console.log('主要检查点:');
  console.log('1. Today API是否返回404');
  console.log('2. 今日数据是否存在于KV中');
  console.log('3. 定时抓取是否已执行');
  console.log('4. 手动抓取是否能成功');
}

// 运行诊断
diagnoseFrontendError().catch(console.error);