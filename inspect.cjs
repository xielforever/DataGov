const fs = require('fs');
const path = './src/pages/MetadataQuery.tsx';
let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');

// 输出需要修复的几行的字符编码
console.log('--- 第 826 行 (索引 825) ---');
if (lines[825]) {
  for (let i = 0; i < lines[825].length; i++) {
    console.log(`  ${i}: '${lines[825][i]}' (charCode: ${lines[825].charCodeAt(i)})`);
  }
}

console.log('\n--- 第 837 行 (索引 836) ---');
if (lines[836]) {
  for (let i = 0; i < lines[836].length; i++) {
    console.log(`  ${i}: '${lines[836][i]}' (charCode: ${lines[836].charCodeAt(i)})`);
  }
}

console.log('\n--- 第 879 行 (索引 878) ---');
if (lines[878]) {
  for (let i = 0; i < lines[878].length; i++) {
    console.log(`  ${i}: '${lines[878][i]}' (charCode: ${lines[878].charCodeAt(i)})`);
  }
}
