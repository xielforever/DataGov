const fs = require('fs');
const path = './src/pages/MetadataQuery.tsx';
let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');

// 修复 837 行 (索引 836)
if (lines[836]) {
  // 找到 charCode 65533 的字符并替换
  let line = lines[836].split('');
  // 找到问题位置: 索引 31 是乱码
  if (line[31] && line[31].charCodeAt(0) === 65533) {
    // 删除多余的乱码字符
    // 修复整个数组部分，直接重写
    lines[836] = "                      ['业务域', selectedResult.domain],";
  }
}

// 修复第 840 行 (索引 839)
if (lines[839]) {
  lines[839] = "                      ['负责人', selectedResult.owner],";
}

// 修复第 841 行 (索引 840)
if (lines[840]) {
  lines[840] = "                      ['所属部门', selectedResult.department],";
}

// 修复第 844 行 (索引 843)
if (lines[843]) {
  lines[843] = "                      ['认证状态', selectedResult.certified ? '已认证' : '待认证'],";
}

content = lines.join('\n');
fs.writeFileSync(path, content);
console.log('最终修复完成！');
