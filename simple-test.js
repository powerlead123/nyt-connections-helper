console.log('测试开始...');

const ImprovedConnectionsParser = require('./improved-parser.js');
console.log('解析器加载成功');

const parser = new ImprovedConnectionsParser();
console.log('解析器实例创建成功');

parser.fetchMashableData().then(data => {
    console.log('数据获取完成:', data ? '成功' : '失败');
    if (data) {
        console.log('答案组数:', data.groups.length);
        data.groups.forEach(group => {
            console.log(`${group.theme}: ${group.words.join(', ')}`);
        });
    }
}).catch(error => {
    console.error('错误:', error.message);
});