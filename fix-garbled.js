const fs = require('fs');
const path = './src/pages/MetadataQuery.tsx';
let content = fs.readFileSync(path, 'utf8');

// 手动修复需要修改的具体位置
// 使用包含更多上下文的字符串匹配方式

// 修复 826 行附近
content = content.replace(
  /<div className="mt-2 text-xs text-slate-500">.*<\/div>/,
  '<div className="mt-2 text-xs text-slate-500">近7 日团队搜索热度指数</div>'
);

// 修复 837 行
content = content.replace(
  /\['业务.*?',/g,
  "['业务域',"
);

// 修复 840 行
content = content.replace(
  /\['负责.*?',/g,
  "['负责人',"
);

// 修复 841 行
content = content.replace(
  /\['所属部.*?',/g,
  "['所属部门',"
);

// 修复 844 行
content = content.replace(
  /\['认证状.*?\? '已认.*? : '待认.*?'\]/g,
  "['认证状态', selectedResult.certified ? '已认证' : '待认证']"
);

// 修复 879 行
content = content.replace(
  /<h3 className="text-sm font-semibold text-white">标准与规.*?<\/h3>/,
  '<h3 className="text-sm font-semibold text-white">标准与规范</h3>'
);

fs.writeFileSync(path, content);
console.log('修复完成！');
