const fs = require('fs');
const path = './src/pages/MetadataModel.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/\{\["交易�', "用户�', "商品�', "营销�', "财务�', "风控�'\]/g, '{["交易域", "用户域", "商品域", "营销域", "财务域", "风控域"]');
c = c.replace(/\{\["核心资产", "高频访问", "待治�', "已认�', "P0", "对外开�'\]/g, '{["核心资产", "高频访问", "待治理", "已认证", "P0", "对外开放"]');
c = c.replace(/newModelTags\.includes\(tag\) " "/g, 'newModelTags.includes(tag) ? "');
c = c.replace(/从零开始手动建�", badge: "推荐"/g, '从零开始手动建模", badge: "推荐"');
c = c.replace(/基于最佳实�', badge: "快�'/g, '基于最佳实践", badge: "快捷"');

fs.writeFileSync(path, c);
