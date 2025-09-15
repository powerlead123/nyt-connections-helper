// KV 绑定诊断脚本
// 检查 KV 绑定是否正确配置

export default {
  async fetch(request, env) {
    try {
      console.log('=== KV 绑定诊断 ===');
      
      const diagnostics = {
        timestamp: new Date().toISOString(),
        kvBinding: {
          exists: !!env.CONNECTIONS_KV,
          type: typeof env.CONNECTIONS_KV
        },
        tests: {}
      };
      
      // 测试 1: 检查 KV 绑定是否存在
      if (env.CONNECTIONS_KV) {
        console.log('✅ CONNECTIONS_KV 绑定存在');
        diagnostics.tests.bindingExists = true;
        
        // 测试 2: 尝试写入测试数据
        try {
          const testKey = `test-${Date.now()}`;
          const testData = { test: true, timestamp: new Date().toISOString() };
          
          await env.CONNECTIONS_KV.put(testKey, JSON.stringify(testData));
          console.log('✅ KV 写入测试成功');
          diagnostics.tests.writeTest = true;
          
          // 测试 3: 尝试读取测试数据
          const readData = await env.CONNECTIONS_KV.get(testKey);
          if (readData) {
            console.log('✅ KV 读取测试成功');
            diagnostics.tests.readTest = true;
            
            // 清理测试数据
            await env.CONNECTIONS_KV.delete(testKey);
            console.log('✅ KV 删除测试成功');
            diagnostics.tests.deleteTest = true;
          } else {
            console.log('❌ KV 读取测试失败');
            diagnostics.tests.readTest = false;
          }
          
        } catch (error) {
          console.log('❌ KV 操作测试失败:', error.message);
          diagnostics.tests.writeTest = false;
          diagnostics.tests.error = error.message;
        }
        
        // 测试 4: 检查当前谜题数据
        try {
          const today = new Date().toISOString().split('T')[0];
          const currentData = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
          
          if (currentData) {
            const parsed = JSON.parse(currentData);
            console.log('✅ 找到当前谜题数据');
            diagnostics.currentPuzzle = {
              exists: true,
              date: parsed.date,
              source: parsed.source,
              timestamp: parsed.timestamp,
              wordsCount: parsed.words?.length || 0
            };
          } else {
            console.log('❌ 未找到当前谜题数据');
            diagnostics.currentPuzzle = { exists: false };
          }
        } catch (error) {
          console.log('❌ 检查当前数据失败:', error.message);
          diagnostics.currentPuzzle = { exists: false, error: error.message };
        }
        
      } else {
        console.log('❌ CONNECTIONS_KV 绑定不存在');
        diagnostics.tests.bindingExists = false;
      }
      
      // 测试 5: 尝试手动写入今日数据
      if (env.CONNECTIONS_KV && diagnostics.tests.writeTest) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const testPuzzleData = {
            date: today,
            timestamp: new Date().toISOString(),
            source: 'KV Binding Test',
            words: ['TEST1', 'TEST2', 'TEST3', 'TEST4'],
            groups: [{
              theme: 'Test Group',
              words: ['TEST1', 'TEST2', 'TEST3', 'TEST4'],
              difficulty: 'yellow',
              hint: 'This is a test'
            }]
          };
          
          await env.CONNECTIONS_KV.put(`puzzle-${today}`, JSON.stringify(testPuzzleData));
          console.log('✅ 手动写入今日测试数据成功');
          diagnostics.tests.manualWrite = true;
          
        } catch (error) {
          console.log('❌ 手动写入失败:', error.message);
          diagnostics.tests.manualWrite = false;
        }
      }
      
      return new Response(JSON.stringify(diagnostics, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('诊断失败:', error);
      return new Response(JSON.stringify({
        error: 'Diagnostic failed',
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