const fs = require('fs');
const path = './src/pages/MetadataQuery.tsx';
let content = fs.readFileSync(path, 'utf8');

// 逐行修复，先读取然后替换
let lines = content.split('\n');

// 修复第 826 行 (数组索引从 0 开始)
if (lines[825]) {
  lines[825] = lines[825].replace(/�'7 日团队搜索热度指�'/, '近7 日团队搜索热度指数');
}

// 修复第 837 行
if (lines[836]) {
  lines[836] = lines[836].replace(/业务�/, '业务域');
}

// 修复第 840 行
if (lines[839]) {
  lines[839] = lines[839].replace(/负责�/, '负责人');
}

// 修复第 841 行
if (lines[840]) {
  lines[840] = lines[840].replace(/所属部�/, '所属部门');
}

// 修复第 844 行
if (lines[843]) {
  lines[843] = lines[843].replace(/认证状�/, '认证状态').replace(/已认�/, '已认证').replace(/待认�/, '待认证');
}

// 修复第 879 行
if (lines[878]) {
  lines[878] = lines[878].replace(/标准与规�/, '标准与规范');
}

// 写回文件
content = lines.join('\n');
fs.writeFileSync(path, content);
console.log('修复完成！');
