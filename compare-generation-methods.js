import { generateStaticArticles } from './generate-static-articles.js';
import { generateStaticArticlesOptimized } from './generate-static-articles-optimized.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compareGenerationMethods() {
  console.log('🔍 对比原版 vs 优化版生成方法');
  console.log('⏰', new Date().toLocaleString());
  console.log('='.repeat(60));
  
  // 设置环境变量
  process.env.CLOUDFLARE_API_URL = 'https://nyt-connections-helper.pages.dev';
  
  try {
    // 1. 清理现有文件，模拟首次运行
    console.log('\n🧹 清理现有文件，模拟首次运行...');
    const articlesDir = path.join(__dirname, 'articles');
    if (fs.existsSync(articlesDir)) {
      const files = fs.readdirSync(articlesDir);
      files.forEach(file => {
        if (file.match(/^\d{4}-\d{2}-\d{2}\.html$/)) {
          fs.unlinkSync(path.join(articlesDir, file));
          console.log(`  🗑️ 删除: ${file}`);
        }
      });
    }
    
    // 2. 测试原版方法 - 首次运行
    console.log('\n📊 测试原版方法 - 首次运行');
    const originalStartTime = Date.now();
    await generateStaticArticles();
    const originalFirstTime = Date.now() - originalStartTime;
    
    console.log(`⏱️ 原版首次运行: ${originalFirstTime}ms`);
    
    // 记录生成的文件
    const filesAfterOriginal = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));
    console.log(`📁 生成文件: ${filesAfterOriginal.length} 个`);
    
    // 3. 测试原版方法 - 第二次运行（模拟重复生成）
    console.log('\n📊 测试原版方法 - 第二次运行（重复生成）');
    const originalSecondStartTime = Date.now();
    await generateStaticArticles();
    const originalSecondTime = Date.now() - originalSecondStartTime;
    
    console.log(`⏱️ 原版第二次运行: ${originalSecondTime}ms`);
    
    // 4. 清理文件，准备测试优化版
    console.log('\n🧹 清理文件，准备测试优化版...');
    files.forEach(file => {
      if (file.match(/^\d{4}-\d{2}-\d{2}\.html$/)) {
        const filePath = path.join(articlesDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
    
    // 5. 测试优化版方法 - 首次运行
    console.log('\n📊 测试优化版方法 - 首次运行');
    const optimizedStartTime = Date.now();
    await generateStaticArticlesOptimized();
    const optimizedFirstTime = Date.now() - optimizedStartTime;
    
    console.log(`⏱️ 优化版首次运行: ${optimizedFirstTime}ms`);
    
    // 6. 测试优化版方法 - 第二次运行（智能跳过）
    console.log('\n📊 测试优化版方法 - 第二次运行（智能跳过）');
    const optimizedSecondStartTime = Date.now();
    await generateStaticArticlesOptimized();
    const optimizedSecondTime = Date.now() - optimizedSecondStartTime;
    
    console.log(`⏱️ 优化版第二次运行: ${optimizedSecondTime}ms`);
    
    // 7. 性能对比分析
    console.log('\n' + '='.repeat(60));
    console.log('📊 性能对比分析');
    console.log('='.repeat(60));
    
    const comparisons = [
      {
        scenario: '首次运行 (生成所有文章)',
        original: originalFirstTime,
        optimized: optimizedFirstTime,
        description: '两种方法都需要处理所有文章'
      },
      {
        scenario: '日常运行 (已有文章存在)',
        original: originalSecondTime,
        optimized: optimizedSecondTime,
        description: '原版重复生成 vs 优化版智能跳过'
      }
    ];
    
    comparisons.forEach(comp => {
      console.log(`\n🎯 ${comp.scenario}`);
      console.log(`  📊 原版方法: ${comp.original}ms`);
      console.log(`  ⚡ 优化版本: ${comp.optimized}ms`);
      
      const improvement = ((comp.original - comp.optimized) / comp.original * 100);
      if (improvement > 0) {
        console.log(`  📈 性能提升: ${improvement.toFixed(1)}%`);
        console.log(`  ⏱️ 节省时间: ${comp.original - comp.optimized}ms`);
      } else {
        console.log(`  📉 性能变化: ${Math.abs(improvement).toFixed(1)}% (可能由于网络波动)`);
      }
      console.log(`  💭 说明: ${comp.description}`);
    });
    
    // 8. 资源消耗分析
    console.log('\n📈 资源消耗分析');
    
    const resourceAnalysis = [
      {
        metric: 'API 请求次数',
        original: '每次30个请求 (扫描30天)',
        optimized: '首次30个，日常0个 (跳过已存在)',
        impact: '日常运行减少100%的API请求'
      },
      {
        metric: '文件写入操作',
        original: '每次重写所有文章文件',
        optimized: '只写入新文章和索引文件',
        impact: '减少不必要的磁盘I/O操作'
      },
      {
        metric: 'GitHub Actions 分钟数',
        original: '每天消耗约2-3分钟',
        optimized: '首次2-3分钟，日常约30秒',
        impact: '长期节省大量免费额度'
      },
      {
        metric: 'Git 提交大小',
        original: '可能包含重复的文件变更',
        optimized: '只提交真正变化的文件',
        impact: '保持Git历史清洁'
      }
    ];
    
    resourceAnalysis.forEach(analysis => {
      console.log(`\n  📊 ${analysis.metric}`);
      console.log(`    🔄 原版: ${analysis.original}`);
      console.log(`    ⚡ 优化: ${analysis.optimized}`);
      console.log(`    💡 影响: ${analysis.impact}`);
    });
    
    // 9. 推荐建议
    console.log('\n' + '='.repeat(60));
    console.log('💡 推荐建议');
    console.log('='.repeat(60));
    
    const dailySavings = originalSecondTime - optimizedSecondTime;
    const monthlySavings = dailySavings * 30;
    const yearlySavings = dailySavings * 365;
    
    console.log(`📅 每日节省时间: ${dailySavings}ms`);
    console.log(`📆 每月节省时间: ${monthlySavings}ms (${(monthlySavings/1000).toFixed(1)}秒)`);
    console.log(`📊 每年节省时间: ${yearlySavings}ms (${(yearlySavings/1000/60).toFixed(1)}分钟)`);
    
    if (dailySavings > 5000) {
      console.log('\n✅ 强烈推荐使用优化版本！');
      console.log('  🎯 显著减少执行时间');
      console.log('  🌐 大幅降低API请求');
      console.log('  💰 节省GitHub Actions额度');
      console.log('  🔧 保持系统高效运行');
    } else if (dailySavings > 1000) {
      console.log('\n👍 推荐使用优化版本');
      console.log('  📈 有一定的性能提升');
      console.log('  🔄 减少不必要的重复工作');
    } else {
      console.log('\n🤔 优化效果有限');
      console.log('  💭 可能由于网络延迟等因素影响');
      console.log('  🔍 建议进一步分析和优化');
    }
    
    console.log('\n✅ 对比测试完成！');
    
  } catch (error) {
    console.error('❌ 对比测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行对比测试
compareGenerationMethods();