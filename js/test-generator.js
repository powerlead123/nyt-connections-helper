const articleGenerator = require('./article-generator');
const fs = require('fs-extra');
const path = require('path');

// 测试用谜题数据
const testPuzzleData = {
  date: "2025-04-25",
  difficulty: "medium",
  categories: [
    {
      name: "Gum flavors",
      words: ["BUBBLEGUM", "CINNAMON", "MENTHOL", "WINTERGREEN"]
    },
    {
      name: "Starting point",
      words: ["CATALYST", "LAUNCHPAD", "SPARK", "SPRINGBOARD"]
    },
    {
      name: "Great American songbook songs",
      words: ["AUTUMN LEAVES", "SUMMERTIME", "UNFORGETTABLE", "WITCHCRAFT"]
    },
    {
      name: "__ Tube",
      words: ["FALLOPIAN", "INNER", "TEST", "VACUUM"]
    }
  ]
};

async function testGeneration() {
  try {
    // 生成HTML
    const html = articleGenerator.generateHTML(testPuzzleData);
    
    // 确保目录存在
    const outputDir = path.join(__dirname, '../articles');
    await fs.ensureDir(outputDir);
    
    // 保存文件
    const filePath = path.join(outputDir, `${testPuzzleData.date}.html`);
    await fs.writeFile(filePath, html);
    
    console.log(`测试文章已生成: ${filePath}`);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testGeneration(); 