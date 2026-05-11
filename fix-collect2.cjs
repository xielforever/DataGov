const fs = require('fs');
let txt = fs.readFileSync('src/pages/MetadataCollect.tsx', 'utf8');
txt = txt.replace(/财务系统元数据采, dataSource/g, "财务系统元数据采集', dataSource");
txt = txt.replace(/duration: '52, status: 'success'/g, "duration: '5分2秒', status: 'success'");
fs.writeFileSync('src/pages/MetadataCollect.tsx', txt, 'utf8');
