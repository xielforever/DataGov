const fs = require('fs');

// Fix MetadataModel.tsx
const modelPath = '/home/xielei/DataGov/src/pages/MetadataModel.tsx';
let modelContent = fs.readFileSync(modelPath, 'utf8');

modelContent = modelContent.replace(/个实'\{relationships\.length > 0/g, '个实体${relationships.length > 0');
modelContent = modelContent.replace(/已创建模型'\{newModel\.name\}'\{summary\}/g, '已创建模型「${newModel.name}」${summary}');
modelContent = modelContent.replace(/确定要删除模型'<span className="text-white font-medium">\{deleteTarget\.name\}<\/span>』吗'/g, '确定要删除模型「<span className="text-white font-medium">{deleteTarget.name}</span>」吗？');
modelContent = modelContent.replace(/将一并删'\{deleteTarget\.entities\.length\} 个实体和 \{deleteTarget\.relationships\.length\} 个关系，此操作不可撤销'/g, '将一并删除 ${deleteTarget.entities.length} 个实体和 ${deleteTarget.relationships.length} 个关系，此操作不可撤销。');

fs.writeFileSync(modelPath, modelContent);
console.log('Fixed MetadataModel.tsx');

// Fix MetadataQuery.tsx
const queryPath = '/home/xielei/DataGov/src/pages/MetadataQuery.tsx';
let queryContent = fs.readFileSync(queryPath, 'utf8');

queryContent = queryContent.replace(/<\/ 数据血缘"进行完整分析/g, '</span> 进行完整分析');
queryContent = queryContent.replace(/前往"数据资/g, '前往「数据资产');

fs.writeFileSync(queryPath, queryContent);
console.log('Fixed MetadataQuery.tsx');

// Fix MetadataManage.tsx import path
const managePath = '/home/xielei/DataGov/src/pages/MetadataManage.tsx';
let manageContent = fs.readFileSync(managePath, 'utf8');

manageContent = manageContent.replace(
  "from '../../services/api'",
  "from '../services/api'"
);

fs.writeFileSync(managePath, manageContent);
console.log('Fixed MetadataManage.tsx import path');

console.log('All fixes applied!');
