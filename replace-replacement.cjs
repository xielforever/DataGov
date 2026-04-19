const fs = require('fs');
const path = './src/pages/MetadataQuery.tsx';
let content = fs.readFileSync(path, 'utf8');

// 先读取内容查看所有包含 65533 字符的位置
const badChar = String.fromCharCode(65533);
let result = '';

// 创建一个映射，修复常见的被截断的词
const replacements = {
  ['业务' + badChar]: '业务域',
  ['负责' + badChar]: '负责人',
  ['所属部' + badChar]: '所属部门',
  ['认证状' + badChar]: '认证状态',
  ['已认' + badChar]: '已认证',
  ['待认' + badChar]: '待认证',
  ['标准与规' + badChar]: '标准与规范',
  [badChar + "'7 日团队搜索热度指" + badChar + "'"]: '近7 日团队搜索热度指数'
};

// 多次替换直到没有更多匹配
let changed;
do {
  changed = false;
  for (const [from, to] of Object.entries(replacements)) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
      console.log(`Replaced "${from}" with "${to}"`);
    }
  }
} while (changed);

fs.writeFileSync(path, content);
console.log("修复完成！");
