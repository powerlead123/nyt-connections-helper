// 检查部署状态和GitHub Actions
import fs from 'fs';
import { execSync } from 'child_process';

async function checkDeploymentStatus() {
    console.log('=== 检查部署状态 ===');
    
    // 检查本地文件状态
    console.log('\n1. 检查关键文件的最后修改时间:');
    
    const keyFiles = [
        'functions/api/today.js',
        'functions/api/refresh.js', 
        'functions/scheduled.js',
        'index.html'
    ];
    
    keyFiles.forEach(file => {
        try {
            const stats = fs.statSync(file);
            console.log(`${file}: ${stats.mtime.toISOString()}`);
        } catch (error) {
            console.log(`${file}: 文件不存在`);
        }
    });
    
    // 检查当前解析逻辑
    console.log('\n2. 检查当前解析逻辑:');
    try {
        const todayJs = fs.readFileSync('functions/api/today.js', 'utf8');
        
        // 查找解析函数
        const parseMatch = todayJs.match(/function parseConnections\(html\)[^}]+}/s);
        if (parseMatch) {
            console.log('找到解析函数:');
            console.log(parseMatch[0]);
        } else {
            console.log('未找到parseConnections函数');
        }
        
    } catch (error) {
        console.log('读取today.js失败:', error.message);
    }
    
    // 检查git状态
    console.log('\n3. 检查Git状态:');
    
    try {
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
        if (gitStatus.trim()) {
            console.log('未提交的更改:');
            console.log(gitStatus);
        } else {
            console.log('工作目录干净');
        }
        
        const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' });
        console.log('最后提交:', lastCommit.trim());
        
    } catch (error) {
        console.log('Git检查失败:', error.message);
    }
}

checkDeploymentStatus();