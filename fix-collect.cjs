// Fix all truncated strings in MetadataCollect.tsx
const fs = require('fs');
const path = '/home/xielei/DataGov/src/pages/MetadataCollect.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix all truncated strings
const fixes = [
  // Line 10 - comment
  ["全库', scope: '指定表', scopeDetail: string;", "全库 / 指定表 / 指定库 */\n  scopeDetail: string;"],
  // Line 16 - comment
  ["scope: '采集范围：全库', collectType: 'full' | 'incremental';", "scope: '采集范围：全库 / 指定表 / 指定库',\n  collectType: 'full' | 'incremental';"],
  // Line 18 - comment
  ["duration: string; tableCount: number; fieldCount: number; progress?: number; // 0-100，仅运行中任务 owner: string;", "duration: string;\n  tableCount: number;\n  fieldCount: number;\n  progress?: number; // 0-100，仅运行中任务\n  owner: string;"],
  // Line 168
  ["开始采prod-mysql-trade", "开始采集 prod-mysql-trade"],
  // Line 169
  ["版MySQL 8.0.32", "版本 MySQL 8.0.32"],
  // Line 176
  ["已注", "已注释)"],
  // Line 180
  ["已完28/42", "已完成 28/42"],
  // Line 188
  ["新字risk_v3_score", "新字段 risk_v3_score"],
  // Line 190
  ["已完32/42", "已完成 32/42"],
  // Line 193
  ["已完42/42", "已完成 42/42"],
  // Line 194
  ["共采42 张表, 386 个字 耗时 124秒", "共采集 42 张表, 386 个字段, 耗时 124秒"],
  // Line 254
  ["已手动触发{task.name}」", "已手动触发「{task.name}」"],
  ["{task.name}」采集完成", "「{task.name}」采集完成"],
  // Line 293
  ["{ label: '元数据管 }, { label: '元数据采 }]", "{ label: '元数据管理' }, { label: '元数据采集' }]"],
  // Line 298
  ["元数据采", "元数据采集"],
  // Line 315
  ["sub: '个任,", "sub: '个任务',"],
  // Line 316
  ["{ label: '运行, value: stats.running, sub: '个任,", "{ label: '运行中', value: stats.running, sub: '个任务',"],
  ["icon: ' },", "icon: '⚡' },"],
  // Line 317
  ["{ label: '已完,", "{ label: '已完成',"],
  ["sub: '今日成功', color: 'from-emerald-500 to-green-500', icon: ' },", "sub: '今日成功', color: 'from-emerald-500 to-green-500', icon: '✅' },"],
  // Line 318
  ["icon: ' },", "icon: '❌' },"],
  // Line 319
  ["{ label: '已暂, value: stats.paused, sub: '个任,", "{ label: '已暂停', value: stats.paused, sub: '个任务',"],
  // Line 321
  ["已采集字,", "已采集字段',"],
  // Line 370
  ["数据源", "数据源..."],
  // Line 376
  ["运行 }", "运行中' },"],
  // Line 380
  ["已暂 }", "已暂停' },"],
  // Line 481
  ["进行中 : task.duration", "进行中'} : task.duration"],
  // Line 504
  ["运行 : '立即运行", "运行中' : '立即运行'"],
  // Line 531
  ["成功,", "成功率',"],
  // Line 541
  ["最{MOCK_RECORDS.length} ", "最近 {MOCK_RECORDS.length} 条"],
  // Line 547
  ["数据,", "数据源',"],
  ["开始时,", "开始时间',"],
  ["表数/字段,", "表数/字段数',"],
  ["状", "状态',"],
  // Line 607
  ["顺序执", "顺序执行"],
  // Line 643
  ["作用于{rule.scope === 'table' ? ' : rule.scope === 'database' ? ' : '字段'}", "作用于{rule.scope === 'table' ? '表' : rule.scope === 'database' ? '数据库' : '字段'}"],
  // Line 671
  ["不区分大小", "不区分大小写"],
  ["保留配", "保留配置"],
  // Line 738
  ["字段,", "字段数',"],
  // Line 740
  ["进行中 : selectedTask.duration", "进行中'} : selectedTask.duration"],
  // Line 755
  ["已完", "已完成"],
  // Line 761
  ["数据,", "数据源',"],
  ["数据源类,", "数据源类型',"],
  // Line 773
  ["负责,", "负责人',"],
];

for (const [from, to] of fixes) {
  content = content.split(from).join(to);
}

fs.writeFileSync(path, content);
console.log('Fixed!');
