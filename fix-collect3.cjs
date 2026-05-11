const fs = require('fs');
let txt = fs.readFileSync('src/pages/MetadataCollect.tsx', 'utf8');
txt = txt.replace(/duration: '\d+, status: '(success|failed)'/g, "duration: '3分5秒', status: '$1'");
fs.writeFileSync('src/pages/MetadataCollect.tsx', txt, 'utf8');