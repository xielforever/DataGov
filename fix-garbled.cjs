const fs = require('fs');
const path = './src/pages/MetadataQuery.tsx';
let content = fs.readFileSync(path, 'utf8');

// 修复 826 行
content = content.replace(
  /搜索热度.*?mt-2 text-xs text-slate-500.*?<\/div>/,
  '搜索热度</div><div className="mt-2 text-3xl font-semibold text-white">{selectedResult.heat}</div><div className="mt-2 text-xs text-slate-500">近7 日团队搜索热度指数</div>'
);

// 修复数组部分
content = content.replace(
  /\['业务.*?',.*?\['来源'.*?\['来源类型'.*?\['负责.*?',.*?\['所属部.*?',.*?\['更新时间'.*?\['归档路径'.*?\['认证状.*?\]/s,
  `['业务域', selectedResult.domain],
                      ['来源', selectedResult.source],
                      ['来源类型', selectedResult.sourceType],
                      ['负责人', selectedResult.owner],
                      ['所属部门', selectedResult.department],
                      ['更新时间', selectedResult.updateTime],
                      ['归档路径', selectedResult.path],
                      ['认证状态', selectedResult.certified ? '已认证' : '待认证'],`
);

// 修复 879 行
content = content.replace(
  /标准与规.*?<\/h3>/,
  '标准与规范</h3>'
);

fs.writeFileSync(path, content);
console.log('修复完成！');
