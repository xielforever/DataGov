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

  // Restore swallowed characters after �? or just ?
  // A swallowed character is usually a quote or a bracket.
  // We can look at the context.
  
  // If it's followed by a comma and space: `�?, ` -> `�", ` or `�', `
  // Let's just use single quote for everything inside JS objects, but if the string started with ", we should use ".
  // Actually, we can just replace `�?` with `�'` by default, and fix compilation errors later, or use regex.
  
  content = content.replace(/�\?/g, (match, offset, str) => {
    let nextChar = str[offset + 2];
    if (nextChar === ',') return "�'"; // likely a string ending in object: 'xxx',
    if (nextChar === '/') return "�<"; // likely </div
    if (nextChar === 's' && str.substr(offset + 2, 4) === 'span') return "�<"; // <span
    if (nextChar === 'd' && str.substr(offset + 2, 3) === 'div') return "�<"; // <div
    if (nextChar === ' ' && str.substr(offset + 2, 2) === ' }') return "�'"; // 'xxx' }
    if (nextChar === '}') return "�'"; // 'xxx'}
    if (nextChar === ']') return "�'"; // 'xxx']
    if (nextChar === ';') return "�'"; // 'xxx';
    if (nextChar === ':') return "�'"; // 'xxx':
    if (nextChar === '>') return "�\""; // class="xxx"> -> Wait, Chinese char in class? No, probably alt="xxx">
    return "�'"; // fallback
  });

  // Also sometimes it's just `?` without `�`? Let's check `?` followed by `/div>`
  content = content.replace(/\?\/div>/g, "�</div\>");
  content = content.replace(/\?\/span>/g, "�</span\>");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
  }
}
console.log('Fixed swallowed chars in', totalFixed, 'files');
