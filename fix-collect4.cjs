const fs = require('fs');
let txt = fs.readFileSync('src/pages/MetadataCollect.tsx', 'utf8');
txt = txt.replace(/name: '排除临时, type: 'exclude'/g, "name: '排除临时表', type: 'exclude'");
txt = txt.replace(/name: '排除系统, type: 'exclude'/g, "name: '排除系统库', type: 'exclude'");
txt = txt.replace(/name: '核心表优先采, type: 'include'/g, "name: '核心表优先采集', type: 'include'");
fs.writeFileSync('src/pages/MetadataCollect.tsx', txt, 'utf8');