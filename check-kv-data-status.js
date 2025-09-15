// KV 存储数据状态检查脚本
// 用于诊断连续三天相同谜题的问题

// 将这个文件复制到 functions/api/check-kv.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 只允许 GET 请求
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      console.log('=== KV 数据状态检查开始 ===');
      
      // 获取当前日期和前几天的日期
      const today = new Date();
      const dates = [];
      
      // 检查最近 5 天的数据
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push({
          date: date,
          dateStr: date.toISOString().split('T')[0], // YYYY-MM-DD 格式
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' })
        });
      }

      console.log('检查的日期范围:', dates.map(d => d.dateStr));

      const results = {
        checkTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        kvData: {},
        summary: {
          totalKeys: 0,
          uniqueContents: 0,
          duplicateContents: 0,
          missingDates: []
        }
      };

      // 可能的 KV 键名格式
      const keyFormats = [
        (dateStr) => `puzzle-${dateStr}`,           // puzzle-2024-09-15
        (dateStr) => `connections-${dateStr}`,      // connections-2024-09-15
        (dateStr) => `nyt-${dateStr}`,             // nyt-2024-09-15
        (dateStr) => dateStr,                      // 2024-09-15
        (dateStr) => `puzzle_${dateStr}`,          // puzzle_2024-09-15
        (dateStr) => `today-${dateStr}`,           // today-2024-09-15
        (dateStr) => `data-${dateStr}`             // data-2024-09-15
      ];

      // 检查每个日期的每种可能的键名格式
      for (const dateInfo of dates) {
        const dateStr = dateInfo.dateStr;
        results.kvData[dateStr] = {
          date: dateStr,
          dayName: dateInfo.dayName,
          keys: {},
          foundData: false
        };

        for (let i = 0; i < keyFormats.length; i++) {
          const keyFormat = keyFormats[i];
          const key = keyFormat(dateStr);
          
          try {
            console.log(`检查键名: ${key}`);
            const data = await env.PUZZLE_KV.get(key);
            
            if (data) {
              console.log(`✅ 找到数据: ${key}`);
              const parsedData = JSON.parse(data);
              
              results.kvData[dateStr].keys[key] = {
                exists: true,
                dataSize: data.length,
                hasCategories: !!parsedData.categories,
                categoriesCount: parsedData.categories ? parsedData.categories.length : 0,
                hasWords: !!parsedData.words,
                wordsCount: parsedData.words ? parsedData.words.length : 0,
                timestamp: parsedData.timestamp || 'unknown',
                date: parsedData.date || 'unknown',
                preview: {
                  firstCategory: parsedData.categories?.[0]?.theme || 'N/A',
                  firstWords: parsedData.words?.slice(0, 4) || []
                }
              };
              
              results.kvData[dateStr].foundData = true;
              results.summary.totalKeys++;
            } else {
              console.log(`❌ 未找到数据: ${key}`);
              results.kvData[dateStr].keys[key] = {
                exists: false
              };
            }
          } catch (error) {
            console.error(`检查键名 ${key} 时出错:`, error);
            results.kvData[dateStr].keys[key] = {
              exists: false,
              error: error.message
            };
          }
        }

        if (!results.kvData[dateStr].foundData) {
          results.summary.missingDates.push(dateStr);
        }
      }

      // 分析数据重复情况
      const contentHashes = new Map();
      for (const dateStr in results.kvData) {
        const dateData = results.kvData[dateStr];
        for (const key in dateData.keys) {
          const keyData = dateData.keys[key];
          if (keyData.exists && keyData.preview) {
            const contentHash = JSON.stringify(keyData.preview);
            if (contentHashes.has(contentHash)) {
              contentHashes.get(contentHash).push(`${dateStr}:${key}`);
            } else {
              contentHashes.set(contentHash, [`${dateStr}:${key}`]);
            }
          }
        }
      }

      // 统计重复内容
      for (const [hash, keys] of contentHashes) {
        if (keys.length > 1) {
          results.summary.duplicateContents++;
        } else {
          results.summary.uniqueContents++;
        }
      }

      // 添加重复内容详情
      results.duplicateAnalysis = {};
      for (const [hash, keys] of contentHashes) {
        if (keys.length > 1) {
          results.duplicateAnalysis[`duplicate_${Object.keys(results.duplicateAnalysis).length + 1}`] = {
            keys: keys,
            count: keys.length,
            contentPreview: JSON.parse(hash)
          };
        }
      }

      console.log('=== KV 数据状态检查完成 ===');

      // 返回详细的检查结果
      return new Response(JSON.stringify(results, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('KV 数据检查失败:', error);
      return new Response(JSON.stringify({
        error: 'KV 数据检查失败',
        message: error.message,
        stack: error.stack
      }, null, 2), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};