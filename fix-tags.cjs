const fs = require('fs');

function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const dirent of dirents) {
    const res = dir + '/' + dirent.name;
    if (dirent.isDirectory()) {
      files.push(...getFiles(res));
    } else {
      if (res.endsWith('.tsx') || res.endsWith('.ts')) files.push(res);
    }
  }
  return files;
}

const files = getFiles('src/pages');
let totalFixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Fix missing < tags after corrupted characters
  content = content.replace(/(\?|�)(\/[a-zA-Z]+>|[a-zA-Z]+>)/g, "$1<$2");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
  }
}
console.log('Fixed tags in', totalFixed, 'files');
