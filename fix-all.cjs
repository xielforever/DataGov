const fs = require('fs');

// Fix MetadataCollect.tsx
const collectPath = '/home/xielei/DataGov/src/pages/MetadataCollect.tsx';
let c = fs.readFileSync(collectPath, 'utf8');

// Fix line 781
c = c.replace(/label: '数据源.*?, value: selectedTask\.dsType/g, "label: '数据源类型', value: selectedTask.dsType");

// Fix line 10 - comment
c = c.replace(/采集范围：全.*?scopeDetail/g, '采集范围：全库 / 指定表 / 指定库 */\n  scopeDetail');

// Fix line 299
c = c.replace(/管理各数据源.*?的元数据自动采集任务/g, '管理各数据源的元数据自动采集任务');

// Fix line 367
c = c.replace(/搜索任务名称或数据源.*?"/g, '搜索任务名称或数据源..."');

// Fix line 401
c = c.replace(/所有数据源.*?类型/g, '所有数据源类型');

// Fix line 900
c = c.replace(/'数据源.*?}/g, "'数据源配置'}");

// Fix line 922
c = c.replace(/数据源.*?配\*/g, '数据源配置*/');

// Fix line 995
c = c.replace(/\{ key: 'database', label: '.*?, desc: '.*? \}/g, "{ key: 'database', label: '指定数据库', desc: '选择特定数据库' }");

// Fix line 996
c = c.replace(/\{ key: 'table', label: '.*?, desc: '精确到表级别' \}/g, "{ key: 'table', label: '指定表', desc: '精确到表级别' }");

// Fix line 1052
c = c.replace(/\{ key: 'hourly', label: '.*?, icon: '⚡' \}/g, "{ key: 'hourly', label: '每小时', icon: '⚡' }");

// Fix line 1055
c = c.replace(/\{ key: 'manual', label: '.*?, icon: '👆' \}/g, "{ key: 'manual', label: '仅手动', icon: '👆' }");

// Fix line 1099
c = c.replace(/描述该采集任务的用途和背景.*?"/g, '描述该采集任务的用途和背景..."');

// Fix line 1130
c = c.replace(/'上.*?}/g, "'上一步'}");

// Fix line 1135
c = c.replace(/'请填写任务.*?, 'error'/g, "'请填写任务名称', 'error'");

// Fix line 1141
c = c.replace(/采集任务\{wizardForm\.name\}/g, '采集任务「${wizardForm.name}」');

fs.writeFileSync(collectPath, c);
console.log('Fixed MetadataCollect.tsx');

// Fix MetadataModel.tsx
const modelPath = '/home/xielei/DataGov/src/pages/MetadataModel.tsx';
let m = fs.readFileSync(modelPath, 'utf8');

// Fix line 896
m = m.replace(/, 包含 \$\{entities\.length\} 个实.*?relationships\.length > 0/g, ', 包含 ${entities.length} 个实体${relationships.length > 0');

// Fix line 898
m = m.replace(/已创建模型.*?\{newModel\.name\}.*?\{summary\}/g, '已创建模型「${newModel.name}」${summary}');

// Fix line 2454
m = m.replace(/确定要删除模型.*?\{deleteTarget\.name\}.*?吗.*?'/g, '确定要删除模型「<span className="text-white font-medium">{deleteTarget.name}</span>」吗？');

// Fix line 2456
m = m.replace(/将一并删.*?\{deleteTarget\.entities\.length\}.*?个关系，此操作不可撤销.*?'/g, '将一并删除 ${deleteTarget.entities.length} 个实体和 {deleteTarget.relationships.length} 个关系，此操作不可撤销。');

fs.writeFileSync(modelPath, m);
console.log('Fixed MetadataModel.tsx');

// Fix MetadataQuery.tsx
const queryPath = '/home/xielei/DataGov/src/pages/MetadataQuery.tsx';
let q = fs.readFileSync(queryPath, 'utf8');

// Fix line 902
q = q.replace(/如需深入查看上下游链路、字段级映射或影响分析，可前往.*?完整分析.*?'/g, '如需深入查看上下游链路、字段级映射或影响分析，可前往「数据资产」进行完整分析。');

fs.writeFileSync(queryPath, q);
console.log('Fixed MetadataQuery.tsx');

// Fix import paths
const files = [
  '/home/xielei/DataGov/src/pages/AssetOverview.tsx',
  '/home/xielei/DataGov/src/pages/DataLineage.tsx',
  '/home/xielei/DataGov/src/pages/DataCatalog.tsx',
  '/home/xielei/DataGov/src/pages/AssetRegister.tsx',
  '/home/xielei/DataGov/src/pages/MetadataManage.tsx',
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  // Fix Breadcrumb imports
  content = content.replace(/from ['"]\.\/Breadcrumb['"]/g, "from '../components/common/Breadcrumb'");
  content = content.replace(/from ['"]\.\.\/components\/Breadcrumb['"]/g, "from '../components/common/Breadcrumb'");
  // Fix api imports
  content = content.replace(/from ['"]\.\.\/\.\.\/services\/api['"]/g, "from '../services/api'");
  fs.writeFileSync(f, content);
  console.log(`Fixed imports in ${f.split('/').pop()}`);
});

console.log('All fixes applied!');
