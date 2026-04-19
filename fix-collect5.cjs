const fs = require('fs');
let txt = fs.readFileSync('src/pages/MetadataCollect.tsx', 'utf8');
txt = txt.replace(/description: '不采集临时表或备份表，节省资[^']*/g, "description: '不采集临时表或备份表，节省资源'");
txt = txt.replace(/description: '不采集系统自带库，节省资[^']*/g, "description: '不采集系统自带库，节省资源'");
txt = txt.replace(/description: '数仓核心层表优先加[^']*/g, "description: '数仓核心层表优先加载'");
txt = txt.replace(/description: '敏感字段名不采[^']*/g, "description: '敏感字段名不采集'");
fs.writeFileSync('src/pages/MetadataCollect.tsx', txt, 'utf8');
