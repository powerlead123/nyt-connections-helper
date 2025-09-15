// KV 存储直接测试脚本
// 测试定时触发时 KV 存储是否真的能工作

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      console.log('=== KV 存储直接测试 ===');
      
      const testResults = {
        timestamp: new Date().toISOString(),
        tests: {},
        kvBinding: {
          exists: !!env.CONNECTIONS_KV,
          type: typeof env.CONNECTIONS_KV
        }
      };

      // 测试 1: 检查 KV 绑定是否存在
      console.log('1. 检查 KV 绑定...');
      if (env.CONNECTIONS_KV) {
        console.log('✅ CONNECTIONS_KV 绑定存在');
        testResults.tests.bindingExists = true;
      } else {
        console.log('❌ CONNECTIONS_KV 绑定不存在');
        testResults.tests.bindingExists = false;
        return new Response(JSON.stringify(testResults, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 测试 2: 尝试写入测试数据
      console.log('2. 测试 KV 写入...');
      try {
        const testKey = `test-write-${Date.now()}`;
        const testData = {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'KV write test successful'
        };
        
        await env.CONNECTIONS_KV.put(testKey, JSON.stringify(testData));
        console.log('✅ KV 写入测试成功');
        testResults.tests.writeTest = { success: true, key: testKey };
        
        // 测试 3: 立即读取刚写入的数据
        console.log('3. 测试 KV 读取...');
        const readData = await env.CONNECTIONS_KV.get(testKey);
        if (readData) {
          const parsed = JSON.parse(readData);
          console.log('✅ KV 读取测试成功');
          testResults.tests.readTest = { success: true, data: parsed };
          
          // 清理测试数据
          await env.CONNECTIONS_KV.delete(testKey);
          console.log('✅ KV 删除测试成功');
          testResults.tests.deleteTest = { success: true };
        } else {
          console.log('❌ KV 读取测试失败');
          testResults.tests.readTest = { success: false };
        }
        
      } catch (writeError) {
        console.log('❌ KV 写入测试失败:', writeError.message);
        testResults.tests.writeTest = { success: false, error: writeError.message };
      }

      // 测试 4: 模拟定时任务的完整流程
      console.log('4. 模拟定时任务完整流程...');
      try {
        const today = new Date().toISOString().split('T')[0];
        const mockPuzzleData = {
          date: today,
          timestamp: new Date().toISOString(),
          source: 'KV Storage Test - Simulated Cron Trigger',
          words: ['TEST1', 'TEST2', 'TEST3', 'TEST4', 'TEST5', 'TEST6', 'TEST7', 'TEST8', 
                  'TEST9', 'TEST10', 'TEST11', 'TEST12', 'TEST13', 'TEST14', 'TEST15', 'TEST16'],
          groups: [
            {
              theme: 'Test Group 1',
              words: ['TEST1', 'TEST2', 'TEST3', 'TEST4'],
              difficulty: 'yellow',
              hint: 'This is a test group 1'
            },
            {
              theme: 'Test Group 2', 
              words: ['TEST5', 'TEST6', 'TEST7', 'TEST8'],
              difficulty: 'green',
              hint: 'This is a test group 2'
            },
            {
              theme: 'Test Group 3',
              words: ['TEST9', 'TEST10', 'TEST11', 'TEST12'],
              difficulty: 'blue', 
              hint: 'This is a test group 3'
            },
            {
              theme: 'Test Group 4',
              words: ['TEST13', 'TEST14', 'TEST15', 'TEST16'],
              difficulty: 'purple',
              hint: 'This is a test group 4'
            }
          ]
        };

        // 使用与 scheduled.js 完全相同的逻辑
        const puzzleKey = `puzzle-${today}`;
        await env.CONNECTIONS_KV.put(puzzleKey, JSON.stringify(mockPuzzleData), {
          expirationTtl: 86400 // 24小时过期
        });
        
        console.log('✅ 模拟谜题数据写入成功');
        testResults.tests.simulatedWrite = { success: true, key: puzzleKey };

        // 立即读取验证
        const savedData = await env.CONNECTIONS_KV.get(puzzleKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          console.log('✅ 模拟数据读取验证成功');
          testResults.tests.simulatedRead = { 
            success: true, 
            dataMatch: parsed.source === mockPuzzleData.source,
            timestamp: parsed.timestamp
          };
        } else {
          console.log('❌ 模拟数据读取验证失败');
          testResults.tests.simulatedRead = { success: false };
        }

      } catch (simulationError) {
        console.log('❌ 模拟定时任务失败:', simulationError.message);
        testResults.tests.simulatedWrite = { success: false, error: simulationError.message };
      }

      // 测试 5: 检查现有的今日数据
      console.log('5. 检查现有今日数据...');
      try {
        const today = new Date().toISOString().split('T')[0];
        const existingData = await env.CONNECTIONS_KV.get(`puzzle-${today}`);
        
        if (existingData) {
          const parsed = JSON.parse(existingData);
          console.log('✅ 找到现有今日数据');
          testResults.currentData = {
            exists: true,
            source: parsed.source,
            timestamp: parsed.timestamp,
            wordsCount: parsed.words?.length || 0
          };
        } else {
          console.log('❌ 未找到现有今日数据');
          testResults.currentData = { exists: false };
        }
      } catch (error) {
        console.log('❌ 检查现有数据失败:', error.message);
        testResults.currentData = { exists: false, error: error.message };
      }

      // 综合评估
      const allTests = Object.values(testResults.tests);
      const successfulTests = allTests.filter(test => test.success).length;
      const totalTests = allTests.length;
      
      testResults.summary = {
        totalTests,
        successfulTests,
        successRate: Math.round((successfulTests / totalTests) * 100),
        kvWorking: successfulTests >= 3 // 至少3个测试成功才认为KV正常
      };

      console.log(`测试完成: ${successfulTests}/${totalTests} 成功`);
      
      if (testResults.summary.kvWorking) {
        console.log('🎉 KV 存储工作正常！');
      } else {
        console.log('❌ KV 存储存在问题');
      }

      return new Response(JSON.stringify(testResults, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('KV 测试失败:', error);
      return new Response(JSON.stringify({
        error: 'KV test failed',
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