const fs = require('fs');
const path = '/home/xielei/DataGov/src/pages/MetadataQuery.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix truncated strings and garbled text
const fixes = [
  [/�'7 日团队搜索热度指�'/g, '近7日团队搜索热度指数'],
  [/'业务�'/g, "'业务域'"],
  [/'负责�'/g, "'负责人'"],
  [/'所属部�'/g, "'所属部门'"],
  [/'认证状�'/g, "'认证状态'"],
  [/'已认�'/g, "'已认证'"],
  [/'待认�'/g, "'待认证'"],
  [/'标准与规�'/g, "'标准与规范'"],
];

for (const [from, to] of fixes) {
  c = c.replace(from, to);
}

fs.writeFileSync(path, c);
console.log('Fixed MetadataQuery.tsx');
