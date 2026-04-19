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
const badChar = String.fromCharCode(65533); // �

const dict = {
  ['数据表数' + badChar]: '数据表数',
  ['数据源管' + badChar]: '数据源管理',
  ['新建数据' + badChar]: '新建数据源',
  ['数据源类型分' + badChar]: '数据源类型分布',
  ['点击类型快速筛' + badChar]: '点击类型快速筛选',
  ['数据源类' + badChar]: '数据源类型',
  ['负责' + badChar]: '负责人',
  ['所属部' + badChar]: '所属部门',
  ['最后同' + badChar]: '最后同步',
  ['已启' + badChar]: '已启用',
  ['元数据采集任' + badChar]: '元数据采集任务',
  ['解除数据源接' + badChar]: '解除数据源接入',
  ['测试' + badChar]: '测试',
  ['浏览数据' + badChar]: '浏览数据',
  ['较上' + badChar]: '较上周',
  ['搜索' + badChar]: '搜索',
  ['状态筛' + badChar]: '状态筛选',
  ['数据源列' + badChar]: '数据源列表',
  ['排序：更新时' + badChar]: '排序：更新时间',
  ['数据' + badChar]: '数据源',
  ['状' + badChar]: '状态',
  ['订单域概念模' + badChar]: '订单域概念模型',
  ['交易' + badChar]: '交易域',
  ['订单状' + badChar]: '订单状态',
  ['用户' + badChar]: '用户域',
  ['商品主数' + badChar]: '商品主数据',
  ['被购' + badChar]: '被购买',
  ['标签体' + badChar]: '标签体系',
  ['用户基础属' + badChar]: '用户基础属性',
  ['用户代理' + badChar]: '用户代理键',
  ['年龄' + badChar]: '年龄段',
  ['所在城' + badChar]: '所在城市',
  ['停留时长(' + badChar]: '停留时长(秒)',
  ['商品域物理模' + badChar]: '商品域物理模型',
  ['品' + badChar]: '品牌',
  ['商品SPU' + badChar]: '商品SPU表',
  ['商品SKU' + badChar]: '商品SKU表',
  ['商品类目' + badChar]: '商品类目表',
  ['品牌' + badChar]: '品牌表',
  ['所属国' + badChar]: '所属国家',
  ['所属品' + badChar]: '所属品牌',
  ['请输入实体名' + badChar]: '请输入实体名称',
  ['已添加实' + badChar]: '已添加实体',
  ['已成功新建实' + badChar]: '已成功新建实体',
  ['请输入属性名' + badChar]: '请输入属性名称',
  ['已更新关' + badChar]: '已更新关系',
  ['已添加关' + badChar]: '已添加关系',
  ['导入' + badChar]: '导入',
  ['暂不支持该格' + badChar]: '暂不支持该格式',
  ['请输入模型名' + badChar]: '请输入模型名称',
  ['至少保留一个模' + badChar]: '至少保留一个模型',
  ['已删除' + badChar]: '已删除',
  ['元数据模' + badChar]: '元数据模型',
  ['实现元数据可视化建' + badChar]: '实现元数据可视化建模',
  ['添加实体或关' + badChar]: '添加实体或关系',
  ['创建一个数据实' + badChar]: '创建一个数据实体',
  ['至少需' + badChar]: '至少需要',
  ['个实' + badChar]: '个实体',
  ['需 ' + badChar]: '需要',
  ['点击工具栏' + badChar]: '点击工具栏',
  ['新增第一个实' + badChar]: '新增第一个实体',
  ['已删除实' + badChar]: '已删除实体',
  ['已移除字' + badChar]: '已移除字段',
  ['导入元数据模' + badChar]: '导入元数据模型',
  ['新建元数据模' + badChar]: '新建元数据模型',
  ['通过向导快速创建标准化的数据模' + badChar]: '通过向导快速创建标准化的数据模型',
  ['业务上下' + badChar]: '业务上下文',
  ['用于业务沟' + badChar]: '用于业务沟通',
  ['商品' + badChar]: '商品域',
  ['营销' + badChar]: '营销域',
  ['财务' + badChar]: '财务域',
  ['风控' + badChar]: '风控域',
  ['核心资产']: '核心资产',
  ['高频访问']: '高频访问',
  ['待治' + badChar]: '待治理',
  ['已认' + badChar]: '已认证',
  ['对外开' + badChar]: '对外开放',
  ['使用模板']: '使用模板',
  ['基于最佳实' + badChar]: '基于最佳实践',
  ['快' + badChar]: '快捷',
  ['选择源模' + badChar]: '选择源模型',
  ['已移除实' + badChar]: '已移除实体',
  ['才可建立关' + badChar]: '才可建立关系',
  ['已移除关' + badChar]: '已移除关系',
  ['未命名模' + badChar]: '未命名模型',
  ['实体' + badChar]: '实体数',
  ['关系' + badChar]: '关系数',
  ['继续完' + badChar]: '继续完善',
  ['上一' + badChar]: '上一步',
  ['下一' + badChar]: '下一步',
  ['实体英文' + badChar]: '实体英文名',
  ['实体中文' + badChar]: '实体中文名',
  ['简要描述实' + badChar]: '简要描述实体',
  ['归属、明' + badChar]: '归属、明细',
  [badChar + "'"]: "'",
  [badChar + '"']: '"',
  [badChar]: '',
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const [k, v] of Object.entries(dict)) {
    content = content.split(k).join(v);
  }
  
  // also fix some common cases where it has quote
  content = content.replace(/�'/g, "'");
  content = content.replace(/�"/g, '"');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
