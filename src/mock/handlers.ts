import { http, HttpResponse, passthrough } from 'msw';
import type {
  AiAssistantRequest,
  AiAssistantResponse,
  AiBehaviorEventData,
  AiCapabilityType,
  AiContextPreview,
  AiConversation,
  AiConversationMessage,
  AiFeedbackData,
  AiPreference,
  PreviewAiContextData,
  UpdateAiConversationData,
} from '../types/api';
import { 
  mockDashboardStats,
  mockDashboardRecentTables,
  mockDashboardQualityTrends,
  mockDashboardTasks,
  mockHomeGovernanceOverview,
  mockAssetCoreMetrics,
  mockAssetLayerDistribution,
  mockBusinessDomains,
  mockAssetDataSources,
  mockAssetGrowthTrend,
  mockAssetHealthMetrics,
  mockAssetHotAssets,
  mockAssetPendingItems,
  mockAssetCatalog,
  mockAssetCatalogDetails,
  buildAssetCatalogDetail,
  mockAssetRegisterOptions,
  mockMapData,
  mockAllDataSources,
  mockLineageData,
  mockMetadataQueryData,
  mockMetadataMaintainData,
  mockStandardDefinitions,
  mockStandardMappings,
  mockStandardEvalData,
  mockDataDictCategories,
  mockDataDictItems,
  mockCodeSets,
  mockCodeValues,
  mockApprovals,
  mockDevelopmentModels, 
  mockModelSyncLogs,
  mockScripts,
  mockScriptVersions,
  mockQualityRules,
  mockQualityRuleTemplates,
  mockQualityCheckBatches,
  mockQualityCheckIssues,
  mockQualityMonitorOverview,
  mockQualityMonitorTrends,
  mockQualityMonitorAlerts,
  mockQualityMonitorRuleHealth,
  mockQualityReportOverview,
  mockQualityReportTrends,
  mockQualityReportDomains,
  mockQualityReportIssues,
  mockQualityReportRemediation,
  mockQualityReports,
  mockSecurityLevelOverview,
  mockSecurityLevelDistribution,
  mockSecurityLevelRules,
  mockSecurityLevelAssets,
  mockSecurityLevelReviews,
  mockSensitiveScanOverview,
  mockSensitiveScanTasks,
  mockSensitiveScanRules,
  mockSensitiveScanFindings,
  mockDataMaskOverview,
  mockDataMaskPolicies,
  mockDataMaskRules,
  mockDataMaskValidations,
  mockAccessControlOverview,
  mockAccessControlPolicies,
  mockAccessControlApplications,
  mockAccessControlGrants,
  mockAccessControlRisks,
  mockAuditLogOverview,
  mockAuditLogEvents,
  mockAuditLogRisks,
  mockAuditLogExports,
  mockAuditLogRetentionPolicies,
  mockTaskScheduleOverview,
  mockTaskSchedules,
  mockTaskScheduleDependencies,
  mockTaskScheduleCalendars,
  mockTaskScheduleBackfills,
  mockTaskOpsOverview,
  mockTaskOpsInstances,
  mockTaskOpsLogs,
  mockTaskOpsRecoveryPlans,
  mockTaskOpsAlerts,
  mockTaskOpsQueues,
  mockUserManageOverview,
  mockSystemUsers,
  mockUserLoginPolicies,
  mockUserOrgBindings,
  mockUserRiskAccounts,
  mockRoleManageOverview,
  mockIamPermissions,
  mockIamRolePermissions,
  mockSystemRoles,
  mockRolePermissionGroups,
  mockRoleDataScopes,
  mockRoleMembers,
  mockRoleRiskItems,
  mockOrgManageOverview,
  mockSystemOrgs,
  mockOrgResponsibilityDomains,
  mockOrgStewards,
  mockOrgChangeRecords,
  mockNotificationOverview,
  mockNotificationTemplates,
  mockNotificationSubscriptions,
  mockNotificationChannels,
  mockNotificationMessages,
  mockOperationLogOverview,
  mockOperationLogEvents,
  mockOperationLogObjects,
  mockOperationLogDiffs,
  mockOperationLogExports,
  mockSystemConfigOverview,
  mockSystemConfigParams,
  mockSystemConfigIntegrations,
  mockSystemRuntimeSwitches,
  mockSystemEnvironmentPolicies,
  mockSystemConfigChanges,
  mockMetricOverview,
  mockMetrics,
  mockMetricCategories,
  mockServiceApiOverview,
  mockServiceApis,
  mockDataSharingOverview,
  mockShareAssets,
  mockSyncOverview,
  mockSyncTasks,
  mockSyncLogs,
  mockFlinkOverview,
  mockFlinkTasks,
  mockOrchestrations,
  mockDagNodes,
  mockDagRunHistory,
  mockCollectTasks,
  mockCollectRecords,
  mockCollectRules,
  mockOpsServices,
  mockOpsAlerts,
  mockDataLayers,
  mockSensitivities,
  mockTagOptions,
  mockSourceTypeOptions,
  mockDataSourceCategories,
  mockQualityDomains,
  mockStandardDomains,
  mockStandardDatabases,
  mockMetadataModels,
  mockAiCapabilities,
  mockAiConversations,
  mockAiMessages,
  mockAiPreference,
  mockAiObservability,
  mockAiTokenUsage,
  mockAiTools,
} from './data';

const businessDomainColors = [
  'bg-cyan-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const formatTimestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 16);

const aiConversations = [...mockAiConversations] as AiConversation[];
const aiConversationMessages: Record<string, AiConversationMessage[]> = {
  ai_sess_mock_script: [...mockAiMessages] as AiConversationMessage[],
};
let aiPreference = { ...mockAiPreference } as AiPreference;

const estimateAiTokens = (value: string) => Math.max(1, Math.ceil(value.trim().length / 2));

const getDataSourceCategory = (type: string) => {
  if (['MySQL', 'PostgreSQL', 'Oracle'].includes(type)) return '关系型';
  if (type === 'Hive') return '大数据';
  if (type === 'Kafka') return '消息队列';
  if (['MongoDB', 'Redis'].includes(type)) return 'NoSQL';
  if (type === 'Elasticsearch') return '搜索引擎';
  return 'OLAP';
};

const getAssetBusinessDomainSummary = () => {
  const visibleDomains = mockBusinessDomains.filter((domain) => domain.status !== 'retired' && !domain.parentId);
  const totalAssets = visibleDomains.reduce((sum, domain) => sum + domain.assetCount, 0) || 1;
  return visibleDomains.map((domain) => ({
    name: domain.name,
    count: domain.assetCount,
    percent: Number(((domain.assetCount / totalAssets) * 100).toFixed(1)),
    growth: domain.growth,
    color: domain.colorClass,
  }));
};

const aiSuggestions: Record<AiCapabilityType, string[]> = {
  'write-sql': ['把这段 SQL 改成 Hive 方言', '补充分区过滤和字段注释', '生成对应质量校验 SQL'],
  'review-sql': ['给出优化后的 SQL', '按风险等级生成整改清单', '检查是否符合数据标准'],
  'lineage-impact': ['生成发布前检查清单', '列出高风险下游任务', '解释字段变更影响面'],
  'knowledge-explain': ['用业务例子再解释一次', '生成新手培训提纲', '关联平台菜单说明'],
  'quality-rule': ['转成规则配置表', '生成异常明细查询 SQL', '补充告警阈值建议'],
  'ops-diagnosis': ['生成排查命令清单', '分析可能的上游阻塞', '沉淀为故障复盘模板'],
};

const buildAiAnswer = (body: AiAssistantRequest): AiAssistantResponse => {
  const question = body.question.trim();
  const pageTitle = body.context?.viewTitle || '当前页面';
  const pageId = body.context?.viewId || 'unknown';

  const answers: Record<AiCapabilityType, string> = {
    'write-sql': [
      '下面是一版可直接放入脚本开发页调试的统计 SQL，默认按订单明细事实表建模：',
      '',
      '```sql',
      'SELECT',
      '  dt AS biz_date,',
      '  COUNT(DISTINCT order_id) AS order_count,',
      '  COUNT(DISTINCT user_id) AS pay_user_count,',
      '  SUM(pay_amount) AS total_pay_amount',
      'FROM dwd_order_detail',
      "WHERE dt >= date_format(date_sub(current_date, 7), 'yyyy-MM-dd')",
      '  AND order_status IN (\'PAID\', \'FINISHED\')',
      'GROUP BY dt',
      'ORDER BY biz_date ASC;',
      '```',
      '',
      '建议确认三件事：订单状态口径是否包含退款订单、金额字段是否为实付金额、分区字段是否与调度周期一致。',
    ].join('\n'),
    'review-sql': [
      'SQL 分析结论：',
      '',
      '- 性能风险：`select *` 会放大全表扫描和网络传输成本，应明确字段列表。',
      '- 分区风险：如果 `dt` 是字符串分区，建议使用平台统一日期变量，避免函数包裹分区字段。',
      '- 口径风险：近 7 天需要明确是否包含当天、是否按支付时间还是下单时间统计。',
      '- 治理建议：补充责任人、业务域、输出表命名、质量校验和血缘说明。',
      '',
      '推荐改写方向：先限定分区和状态，再只选择下游需要字段，并把统计口径写入脚本说明。',
    ].join('\n'),
    'lineage-impact': [
      '血缘影响分析可以按“上游输入 -> 当前加工 -> 下游消费”三层拆解：',
      '',
      '- 上游：确认 ODS 原始表、维表、实时 Topic 是否存在延迟或字段漂移。',
      '- 当前层：检查字段映射、清洗规则、主键粒度、分区策略和质量规则是否变更。',
      '- 下游：重点关注报表、指标、服务 API、风控特征和调度依赖。',
      '- 发布门禁：字段删除/改名必须做下游订阅确认；口径调整必须同步标准与指标说明。',
      '',
      `当前上下文来自 ${pageTitle}（${pageId}），建议在数据血缘页联动查看高频访问资产。`,
    ].join('\n'),
    'knowledge-explain': [
      '可以把数据治理理解成一条“可发现、可理解、可信任、可控制”的链路：',
      '',
      '- 元数据回答“有什么”：表、字段、任务、接口、负责人、分区、更新频率。',
      '- 血缘回答“从哪来到哪去”：上游来源、加工过程、下游影响和变更半径。',
      '- 数据标准回答“应该是什么”：命名、类型、值域、业务定义和管理责任。',
      '- 质量规则回答“是否可靠”：完整性、唯一性、及时性、一致性和准确性。',
      '',
      '这几个能力组合起来，才能支撑脚本上线、资产发布、问题追踪和审计问责。',
    ].join('\n'),
    'quality-rule': [
      '建议先落三类规则：',
      '',
      '1. 主键唯一：`order_id + dt` 在同一分区内不可重复。',
      '2. 金额合法：`pay_amount >= 0`，且退款状态下允许为 0 但需单独统计。',
      '3. 分区及时：每日 T+1 07:00 前产出昨日分区，缺失或行数波动超过 30% 告警。',
      '',
      '上线前建议把规则绑定到业务域、责任人、告警渠道和整改 SLA。',
    ].join('\n'),
    'ops-diagnosis': [
      '任务延迟可以按四段排查：',
      '',
      '- 上游依赖：检查前置任务是否未完成、Kafka/Hive 分区是否未到齐。',
      '- 资源队列：查看 YARN/Flink 队列等待、并发配额和资源抢占。',
      '- 执行计划：关注大表 Join、数据倾斜、小文件过多、分区裁剪失效。',
      '- 平台调度：检查补数据、重跑、优先级、告警静默和调度日历。',
      '',
      '建议先定位“等待时间”还是“运行时间”变长，再分别进入调度依赖或执行日志。',
    ].join('\n'),
  };

  const capability = mockAiCapabilities.find((item) => item.id === body.capability);

  return {
    id: `ai-${Date.now()}`,
    title: capability?.title || 'AI 分析',
    summary: `已基于“${pageTitle}”上下文处理你的问题：${question.slice(0, 48)}${question.length > 48 ? '…' : ''}`,
    answer: answers[body.capability],
    suggestions: aiSuggestions[body.capability],
    references: [
      { label: pageTitle, type: '页面上下文' },
      { label: '数据治理知识库', type: '内置知识' },
      { label: '平台 Mock 元数据', type: '模拟数据' },
    ],
    createdAt: formatTimestamp(),
    confidence: 0.86,
    tokenUsage: {
      model: 'MiniMax-M3',
      inputTokens: estimateAiTokens(`${pageTitle}\n${question}`),
      outputTokens: estimateAiTokens(answers[body.capability]),
      totalTokens: estimateAiTokens(`${pageTitle}\n${question}`) + estimateAiTokens(answers[body.capability]),
      latencyMs: 640,
    },
    contextPreview: buildAiContextPreview({
      capability: body.capability,
      question: body.question,
      conversationId: 'ai_sess_mock_inline',
      context: body.context,
    }),
    toolCalls: buildAiToolCalls(body.capability, question),
  };
};

const buildAiContextPreview = (body: PreviewAiContextData): AiContextPreview => {
  const pageTitle = body.context?.viewTitle || '当前页面';
  const blocks = [
    {
      id: 'page',
      type: 'page',
      title: '当前页面',
      content: `页面：${pageTitle}\nURL：${body.context?.url || '-'}`,
      priority: 100,
      tokenEstimate: estimateAiTokens(`${pageTitle}\n${body.context?.url || ''}`),
      included: true,
    },
    {
      id: 'user-preference',
      type: 'preference',
      title: '用户偏好',
      content: `回答风格：${aiPreference.answerStyle}\n默认 SQL 方言：${aiPreference.sqlDialect}`,
      priority: 70,
      tokenEstimate: estimateAiTokens(`${aiPreference.answerStyle}\n${aiPreference.sqlDialect}`),
      included: aiPreference.memoryEnabled,
    },
    {
      id: 'question-intent',
      type: 'intent',
      title: '用户问题摘要',
      content: body.question || '等待输入问题',
      priority: 100,
      tokenEstimate: estimateAiTokens(body.question || '等待输入问题'),
      included: true,
    },
  ];
  const totalTokens = blocks.filter((block) => block.included).reduce((sum, block) => sum + block.tokenEstimate, 0);
  return {
    blocks,
    totalTokens,
    budgetTokens: 6000,
    redactionHits: 0,
    truncated: false,
    strategy: 'MSW 兜底：页面上下文 + 用户偏好 + 问题摘要。',
    conversationId: body.conversationId,
    userMemoryUsed: aiPreference.memoryEnabled,
    capabilityTitle: mockAiCapabilities.find((item) => item.id === body.capability)?.title,
  };
};

const buildAiToolCalls = (capability: AiCapabilityType, question: string) => {
  if (capability === 'review-sql') {
    return [{ toolName: 'development.getScript', args: { source: 'msw' }, resultSummary: 'MSW 已提供当前脚本摘要。', status: 'succeeded', latencyMs: 12 }];
  }
  if (capability === 'lineage-impact') {
    return [{ toolName: 'lineage.getImpactSummary', args: { query: question.slice(0, 80) }, resultSummary: 'MSW 已模拟上游 raw.ods_order 与下游 ads_sales_report 影响摘要。', status: 'succeeded', latencyMs: 14 }];
  }
  if (capability === 'quality-rule') {
    return [{ toolName: 'quality.searchRules', args: { source: 'msw' }, resultSummary: 'MSW 已读取质量规则模板摘要。', status: 'succeeded', latencyMs: 10 }];
  }
  return [];
};

export const handlers = [
  // Health check
  http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok' })),

  // AI Assistant
  http.get('/api/v1/ai/capabilities', () => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockAiCapabilities });
  }),
  http.post('/api/v1/ai/assistant/messages', async ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const body = await request.json() as AiAssistantRequest;
    return HttpResponse.json({ code: 0, data: buildAiAnswer(body) });
  }),
  http.get('/api/v1/ai/conversations', ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const data = aiConversations
      .filter((item) => includeArchived || !item.archivedAt)
      .filter((item) => !search || item.title.toLowerCase().includes(search))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.lastMessageAt.localeCompare(a.lastMessageAt));
    return HttpResponse.json({ code: 0, data });
  }),
  http.post('/api/v1/ai/conversations', async ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const body = await request.json() as { title?: string; context?: AiConversation['context'] };
    const conversation: AiConversation = {
      id: `ai_sess_msw_${Date.now()}`,
      title: body.title || body.context?.viewTitle || 'AI 会话',
      status: 'active',
      sourceViewId: body.context?.viewId || 'unknown',
      sourceUrl: body.context?.url || '',
      favorite: false,
      messageCount: 0,
      lastMessageAt: formatTimestamp(),
      context: body.context || { viewId: 'unknown', viewTitle: '当前页面', url: '' },
    };
    aiConversations.unshift(conversation);
    aiConversationMessages[conversation.id] = [];
    return HttpResponse.json({ code: 0, data: conversation });
  }),
  http.get('/api/v1/ai/conversations/:id', ({ params }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const id = String(params.id);
    const conversation = aiConversations.find((item) => item.id === id);
    if (!conversation) return HttpResponse.json({ code: 404, message: 'AI 会话不存在' }, { status: 404 });
    return HttpResponse.json({ code: 0, data: { conversation, messages: aiConversationMessages[id] || [] } });
  }),
  http.patch('/api/v1/ai/conversations/:id', async ({ params, request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const id = String(params.id);
    const body = await request.json() as UpdateAiConversationData;
    const index = aiConversations.findIndex((item) => item.id === id);
    if (index < 0) return HttpResponse.json({ code: 404, message: 'AI 会话不存在' }, { status: 404 });
    aiConversations[index] = {
      ...aiConversations[index],
      title: body.title ?? aiConversations[index].title,
      favorite: body.favorite ?? aiConversations[index].favorite,
      status: body.archived ? 'archived' : body.status || aiConversations[index].status,
      archivedAt: body.archived ? formatTimestamp() : body.archived === false ? undefined : aiConversations[index].archivedAt,
    };
    return HttpResponse.json({ code: 0, data: aiConversations[index] });
  }),
  http.post('/api/v1/ai/conversations/:id/messages', async ({ params, request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const conversationId = String(params.id);
    const body = await request.json() as AiAssistantRequest;
    const conversation = aiConversations.find((item) => item.id === conversationId);
    if (!conversation) return HttpResponse.json({ code: 404, message: 'AI 会话不存在' }, { status: 404 });
    const answer = buildAiAnswer(body);
    answer.conversationId = conversationId;
    const createdAt = formatTimestamp();
    const userMessage: AiConversationMessage = {
      id: `${answer.id}-user`,
      role: 'user',
      capability: body.capability,
      content: body.question,
      createdAt,
      status: 'succeeded',
    };
    const assistantMessage: AiConversationMessage = {
      id: answer.id,
      role: 'assistant',
      capability: body.capability,
      content: answer.answer,
      summary: answer.summary,
      suggestions: answer.suggestions,
      references: answer.references,
      tokenUsage: answer.tokenUsage,
      createdAt,
      status: 'succeeded',
    };
    aiConversationMessages[conversationId] = [...(aiConversationMessages[conversationId] || []), userMessage, assistantMessage];
    conversation.messageCount = aiConversationMessages[conversationId].length;
    conversation.lastMessageAt = createdAt;
    return HttpResponse.json({ code: 0, data: answer });
  }),
  http.post('/api/v1/ai/messages/:id/regenerate', ({ params }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const messageId = String(params.id);
    const conversationId = Object.keys(aiConversationMessages).find((id) => aiConversationMessages[id].some((message) => message.id === messageId));
    const conversation = aiConversations.find((item) => item.id === conversationId) || aiConversations[0];
    const answer = buildAiAnswer({
      capability: 'review-sql',
      question: '请重新生成上一次分析，并给出更明确的执行建议。',
      context: conversation.context,
    });
    answer.conversationId = conversation.id;
    return HttpResponse.json({ code: 0, data: answer });
  }),
  http.post('/api/v1/ai/messages/:id/feedback', async ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    await request.json() as AiFeedbackData;
    return HttpResponse.json({ code: 0, data: { success: true } });
  }),
  http.post('/api/v1/ai/behavior-events', async ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    await request.json() as AiBehaviorEventData;
    return HttpResponse.json({ code: 0, data: { success: true } });
  }),
  http.get('/api/v1/ai/preferences', () => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: aiPreference });
  }),
  http.put('/api/v1/ai/preferences', async ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const body = await request.json() as AiPreference;
    aiPreference = { ...aiPreference, ...body, updatedAt: formatTimestamp() };
    return HttpResponse.json({ code: 0, data: aiPreference });
  }),
  http.post('/api/v1/ai/context/preview', async ({ request }) => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    const body = await request.json() as PreviewAiContextData;
    return HttpResponse.json({ code: 0, data: buildAiContextPreview(body) });
  }),
  http.get('/api/v1/ai/token-usage', () => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockAiTokenUsage });
  }),
  http.get('/api/v1/ai/tools', () => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockAiTools });
  }),
  http.get('/api/v1/ai/observability', () => {
    if (import.meta.env.VITE_REAL_AI_ASSISTANT !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockAiObservability });
  }),

  // Home endpoints
  http.get('/api/v1/home/governance-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockHomeGovernanceOverview
    });
  }),

  // Dashboard endpoints
  http.get('/api/v1/dashboard/stats', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDashboardStats
    });
  }),
  
  http.get('/api/v1/dashboard/recent-tables', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDashboardRecentTables
    });
  }),

  http.get('/api/v1/dashboard/quality-trends', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDashboardQualityTrends
    });
  }),

  http.get('/api/v1/dashboard/tasks', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDashboardTasks
    });
  }),

  // Data Quality endpoints
  http.get('/api/v1/quality/rules', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityRules
    });
  }),
  http.post('/api/v1/quality/rules', async ({ request }) => {
    const data = await request.json();
    const newRule = {
      ...data as object,
      id: `qr-${Date.now()}`,
      status: 'draft',
      lastRun: '-',
      passRate: 0,
      issueCount: 0,
      boundObjects: 0,
    };
    mockQualityRules.unshift(newRule as any);
    return HttpResponse.json({ code: 0, data: newRule });
  }),
  http.post('/api/v1/quality/rules/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockQualityRules.findIndex(rule => rule.id === id);
    if (index > -1) {
      mockQualityRules[index] = { ...mockQualityRules[index], status };
      return HttpResponse.json({ code: 0, data: mockQualityRules[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Quality rule not found' }, { status: 404 });
  }),
  http.get('/api/v1/quality/rule-templates', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityRuleTemplates
    });
  }),
  http.get('/api/v1/quality/check-batches', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityCheckBatches
    });
  }),
  http.post('/api/v1/quality/check-batches', async ({ request }) => {
    const data = await request.json() as any;
    const newBatch = {
      ...data,
      id: `qc-${Date.now()}`,
      triggerType: '手动触发',
      status: 'running',
      tableCount: data.tableCount ?? 0,
      issueCount: 0,
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      endTime: '-',
      duration: '运行中',
      passRate: 0,
    };
    mockQualityCheckBatches.unshift(newBatch);
    return HttpResponse.json({ code: 0, data: newBatch });
  }),
  http.get('/api/v1/quality/check-issues', ({ request }) => {
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batchId');
    return HttpResponse.json({
      code: 0,
      data: batchId ? mockQualityCheckIssues.filter(issue => issue.batchId === batchId) : mockQualityCheckIssues
    });
  }),
  http.post('/api/v1/quality/check-issues/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockQualityCheckIssues.findIndex(issue => issue.id === id);
    if (index > -1) {
      mockQualityCheckIssues[index] = { ...mockQualityCheckIssues[index], status };
      return HttpResponse.json({ code: 0, data: mockQualityCheckIssues[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Quality issue not found' }, { status: 404 });
  }),
  http.get('/api/v1/quality/monitor-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityMonitorOverview
    });
  }),
  http.get('/api/v1/quality/monitor-trends', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityMonitorTrends
    });
  }),
  http.get('/api/v1/quality/monitor-alerts', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityMonitorAlerts
    });
  }),
  http.post('/api/v1/quality/monitor-alerts/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockQualityMonitorAlerts.findIndex(alert => alert.id === id);
    if (index > -1) {
      mockQualityMonitorAlerts[index] = {
        ...mockQualityMonitorAlerts[index],
        status,
        lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      return HttpResponse.json({ code: 0, data: mockQualityMonitorAlerts[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Quality alert not found' }, { status: 404 });
  }),
  http.get('/api/v1/quality/monitor-rule-health', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityMonitorRuleHealth
    });
  }),
  http.get('/api/v1/quality/report-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityReportOverview
    });
  }),
  http.get('/api/v1/quality/report-trends', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityReportTrends
    });
  }),
  http.get('/api/v1/quality/report-domains', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityReportDomains
    });
  }),
  http.get('/api/v1/quality/report-issues', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityReportIssues
    });
  }),
  http.get('/api/v1/quality/report-remediation', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityReportRemediation
    });
  }),
  http.get('/api/v1/quality/reports', () => {
    return HttpResponse.json({
      code: 0,
      data: mockQualityReports
    });
  }),
  http.post('/api/v1/quality/reports', async ({ request }) => {
    const data = await request.json() as any;
    const periodType = data.periodType ?? 'week';
    const scope = data.scope ?? '全域';
    const today = new Date().toISOString().slice(0, 10);
    const newReport = {
      id: `qrp-${Date.now()}`,
      name: `${scope}数据质量${periodType === 'day' ? '日报' : periodType === 'month' ? '月报' : '周报'}`,
      periodType,
      period: today,
      scope,
      score: mockQualityReportOverview.score,
      issueCount: mockQualityReportOverview.totalIssues,
      resolvedRate: Number(((mockQualityReportOverview.resolvedIssues / mockQualityReportOverview.totalIssues) * 100).toFixed(1)),
      creator: '当前用户',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'generating',
    };
    mockQualityReports.unshift(newReport as any);
    return HttpResponse.json({ code: 0, data: newReport });
  }),
  http.post('/api/v1/quality/reports/:id/export', ({ params }) => {
    return HttpResponse.json({
      code: 0,
      data: {
        id: params.id,
        url: `/downloads/${params.id}.pdf`
      }
    });
  }),

  // Data Security endpoints
  http.get('/api/v1/security/level-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSecurityLevelOverview
    });
  }),
  http.get('/api/v1/security/level-distribution', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSecurityLevelDistribution
    });
  }),
  http.get('/api/v1/security/level-rules', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSecurityLevelRules
    });
  }),
  http.get('/api/v1/security/level-assets', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSecurityLevelAssets
    });
  }),
  http.get('/api/v1/security/level-reviews', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSecurityLevelReviews
    });
  }),
  http.post('/api/v1/security/level-reviews/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSecurityLevelReviews.findIndex(review => review.id === id);
    if (index > -1) {
      mockSecurityLevelReviews[index] = {
        ...mockSecurityLevelReviews[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSecurityLevelReviews[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Security level review not found' }, { status: 404 });
  }),
  http.get('/api/v1/security/sensitive-scan-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSensitiveScanOverview
    });
  }),
  http.get('/api/v1/security/sensitive-scan-tasks', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSensitiveScanTasks
    });
  }),
  http.post('/api/v1/security/sensitive-scan-tasks', async ({ request }) => {
    const data = await request.json() as any;
    const newTask = {
      id: `sst-${Date.now()}`,
      name: `${data.scope ?? '全域资产'}敏感数据扫描`,
      scope: data.scope ?? '全域资产',
      status: 'running',
      progress: 0,
      assetCount: 0,
      findingCount: 0,
      owner: data.owner ?? '当前用户',
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      duration: '运行中',
    };
    mockSensitiveScanTasks.unshift(newTask as any);
    return HttpResponse.json({ code: 0, data: newTask });
  }),
  http.get('/api/v1/security/sensitive-scan-rules', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSensitiveScanRules
    });
  }),
  http.get('/api/v1/security/sensitive-scan-findings', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSensitiveScanFindings
    });
  }),
  http.post('/api/v1/security/sensitive-scan-findings/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSensitiveScanFindings.findIndex(finding => finding.id === id);
    if (index > -1) {
      mockSensitiveScanFindings[index] = {
        ...mockSensitiveScanFindings[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSensitiveScanFindings[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Sensitive finding not found' }, { status: 404 });
  }),
  http.get('/api/v1/security/data-mask-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDataMaskOverview
    });
  }),
  http.get('/api/v1/security/data-mask-policies', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDataMaskPolicies
    });
  }),
  http.post('/api/v1/security/data-mask-policies/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockDataMaskPolicies.findIndex(policy => policy.id === id);
    if (index > -1) {
      mockDataMaskPolicies[index] = {
        ...mockDataMaskPolicies[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockDataMaskPolicies[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Data mask policy not found' }, { status: 404 });
  }),
  http.get('/api/v1/security/data-mask-rules', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDataMaskRules
    });
  }),
  http.get('/api/v1/security/data-mask-validations', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDataMaskValidations
    });
  }),
  http.get('/api/v1/security/access-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAccessControlOverview
    });
  }),
  http.get('/api/v1/security/access-policies', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAccessControlPolicies
    });
  }),
  http.get('/api/v1/security/access-applications', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAccessControlApplications
    });
  }),
  http.post('/api/v1/security/access-applications/:id/process', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { action } = await request.json() as any;
    const index = mockAccessControlApplications.findIndex(application => application.id === id);
    if (index > -1) {
      mockAccessControlApplications[index] = {
        ...mockAccessControlApplications[index],
        status: action === 'approve' ? 'approved' : 'rejected'
      };
      return HttpResponse.json({ code: 0, data: mockAccessControlApplications[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Access application not found' }, { status: 404 });
  }),
  http.get('/api/v1/security/access-grants', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAccessControlGrants
    });
  }),
  http.post('/api/v1/security/access-grants/:id/revoke', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockAccessControlGrants.findIndex(grant => grant.id === id);
    if (index > -1) {
      mockAccessControlGrants[index] = {
        ...mockAccessControlGrants[index],
        status: 'revoked'
      };
      return HttpResponse.json({ code: 0, data: mockAccessControlGrants[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Access grant not found' }, { status: 404 });
  }),
  http.get('/api/v1/security/access-risks', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAccessControlRisks
    });
  }),
  http.get('/api/v1/security/audit-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAuditLogOverview
    });
  }),
  http.get('/api/v1/security/audit-events', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const result = url.searchParams.get('result') ?? 'all';
    const risk = url.searchParams.get('risk') ?? 'all';
    const events = mockAuditLogEvents.filter(event => {
      if (result !== 'all' && event.result !== result) return false;
      if (risk !== 'all' && event.risk !== risk) return false;
      if (keyword) {
        const text = `${event.actor} ${event.department} ${event.action} ${event.objectName} ${event.source} ${event.traceId}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: events
    });
  }),
  http.get('/api/v1/security/audit-risks', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAuditLogRisks
    });
  }),
  http.post('/api/v1/security/audit-risks/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockAuditLogRisks.findIndex(risk => risk.id === id);
    if (index > -1) {
      mockAuditLogRisks[index] = {
        ...mockAuditLogRisks[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockAuditLogRisks[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Audit risk not found' }, { status: 404 });
  }),
  http.get('/api/v1/security/audit-exports', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAuditLogExports
    });
  }),
  http.post('/api/v1/security/audit-exports', async ({ request }) => {
    const data = await request.json() as any;
    const newExport = {
      id: `alx-${Date.now()}`,
      name: data.name || '审计日志导出',
      scope: data.scope || '自定义检索范围',
      requester: data.requester || '安全合规组',
      format: data.format || 'CSV',
      status: 'running',
      createdAt: '2026-05-10 14:00',
      expiresAt: '-'
    };
    mockAuditLogExports.unshift(newExport);
    return HttpResponse.json({ code: 0, data: newExport });
  }),
  http.get('/api/v1/security/audit-retention-policies', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAuditLogRetentionPolicies
    });
  }),
  http.get('/api/v1/development/task-schedule-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskScheduleOverview
    });
  }),
  http.get('/api/v1/development/task-schedules', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const cycle = url.searchParams.get('cycle') ?? 'all';
    const schedules = mockTaskSchedules.filter(schedule => {
      if (status !== 'all' && schedule.status !== status) return false;
      if (cycle !== 'all' && schedule.cycle !== cycle) return false;
      if (keyword) {
        const text = `${schedule.name} ${schedule.taskCode} ${schedule.owner} ${schedule.domain} ${schedule.taskType}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: schedules
    });
  }),
  http.post('/api/v1/development/task-schedules/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockTaskSchedules.findIndex(schedule => schedule.id === id);
    if (index > -1) {
      mockTaskSchedules[index] = {
        ...mockTaskSchedules[index],
        status,
        nextRunTime: status === 'paused' ? '-' : mockTaskSchedules[index].nextRunTime
      };
      return HttpResponse.json({ code: 0, data: mockTaskSchedules[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task schedule not found' }, { status: 404 });
  }),
  http.post('/api/v1/development/task-schedules/:id/run', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockTaskSchedules.findIndex(schedule => schedule.id === id);
    if (index > -1) {
      mockTaskSchedules[index] = {
        ...mockTaskSchedules[index],
        lastRunStatus: 'running'
      };
      return HttpResponse.json({ code: 0, data: mockTaskSchedules[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task schedule not found' }, { status: 404 });
  }),
  http.get('/api/v1/development/task-schedule-dependencies', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskScheduleDependencies
    });
  }),
  http.get('/api/v1/development/task-schedule-calendars', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskScheduleCalendars
    });
  }),
  http.get('/api/v1/development/task-schedule-backfills', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskScheduleBackfills
    });
  }),
  http.post('/api/v1/development/task-schedule-backfills', async ({ request }) => {
    const data = await request.json() as any;
    const newBackfill = {
      id: `tb-${Date.now()}`,
      taskName: data.taskName || '自定义补数任务',
      bizRange: data.bizRange || '当前业务日期',
      status: 'waiting',
      progress: 0,
      requester: data.requester || '当前用户',
      strategy: data.strategy || '按日串行补数',
      createdAt: '2026-05-10 14:30'
    };
    mockTaskScheduleBackfills.unshift(newBackfill);
    return HttpResponse.json({ code: 0, data: newBackfill });
  }),
  http.get('/api/v1/development/task-ops-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskOpsOverview
    });
  }),
  http.get('/api/v1/development/task-ops-instances', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const instances = mockTaskOpsInstances.filter(instance => {
      if (status !== 'all' && instance.status !== status) return false;
      if (keyword) {
        const text = `${instance.taskName} ${instance.instanceId} ${instance.owner} ${instance.resourceGroup}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: instances
    });
  }),
  http.post('/api/v1/development/task-ops-instances/:id/rerun', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockTaskOpsInstances.findIndex(instance => instance.id === id);
    if (index > -1) {
      mockTaskOpsInstances[index] = {
        ...mockTaskOpsInstances[index],
        status: 'running',
        retryCount: mockTaskOpsInstances[index].retryCount + 1,
        startTime: '2026-05-10 14:45',
        endTime: '-',
        duration: '运行中',
        errorMessage: ''
      };
      return HttpResponse.json({ code: 0, data: mockTaskOpsInstances[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task instance not found' }, { status: 404 });
  }),
  http.post('/api/v1/development/task-ops-instances/:id/stop', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockTaskOpsInstances.findIndex(instance => instance.id === id);
    if (index > -1) {
      mockTaskOpsInstances[index] = {
        ...mockTaskOpsInstances[index],
        status: 'failed',
        endTime: '2026-05-10 14:45',
        duration: '人工终止',
        errorMessage: '实例已由运维人员人工终止。'
      };
      return HttpResponse.json({ code: 0, data: mockTaskOpsInstances[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task instance not found' }, { status: 404 });
  }),
  http.get('/api/v1/development/task-ops-logs', ({ request }) => {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get('instanceId');
    const logs = instanceId ? mockTaskOpsLogs.filter(log => log.instanceId === instanceId) : mockTaskOpsLogs;
    return HttpResponse.json({
      code: 0,
      data: logs
    });
  }),
  http.get('/api/v1/development/task-ops-recovery-plans', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskOpsRecoveryPlans
    });
  }),
  http.post('/api/v1/development/task-ops-recovery-plans/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockTaskOpsRecoveryPlans.findIndex(plan => plan.id === id);
    if (index > -1) {
      mockTaskOpsRecoveryPlans[index] = {
        ...mockTaskOpsRecoveryPlans[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockTaskOpsRecoveryPlans[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Recovery plan not found' }, { status: 404 });
  }),
  http.get('/api/v1/development/task-ops-alerts', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskOpsAlerts
    });
  }),
  http.post('/api/v1/development/task-ops-alerts/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockTaskOpsAlerts.findIndex(alert => alert.id === id);
    if (index > -1) {
      mockTaskOpsAlerts[index] = {
        ...mockTaskOpsAlerts[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockTaskOpsAlerts[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task alert not found' }, { status: 404 });
  }),
  http.get('/api/v1/development/task-ops-queues', () => {
    return HttpResponse.json({
      code: 0,
      data: mockTaskOpsQueues
    });
  }),
  http.get('/api/v1/iam/permissions', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockIamPermissions });
  }),
  http.get('/api/v1/iam/roles/:id/permissions', ({ params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    return HttpResponse.json({ code: 0, data: mockIamRolePermissions[id] ?? [] });
  }),
  http.put('/api/v1/iam/roles/:id/permissions', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const body = await request.json() as { permissions?: string[] };
    const nextPermissions = [...new Set(body.permissions ?? [])].sort();
    mockIamRolePermissions[id] = id === 'role-001' && !nextPermissions.includes('platform:*')
      ? ['platform:*', ...nextPermissions].sort()
      : nextPermissions;
    return HttpResponse.json({ code: 0, data: mockIamRolePermissions[id] });
  }),
  http.get('/api/v1/system/user-overview', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockUserManageOverview
    });
  }),
  http.get('/api/v1/system/users', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const users = mockSystemUsers.filter(user => {
      if (status !== 'all' && user.status !== status) return false;
      if (keyword) {
        const text = `${user.name} ${user.username} ${user.department} ${user.role} ${user.ownerDomain}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: users
    });
  }),
  http.post('/api/v1/system/users/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSystemUsers.findIndex(user => user.id === id);
    if (index > -1) {
      mockSystemUsers[index] = {
        ...mockSystemUsers[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSystemUsers[index] });
    }
    return HttpResponse.json({ code: 404, message: 'User not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/user-login-policies', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockUserLoginPolicies
    });
  }),
  http.get('/api/v1/system/user-org-bindings', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockUserOrgBindings
    });
  }),
  http.get('/api/v1/system/user-risk-accounts', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockUserRiskAccounts
    });
  }),
  http.post('/api/v1/system/user-risk-accounts/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockUserRiskAccounts.findIndex(risk => risk.id === id);
    if (index > -1) {
      mockUserRiskAccounts[index] = {
        ...mockUserRiskAccounts[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockUserRiskAccounts[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Risk account not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/role-overview', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockRoleManageOverview
    });
  }),
  http.get('/api/v1/system/roles', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const roles = mockSystemRoles.filter(role => {
      if (status !== 'all' && role.status !== status) return false;
      if (keyword) {
        const text = `${role.name} ${role.code} ${role.owner} ${role.dataScope} ${role.type}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: roles
    });
  }),
  http.post('/api/v1/system/roles/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSystemRoles.findIndex(role => role.id === id);
    if (index > -1) {
      mockSystemRoles[index] = {
        ...mockSystemRoles[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSystemRoles[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Role not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/role-permission-groups', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const roleId = new URL(request.url).searchParams.get('roleId');
    return HttpResponse.json({
      code: 0,
      data: roleId ? mockRolePermissionGroups.filter(group => group.roleId === roleId) : mockRolePermissionGroups
    });
  }),
  http.get('/api/v1/system/role-data-scopes', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const roleId = new URL(request.url).searchParams.get('roleId');
    return HttpResponse.json({
      code: 0,
      data: roleId ? mockRoleDataScopes.filter(scope => scope.roleId === roleId) : mockRoleDataScopes
    });
  }),
  http.get('/api/v1/system/role-members', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const roleId = new URL(request.url).searchParams.get('roleId');
    return HttpResponse.json({
      code: 0,
      data: roleId ? mockRoleMembers.filter(member => member.roleId === roleId) : mockRoleMembers
    });
  }),
  http.get('/api/v1/system/role-risks', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const roleId = new URL(request.url).searchParams.get('roleId');
    return HttpResponse.json({
      code: 0,
      data: roleId ? mockRoleRiskItems.filter(risk => risk.roleId === roleId) : mockRoleRiskItems
    });
  }),
  http.post('/api/v1/system/role-risks/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockRoleRiskItems.findIndex(risk => risk.id === id);
    if (index > -1) {
      mockRoleRiskItems[index] = {
        ...mockRoleRiskItems[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockRoleRiskItems[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Role risk not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/org-overview', () => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockOrgManageOverview
    });
  }),
  http.get('/api/v1/system/orgs', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const orgs = mockSystemOrgs.filter(org => {
      if (status !== 'all' && org.status !== status) return false;
      if (keyword) {
        const text = `${org.name} ${org.code} ${org.owner} ${org.deputy} ${org.dataResponsibility}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: orgs
    });
  }),
  http.post('/api/v1/system/orgs/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSystemOrgs.findIndex(org => org.id === id);
    if (index > -1) {
      mockSystemOrgs[index] = {
        ...mockSystemOrgs[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSystemOrgs[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Organization not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/org-responsibilities', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const orgId = new URL(request.url).searchParams.get('orgId');
    return HttpResponse.json({
      code: 0,
      data: orgId ? mockOrgResponsibilityDomains.filter(item => item.orgId === orgId) : mockOrgResponsibilityDomains
    });
  }),
  http.get('/api/v1/system/org-stewards', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const orgId = new URL(request.url).searchParams.get('orgId');
    return HttpResponse.json({
      code: 0,
      data: orgId ? mockOrgStewards.filter(item => item.orgId === orgId) : mockOrgStewards
    });
  }),
  http.get('/api/v1/system/org-changes', ({ request }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const orgId = new URL(request.url).searchParams.get('orgId');
    return HttpResponse.json({
      code: 0,
      data: orgId ? mockOrgChangeRecords.filter(item => item.orgId === orgId) : mockOrgChangeRecords
    });
  }),
  http.post('/api/v1/system/org-changes/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_SYSTEM_MANAGEMENT !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockOrgChangeRecords.findIndex(change => change.id === id);
    if (index > -1) {
      mockOrgChangeRecords[index] = {
        ...mockOrgChangeRecords[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockOrgChangeRecords[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Organization change not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/notification-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockNotificationOverview
    });
  }),
  http.get('/api/v1/system/notification-templates', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const templates = mockNotificationTemplates.filter(template => {
      if (status !== 'all' && template.status !== status) return false;
      if (keyword) {
        const text = `${template.name} ${template.code} ${template.scene} ${template.owner} ${template.channel}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: templates
    });
  }),
  http.post('/api/v1/system/notification-templates/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockNotificationTemplates.findIndex(template => template.id === id);
    if (index > -1) {
      mockNotificationTemplates[index] = {
        ...mockNotificationTemplates[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockNotificationTemplates[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Notification template not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/notification-subscriptions', ({ request }) => {
    const templateId = new URL(request.url).searchParams.get('templateId');
    return HttpResponse.json({
      code: 0,
      data: templateId ? mockNotificationSubscriptions.filter(item => item.templateId === templateId) : mockNotificationSubscriptions
    });
  }),
  http.get('/api/v1/system/notification-channels', () => {
    return HttpResponse.json({
      code: 0,
      data: mockNotificationChannels
    });
  }),
  http.get('/api/v1/system/notification-messages', ({ request }) => {
    const templateId = new URL(request.url).searchParams.get('templateId');
    return HttpResponse.json({
      code: 0,
      data: templateId ? mockNotificationMessages.filter(item => item.templateId === templateId) : mockNotificationMessages
    });
  }),
  http.post('/api/v1/system/notification-messages/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockNotificationMessages.findIndex(message => message.id === id);
    if (index > -1) {
      mockNotificationMessages[index] = {
        ...mockNotificationMessages[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockNotificationMessages[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Notification message not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/operation-log-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockOperationLogOverview
    });
  }),
  http.get('/api/v1/system/operation-log-events', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const risk = url.searchParams.get('risk') ?? 'all';
    const result = url.searchParams.get('result') ?? 'all';
    const events = mockOperationLogEvents.filter(event => {
      if (risk !== 'all' && event.risk !== risk) return false;
      if (result !== 'all' && event.result !== result) return false;
      if (keyword) {
        const text = `${event.operator} ${event.account} ${event.module} ${event.action} ${event.objectName} ${event.objectType} ${event.detail}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: events
    });
  }),
  http.post('/api/v1/system/operation-log-events/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockOperationLogEvents.findIndex(event => event.id === id);
    if (index > -1) {
      mockOperationLogEvents[index] = {
        ...mockOperationLogEvents[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockOperationLogEvents[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Operation event not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/operation-log-objects', () => {
    return HttpResponse.json({
      code: 0,
      data: mockOperationLogObjects
    });
  }),
  http.get('/api/v1/system/operation-log-diffs', ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    return HttpResponse.json({
      code: 0,
      data: eventId ? mockOperationLogDiffs.filter(item => item.eventId === eventId) : mockOperationLogDiffs
    });
  }),
  http.get('/api/v1/system/operation-log-exports', () => {
    return HttpResponse.json({
      code: 0,
      data: mockOperationLogExports
    });
  }),
  http.post('/api/v1/system/operation-log-exports', async ({ request }) => {
    const data = await request.json() as any;
    const job = {
      id: `olex-${Date.now()}`,
      name: data.name ?? '操作日志导出',
      scope: data.scope ?? '当前筛选条件',
      status: 'running',
      format: data.format ?? 'CSV',
      createdBy: data.createdBy ?? '当前用户',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      rows: 0
    };
    mockOperationLogExports.unshift(job);
    return HttpResponse.json({ code: 0, data: job });
  }),
  http.get('/api/v1/system/config-overview', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSystemConfigOverview
    });
  }),
  http.get('/api/v1/system/config-params', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const params = mockSystemConfigParams.filter(item => {
      if (status !== 'all' && item.status !== status) return false;
      if (keyword) {
        const text = `${item.key} ${item.name} ${item.category} ${item.owner} ${item.description}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });
    return HttpResponse.json({
      code: 0,
      data: params
    });
  }),
  http.post('/api/v1/system/config-params/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSystemConfigParams.findIndex(item => item.id === id);
    if (index > -1) {
      mockSystemConfigParams[index] = {
        ...mockSystemConfigParams[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSystemConfigParams[index] });
    }
    return HttpResponse.json({ code: 404, message: 'System config parameter not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/config-integrations', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSystemConfigIntegrations
    });
  }),
  http.get('/api/v1/system/runtime-switches', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSystemRuntimeSwitches
    });
  }),
  http.post('/api/v1/system/runtime-switches/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSystemRuntimeSwitches.findIndex(item => item.id === id);
    if (index > -1) {
      mockSystemRuntimeSwitches[index] = {
        ...mockSystemRuntimeSwitches[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSystemRuntimeSwitches[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Runtime switch not found' }, { status: 404 });
  }),
  http.get('/api/v1/system/environment-policies', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSystemEnvironmentPolicies
    });
  }),
  http.get('/api/v1/system/config-changes', () => {
    return HttpResponse.json({
      code: 0,
      data: mockSystemConfigChanges
    });
  }),
  http.post('/api/v1/system/config-changes/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockSystemConfigChanges.findIndex(item => item.id === id);
    if (index > -1) {
      mockSystemConfigChanges[index] = {
        ...mockSystemConfigChanges[index],
        status
      };
      return HttpResponse.json({ code: 0, data: mockSystemConfigChanges[index] });
    }
    return HttpResponse.json({ code: 404, message: 'System config change not found' }, { status: 404 });
  }),

  // Business domain master data endpoints
  http.get('/api/v1/business-domains', ({ request }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase();

    let data = [...mockBusinessDomains];
    if (status !== 'all') {
      data = data.filter((domain) => domain.status === status);
    }
    if (keyword) {
      data = data.filter((domain) => {
        const text = `${domain.name} ${domain.code} ${domain.owner} ${domain.ownerUsername} ${domain.org} ${domain.description}`.toLowerCase();
        return text.includes(keyword);
      });
    }

    return HttpResponse.json({ code: 0, data });
  }),

  http.get('/api/v1/business-domains/options', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockBusinessDomains
        .filter((domain) => domain.status === 'active')
        .map((domain) => ({
          id: domain.id,
          code: domain.code,
          name: domain.name,
          parentId: domain.parentId,
          level: domain.level,
          status: domain.status,
        })),
    });
  }),

  http.post('/api/v1/business-domains', async ({ request }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const data = await request.json() as any;
    const domainStore = mockBusinessDomains as any[];
    const parent = data.parentId ? domainStore.find((domain) => domain.id === data.parentId) : null;
    if (data.parentId && !parent) {
      return HttpResponse.json({ code: 400, message: 'Parent business domain not found' }, { status: 400 });
    }
    if (parent && parent.level >= 5) {
      return HttpResponse.json({ code: 400, message: 'Business domain level cannot exceed 5' }, { status: 400 });
    }
    const newDomain = {
      id: data.id || `bd-${Date.now()}`,
      code: (data.code || `BD_${Date.now()}`).toString().trim().toUpperCase(),
      name: data.name || '未命名业务域',
      parentId: data.parentId ?? null,
      level: parent ? parent.level + 1 : 1,
      status: data.status || 'active',
      owner: data.owner || '待分配',
      ownerUsername: data.ownerUsername || '',
      org: data.org || '未分配组织',
      assetCount: 0,
      qualityScore: 0,
      standardCoverage: 0,
      sensitiveAssets: 0,
      defaultSecurityLevel: data.defaultSecurityLevel || 'L2 内部',
      qualityGate: data.qualityGate || '发布前完成标准映射、质量校验和安全分级确认',
      standardRequired: data.standardRequired ?? true,
      colorClass: data.colorClass || businessDomainColors[domainStore.length % businessDomainColors.length],
      growth: data.growth || '+0.0%',
      updatedAt: formatTimestamp(),
      description: data.description || '业务域说明待补充。',
      childDomains: Array.isArray(data.childDomains) ? data.childDomains : [],
      references: data.references || {
        assets: 0,
        standards: 0,
        qualityRules: 0,
        models: 0,
        permissions: 0,
      },
    };
    domainStore.unshift(newDomain);
    return HttpResponse.json({ code: 0, data: newDomain });
  }),

  http.put('/api/v1/business-domains/:id', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const data = await request.json() as any;
    const domainStore = mockBusinessDomains as any[];
    const index = domainStore.findIndex((domain) => domain.id === id);
    if (index > -1) {
      const parentId = data.parentId ?? null;
      const parent = parentId ? domainStore.find((domain) => domain.id === parentId) : null;
      if (parentId && !parent) {
        return HttpResponse.json({ code: 400, message: 'Parent business domain not found' }, { status: 400 });
      }
      if (parentId === id) {
        return HttpResponse.json({ code: 400, message: 'Business domain cannot be its own parent' }, { status: 400 });
      }
      if (parent && parent.level >= 5) {
        return HttpResponse.json({ code: 400, message: 'Business domain level cannot exceed 5' }, { status: 400 });
      }
      domainStore[index] = {
        ...domainStore[index],
        code: data.code ? data.code.toString().trim().toUpperCase() : domainStore[index].code,
        name: data.name ?? domainStore[index].name,
        parentId,
        level: parent ? parent.level + 1 : 1,
        status: data.status ?? domainStore[index].status,
        owner: data.owner ?? domainStore[index].owner,
        ownerUsername: data.ownerUsername ?? domainStore[index].ownerUsername,
        org: data.org ?? domainStore[index].org,
        defaultSecurityLevel: data.defaultSecurityLevel ?? domainStore[index].defaultSecurityLevel,
        qualityGate: data.qualityGate ?? domainStore[index].qualityGate,
        standardRequired: data.standardRequired ?? domainStore[index].standardRequired,
        description: data.description ?? domainStore[index].description,
        updatedAt: formatTimestamp(),
      };
      return HttpResponse.json({ code: 0, data: domainStore[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Business domain not found' }, { status: 404 });
  }),

  http.post('/api/v1/business-domains/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const domainStore = mockBusinessDomains as any[];
    const index = domainStore.findIndex((domain) => domain.id === id);
    if (index > -1) {
      domainStore[index] = {
        ...domainStore[index],
        status,
        updatedAt: formatTimestamp(),
      };
      return HttpResponse.json({ code: 0, data: domainStore[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Business domain not found' }, { status: 404 });
  }),

  // Asset Overview endpoints
  http.get('/api/v1/assets/core-metrics', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetCoreMetrics
    });
  }),

  http.get('/api/v1/assets/layer-distribution', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetLayerDistribution
    });
  }),

  http.get('/api/v1/assets/business-domains', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: getAssetBusinessDomainSummary()
    });
  }),

  http.get('/api/v1/assets/data-sources', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetDataSources
    });
  }),

  http.get('/api/v1/assets/growth-trend', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetGrowthTrend
    });
  }),

  http.get('/api/v1/assets/health-metrics', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetHealthMetrics
    });
  }),

  http.get('/api/v1/assets/hot-assets', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetHotAssets
    });
  }),

  http.get('/api/v1/assets/pending-items', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetPendingItems
    });
  }),

  http.get('/api/v1/assets/catalog', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetCatalog
    });
  }),

  http.get('/api/v1/assets/catalog/:id/detail', ({ params }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const detail = mockAssetCatalogDetails.find((item) => item.assetId === id);
    if (!detail) {
      return HttpResponse.json({ code: 404, message: 'Asset catalog detail not found' }, { status: 404 });
    }
    return HttpResponse.json({
      code: 0,
      data: detail
    });
  }),

  http.get('/api/v1/assets/register-options', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAssetRegisterOptions
    });
  }),

  http.post('/api/v1/assets/register', async ({ request }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const data = await request.json() as any;
    const tableIds = Array.isArray(data.tableIds) ? data.tableIds : [];
    const tables = mockAssetRegisterOptions.tables.filter((table) => tableIds.includes(table.id));
    const dataSource = mockAssetRegisterOptions.dataSources.find((source) => source.id === data.dataSourceId);
    const layer = String(data.dataLayer || 'dwd').toUpperCase();
    const sensitivityMap: Record<string, string> = {
      public: '公开',
      normal: '内部',
      sensitive: '敏感',
      confidential: '机密',
    };
    const registeredAssets = tables.map((table, index) => {
      const existingIndex = mockAssetCatalog.findIndex((asset) => asset.name === table.name);
      const asset = {
        id: existingIndex >= 0 ? mockAssetCatalog[existingIndex].id : `asset-${Date.now()}-${index}`,
        name: table.name,
        cnName: data.assetName && tables.length === 1 ? data.assetName : `${table.name} 数据表`,
        description: data.description || `${table.name} 通过资产注册流程纳入目录，等待后续治理任务完善。`,
        database: table.database,
        source: dataSource?.name || 'unknown-source',
        sourceType: String(dataSource?.type || 'unknown').toLowerCase(),
        layer,
        domain: data.businessDomain || '公共域',
        owner: data.owner || '待分配',
        ownerAvatar: '',
        department: data.department || dataSource?.name || '未分配组织',
        sensitivity: sensitivityMap[data.sensitivity] || '内部',
        qualityScore: 0,
        rowCount: table.rowCount,
        size: table.size,
        fieldCount: 0,
        visitCount: 0,
        updateTime: formatTimestamp(),
        tags: Array.from(new Set([...(data.tags || []), '新注册', '待质量评估'])),
        certified: false,
        favorite: false,
      } as any;

      if (existingIndex >= 0) {
        mockAssetCatalog[existingIndex] = {
          ...mockAssetCatalog[existingIndex],
          ...asset,
          id: mockAssetCatalog[existingIndex].id,
          fieldCount: mockAssetCatalog[existingIndex].fieldCount,
          qualityScore: mockAssetCatalog[existingIndex].qualityScore,
          visitCount: mockAssetCatalog[existingIndex].visitCount,
          certified: mockAssetCatalog[existingIndex].certified,
        };
        const detailIndex = mockAssetCatalogDetails.findIndex((detail) => detail.assetId === mockAssetCatalog[existingIndex].id);
        if (detailIndex >= 0) mockAssetCatalogDetails[detailIndex] = buildAssetCatalogDetail(mockAssetCatalog[existingIndex]);
        return mockAssetCatalog[existingIndex];
      }

      mockAssetCatalog.unshift(asset);
      mockAssetCatalogDetails.unshift(buildAssetCatalogDetail(asset));
      return asset;
    });

    return HttpResponse.json({ code: 0, data: registeredAssets });
  }),

  http.get('/api/v1/assets/lineage', ({ request }) => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    const url = new URL(request.url);
    const center = url.searchParams.get('center') || 'dwd_order_detail';

    // Mock 动态改变中心节点：克隆一份数据，将匹配到 center 的节点 level 设为 0，其他根据连线调整（这里仅做简易 Mock 演示：直接将点击节点平移到 level 0，原 0 变成 1 等）
    let dynamicNodes = [...mockLineageData.nodes];
    const newCenterNode = dynamicNodes.find(n => n.id === center || n.name === center);
    
    if (newCenterNode && newCenterNode.level !== 0) {
      const offset = newCenterNode.level;
      dynamicNodes = dynamicNodes.map(n => ({
        ...n,
        level: n.level - offset
      }));
    }

    return HttpResponse.json({
      code: 0,
      data: {
        ...mockLineageData,
        center: newCenterNode ? newCenterNode.id : mockLineageData.center,
        nodes: dynamicNodes
      }
    });
  }),

  // Map endpoints
  http.get('/api/v1/assets/map', () => {
    if (import.meta.env.VITE_REAL_ASSETS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockMapData
    });
  }),

  // Metadata endpoints
  http.get('/api/v1/metadata/data-sources', () => {
    if (import.meta.env.VITE_REAL_METADATA_DATA_SOURCES !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: mockAllDataSources
    });
  }),
  http.post('/api/v1/metadata/data-sources', async ({ request }) => {
    if (import.meta.env.VITE_REAL_METADATA_DATA_SOURCES !== 'false') return passthrough();
    const data = await request.json() as any;
    const sourceStore = mockAllDataSources as any[];
    const newSource = {
      id: data.id || `ds-${Date.now()}`,
      name: data.name || `${String(data.type || 'MySQL').toLowerCase()}_source`,
      type: data.type || 'MySQL',
      category: getDataSourceCategory(data.type || 'MySQL'),
      status: 'syncing',
      host: data.host || '127.0.0.1',
      port: Number(data.port || 3306),
      database: data.database || 'default',
      version: data.version || '待检测',
      owner: data.owner || '待分配',
      department: data.department || '未分配组织',
      env: data.env || '开发',
      tableCount: 0,
      storageGB: 0,
      qps: 0,
      latencyMs: 0,
      lastSyncTime: formatTimestamp(),
      createTime: formatTimestamp(),
      description: data.description || '新接入数据源，等待元数据采集完成。',
      tags: data.tags || ['新接入'],
    };
    sourceStore.unshift(newSource);
    return HttpResponse.json({ code: 0, data: newSource });
  }),
  http.post('/api/v1/metadata/data-sources/:id/sync', ({ params }) => {
    if (import.meta.env.VITE_REAL_METADATA_DATA_SOURCES !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const sourceStore = mockAllDataSources as any[];
    const index = sourceStore.findIndex((source) => source.id === id);
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: 'Data source not found' }, { status: 404 });
    }
    sourceStore[index] = {
      ...sourceStore[index],
      status: 'syncing',
      lastSyncTime: formatTimestamp(),
    };
    return HttpResponse.json({ code: 0, data: sourceStore[index] });
  }),
  http.post('/api/v1/metadata/data-sources/:id/status', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_METADATA_DATA_SOURCES !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const sourceStore = mockAllDataSources as any[];
    const index = sourceStore.findIndex((source) => source.id === id);
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: 'Data source not found' }, { status: 404 });
    }
    sourceStore[index] = {
      ...sourceStore[index],
      status,
      lastSyncTime: formatTimestamp(),
    };
    return HttpResponse.json({ code: 0, data: sourceStore[index] });
  }),
  http.get('/api/v1/metadata/query', () => {
    return HttpResponse.json({
      code: 0,
      data: mockMetadataQueryData
    });
  }),
  http.get('/api/v1/metadata/maintain', () => {
    return HttpResponse.json({
      code: 0,
      data: mockMetadataMaintainData
    });
  }),
  
  // Standard endpoints
  http.get('/api/v1/standard/definitions', () => {
    return HttpResponse.json({
      code: 0,
      data: mockStandardDefinitions
    });
  }),
  http.post('/api/v1/standard/definitions', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ code: 0, data: { ...data as object, id: `std-${Date.now()}` } });
  }),
  http.put('/api/v1/standard/definitions/:id', async ({ request, params }) => {
    const data = await request.json();
    return HttpResponse.json({ code: 0, data: { ...data as object, id: params.id } });
  }),
  http.post('/api/v1/standard/definitions/:id/offline', () => {
    return HttpResponse.json({ code: 0, data: null });
  }),
  http.post('/api/v1/standard/definitions/import', () => {
    return HttpResponse.json({ code: 0, data: { importedCount: 15 } });
  }),
  
  http.get('/api/v1/standard/mappings', () => {
    return HttpResponse.json({
      code: 0,
      data: mockStandardMappings
    });
  }),
  http.post('/api/v1/standard/mappings/:id/status', async ({ request, params }) => {
    const { status } = await request.json() as any;
    return HttpResponse.json({ code: 0, data: { id: params.id, status } });
  }),
  http.post('/api/v1/standard/mappings/rescan', () => {
    return HttpResponse.json({ code: 0, data: { scannedTables: 125, newMappings: 8 } });
  }),
  http.post('/api/v1/standard/mappings', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ code: 0, data: { ...data as object, id: `map-${Date.now()}`, status: 'mapped', updateTime: new Date().toISOString().split('T')[0], creator: '当前用户', matchScore: 100 } });
  }),

  http.get('/api/v1/standard/evaluations', () => {
    return HttpResponse.json({
      code: 0,
      data: mockStandardEvalData
    });
  }),
  http.post('/api/v1/standard/evaluations/run', () => {
    return HttpResponse.json({ code: 0, data: { status: 'completed', newIssues: 2 } });
  }),
  http.post('/api/v1/standard/evaluations/export', () => {
    return HttpResponse.json({ code: 0, data: { url: '/downloads/eval_report.pdf' } });
  }),

  // Dictionary endpoints
  http.get('/api/v1/standard/dictionaries/categories', () => {
    return HttpResponse.json({
      code: 0,
      data: mockDataDictCategories
    });
  }),
  http.post('/api/v1/standard/dictionaries/categories', async ({ request }) => {
    const data = await request.json();
    const newCategory = { ...data as object, id: `cat-${Date.now()}` };
    mockDataDictCategories.push(newCategory as any);
    return HttpResponse.json({ code: 0, data: newCategory });
  }),
  http.get('/api/v1/standard/dictionaries/:code/items', ({ params }) => {
    const { code } = params;
    return HttpResponse.json({
      code: 0,
      data: mockDataDictItems[code as string] || []
    });
  }),
  http.post('/api/v1/standard/dictionaries/:code/items', async ({ request, params }) => {
    const { code } = params;
    const data = await request.json();
    const newItem = { ...data as object, id: `itm-${Date.now()}`, dictCode: code as string };
    if (!mockDataDictItems[code as string]) {
      mockDataDictItems[code as string] = [];
    }
    mockDataDictItems[code as string].push(newItem);
    return HttpResponse.json({ code: 0, data: newItem });
  }),
  http.put('/api/v1/standard/dictionaries/:code/items/:id', async ({ request, params }) => {
    const { code, id } = params;
    const data = await request.json();
    const items = mockDataDictItems[code as string] || [];
    const index = items.findIndex(item => item.id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...data as object };
    }
    return HttpResponse.json({ code: 0, data: items[index] });
  }),
  http.delete('/api/v1/standard/dictionaries/:code/items/:id', ({ params }) => {
    const { code, id } = params;
    if (mockDataDictItems[code as string]) {
      mockDataDictItems[code as string] = mockDataDictItems[code as string].filter(item => item.id !== id);
    }
    return HttpResponse.json({ code: 0, data: null });
  }),

  // Code Manage endpoints
  http.get('/api/v1/standard/codes', () => {
    return HttpResponse.json({ code: 0, data: mockCodeSets });
  }),
  http.post('/api/v1/standard/codes', async ({ request }) => {
    const data = await request.json();
    const newCodeSet = { 
      ...data as object, 
      id: `cs-${Date.now()}`, 
      status: 'draft', 
      itemCount: 0, 
      updateTime: new Date().toISOString().split('T')[0], 
      creator: '当前用户' 
    };
    mockCodeSets.unshift(newCodeSet as any);
    return HttpResponse.json({ code: 0, data: newCodeSet });
  }),
  http.put('/api/v1/standard/codes/:id', async ({ request, params }) => {
    const { id } = params;
    const data = await request.json();
    const index = mockCodeSets.findIndex(cs => cs.id === id);
    if (index > -1) {
      mockCodeSets[index] = { ...mockCodeSets[index], ...data as object };
    }
    return HttpResponse.json({ code: 0, data: mockCodeSets[index] });
  }),
  http.delete('/api/v1/standard/codes/:id', ({ params }) => {
    const { id } = params;
    const index = mockCodeSets.findIndex(cs => cs.id === id);
    if (index > -1) {
      mockCodeSets.splice(index, 1);
    }
    return HttpResponse.json({ code: 0, data: null });
  }),
  http.post('/api/v1/standard/codes/:id/clone', ({ params }) => {
    const { id } = params;
    const codeSet = mockCodeSets.find(cs => cs.id === id);
    if (!codeSet) {
      return HttpResponse.json({ code: 404, message: 'Code set not found' });
    }
    
    const newCode = `${codeSet.code}_CLONE_${Math.floor(Math.random() * 1000)}`;
    const newCodeSet = {
      ...codeSet,
      id: `cs-${Date.now()}`,
      code: newCode,
      name: `${codeSet.name} (副本)`,
      status: 'draft',
      isBuiltIn: false,
      updateTime: new Date().toISOString().split('T')[0],
      creator: '当前用户'
    };
    
    // Copy code values
    if (mockCodeValues[codeSet.code]) {
      mockCodeValues[newCode] = mockCodeValues[codeSet.code].map(cv => ({
        ...cv,
        id: `cv-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }));
    }
    
    mockCodeSets.unshift(newCodeSet as any);
    return HttpResponse.json({ code: 0, data: newCodeSet });
  }),
  http.post('/api/v1/standard/codes/import', () => {
    return HttpResponse.json({ code: 0, data: { importedCount: 3 } });
  }),
  http.get('/api/v1/standard/codes/:code/values', ({ params }) => {
    const { code } = params;
    return HttpResponse.json({ code: 0, data: mockCodeValues[code as string] || [] });
  }),
  http.post('/api/v1/standard/codes/:code/values', async ({ request, params }) => {
    const { code } = params;
    const data = await request.json();
    const newValue = { ...data as object, id: `cv-${Date.now()}` };
    if (!mockCodeValues[code as string]) {
      mockCodeValues[code as string] = [];
    }
    mockCodeValues[code as string].push(newValue);
    return HttpResponse.json({ code: 0, data: newValue });
  }),
  http.put('/api/v1/standard/codes/:code/values/:id', async ({ request, params }) => {
    const { code, id } = params;
    const data = await request.json();
    const values = mockCodeValues[code as string] || [];
    const index = values.findIndex(v => v.id === id);
    if (index > -1) {
      values[index] = { ...values[index], ...data as object };
    }
    return HttpResponse.json({ code: 0, data: values[index] });
  }),
  http.delete('/api/v1/standard/codes/:code/values/:id', ({ params }) => {
    const { code, id } = params;
    if (mockCodeValues[code as string]) {
      mockCodeValues[code as string] = mockCodeValues[code as string].filter(v => v.id !== id);
    }
    return HttpResponse.json({ code: 0, data: null });
  }),

  // Development Models endpoints
  http.get('/api/v1/development/models', () => {
    return HttpResponse.json({ code: 0, data: mockDevelopmentModels });
  }),
  http.post('/api/v1/development/models', async ({ request }) => {
    const data = await request.json();
    const newModel = { 
      ...data as object, 
      id: `mod-${Date.now()}`, 
      status: 'draft', 
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19), 
      owner: '当前用户' 
    };
    mockDevelopmentModels.unshift(newModel as any);
    return HttpResponse.json({ code: 0, data: newModel });
  }),
  http.put('/api/v1/development/models/:id', async ({ request, params }) => {
    const { id } = params;
    const data = await request.json();
    const index = mockDevelopmentModels.findIndex(m => m.id === id);
    if (index > -1) {
      mockDevelopmentModels[index] = { 
        ...mockDevelopmentModels[index], 
        ...data as object,
        updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
    }
    return HttpResponse.json({ code: 0, data: mockDevelopmentModels[index] });
  }),
  http.delete('/api/v1/development/models/:id', ({ params }) => {
    const { id } = params;
    const index = mockDevelopmentModels.findIndex(m => m.id === id);
    if (index > -1) {
      mockDevelopmentModels.splice(index, 1);
    }
    return HttpResponse.json({ code: 0, data: null });
  }),
  http.post('/api/v1/development/models/:id/status', async ({ request, params }) => {
    const { id } = params;
    const { status } = await request.json() as any;
    const index = mockDevelopmentModels.findIndex(m => m.id === id);
    if (index > -1) {
      mockDevelopmentModels[index].status = status;
      mockDevelopmentModels[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    return HttpResponse.json({ code: 0, data: mockDevelopmentModels[index] });
  }),
  http.post('/api/v1/development/models/:id/sync', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { reason } = await request.json() as any;
    const index = mockDevelopmentModels.findIndex(m => m.id === id);
    
    if (index > -1) {
      const model = mockDevelopmentModels[index];
      // Update status to sync_approving
      model.syncStatus = 'sync_approving';
      model.updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // Push new approval
      mockApprovals.push({
        id: `app-${Date.now()}`,
        moduleType: 'data_model',
        title: `申请同步物理表: ${model.name}`,
        applicant: '当前用户',
        applyTime: model.updateTime,
        reason: reason || '申请同步物理表',
        status: 'pending',
        payload: {
          modelId: model.id,
          modelName: model.name
        }
      });
      
      return HttpResponse.json({ code: 0, data: { message: "申请已提交，请等待审批" } });
    }
    return HttpResponse.json({ code: 404, message: "模型不存在" });
  }),
  http.get('/api/v1/development/models/:id/sync-logs', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const logs = mockModelSyncLogs
      .filter(log => log.modelId === id)
      .sort((a, b) => new Date(b.syncTime).getTime() - new Date(a.syncTime).getTime());
    return HttpResponse.json({ code: 0, data: logs });
  }),
  
  // Approvals endpoints
  http.get('/api/v1/approvals', () => {
    if (import.meta.env.VITE_REAL_APPROVALS !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockApprovals });
  }),
  http.post('/api/v1/approvals/:id/process', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_APPROVALS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { action } = await request.json() as any; // 'approve' | 'reject'
    const index = mockApprovals.findIndex(a => a.id === id);
    
    if (index > -1) {
      const approval = mockApprovals[index];
      approval.status = action === 'approve' ? 'approved' : 'rejected';
      approval.processTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      approval.processor = '管理员';

      // 如果是审批通过，则执行原本的建表逻辑，并写日志
      if (approval.moduleType === 'data_model') {
        const modelIndex = mockDevelopmentModels.findIndex(m => m.id === approval.payload.modelId);
        if (modelIndex > -1) {
          if (action === 'approve') {
            mockDevelopmentModels[modelIndex].syncStatus = 'synced';
            mockDevelopmentModels[modelIndex].updateTime = approval.processTime;
            mockModelSyncLogs.push({
              id: `log-${Date.now()}`,
              modelId: approval.payload.modelId,
              syncTime: approval.processTime,
              status: 'success',
              operator: '管理员 (审批执行)',
              details: `CREATE TABLE IF NOT EXISTS \`${approval.payload.modelName}\` (...);\n-- 审批通过并同步成功`
            });
          } else {
            mockDevelopmentModels[modelIndex].syncStatus = 'unsynced';
          }
        }
      }
      return HttpResponse.json({ code: 0, data: approval });
    }
    return HttpResponse.json({ code: 404, message: "审批单不存在" });
  }),

  // ========================================
  // Development Scripts APIs
  // ========================================
  http.get('/api/v1/development/scripts', () => {
    if (import.meta.env.VITE_REAL_DEVELOPMENT_SCRIPTS !== 'false') return passthrough();
    return HttpResponse.json({ code: 0, data: mockScripts });
  }),
  http.post('/api/v1/development/scripts', async ({ request }) => {
    if (import.meta.env.VITE_REAL_DEVELOPMENT_SCRIPTS !== 'false') return passthrough();
    const data = await request.json() as any;
    const newScript = {
      ...data,
      id: `script-${Date.now()}`,
      status: 'draft',
      version: 1,
      updateTime: new Date().toISOString()
    };
    mockScripts.push(newScript);
    if (newScript.type !== 'folder') {
      mockScriptVersions.push({
        id: `v-${Date.now()}`,
        scriptId: newScript.id,
        version: 1,
        content: newScript.content || '',
        createTime: newScript.updateTime,
        creator: 'Admin',
        comment: 'Initial version',
      });
    }
    return HttpResponse.json({ code: 0, data: newScript });
  }),
  http.put('/api/v1/development/scripts/:id', async ({ request, params }) => {
    if (import.meta.env.VITE_REAL_DEVELOPMENT_SCRIPTS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const data = await request.json() as any;
    const index = mockScripts.findIndex(s => s.id === id);
    if (index !== -1) {
      mockScripts[index] = { ...mockScripts[index], ...data, updateTime: new Date().toISOString() };
      return HttpResponse.json({ code: 0, data: mockScripts[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Script not found' }, { status: 404 });
  }),
  http.post('/api/v1/development/scripts/:id/run', async () => {
    if (import.meta.env.VITE_REAL_DEVELOPMENT_SCRIPTS !== 'false') return passthrough();
    return HttpResponse.json({
      code: 0,
      data: {
        logs: ['任务已启动', '正在连接数据源...', '执行成功，用时 2.3s'],
        data: [
          { id: 1, name: 'sample_result', rows: 128, status: 'success' },
          { id: 2, name: 'quality_check', rows: 0, status: 'passed' },
        ]
      }
    });
  }),
  http.post('/api/v1/development/scripts/:id/publish', async ({ params }) => {
    if (import.meta.env.VITE_REAL_DEVELOPMENT_SCRIPTS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockScripts.findIndex(s => s.id === id);
    if (index !== -1) {
      mockScripts[index].status = 'approving';
      mockApprovals.push({
        id: `app-${Date.now()}`,
        moduleType: "script",
        title: `申请发布脚本: ${mockScripts[index].name}`,
        applicant: "张无忌",
        applyTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        reason: "新需求开发完毕",
        status: "pending",
        payload: {
          scriptId: id,
          version: mockScripts[index].version,
          content: mockScripts[index].content
        }
      });
      return HttpResponse.json({ code: 0, data: { success: true, message: 'Submitted to approval flow' } });
    }
    return HttpResponse.json({ code: 404, message: 'Script not found' }, { status: 404 });
  }),
  http.get('/api/v1/development/scripts/:id/versions', ({ params }) => {
    if (import.meta.env.VITE_REAL_DEVELOPMENT_SCRIPTS !== 'false') return passthrough();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const versions = mockScriptVersions.filter(v => v.scriptId === id);
    return HttpResponse.json({ code: 0, data: versions });
  }),

  // ─── 指标管理 ────────────────────────────────────────────────────────────────
  http.get('/api/v1/service/metric-overview', () => {
    return HttpResponse.json({ code: 0, data: mockMetricOverview });
  }),
  http.get('/api/v1/service/metrics', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const type = url.searchParams.get('type') ?? 'all';
    const category = url.searchParams.get('category') ?? 'all';
    const status = url.searchParams.get('status') ?? 'all';
    const result = mockMetrics.filter(m => {
      if (type !== 'all' && m.type !== type) return false;
      if (category !== 'all' && m.category !== category) return false;
      if (status !== 'all' && m.status !== status) return false;
      if (keyword && !m.name.includes(keyword) && !m.bizName.includes(keyword) && !m.definition.includes(keyword)) return false;
      return true;
    });
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/service/metrics', async ({ request }) => {
    const data = await request.json() as any;
    const newMetric = {
      ...data,
      id: `m-${Date.now()}`,
      status: 'draft',
      certified: false,
      usedBy: 0,
      version: 'v0.1',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    mockMetrics.unshift(newMetric as any);
    return HttpResponse.json({ code: 0, data: newMetric });
  }),
  http.post('/api/v1/service/metrics/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockMetrics.findIndex(m => m.id === id);
    if (index > -1) {
      (mockMetrics[index] as any).status = status;
      return HttpResponse.json({ code: 0, data: mockMetrics[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Metric not found' }, { status: 404 });
  }),
  http.get('/api/v1/service/metric-categories', () => {
    return HttpResponse.json({ code: 0, data: mockMetricCategories });
  }),

  // ─── 数据服务 API ─────────────────────────────────────────────────────────────
  http.get('/api/v1/service/api-overview', () => {
    return HttpResponse.json({ code: 0, data: mockServiceApiOverview });
  }),
  http.get('/api/v1/service/apis', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const category = url.searchParams.get('category') ?? 'all';
    const result = mockServiceApis.filter(a => {
      if (status !== 'all' && a.status !== status) return false;
      if (category !== 'all' && a.category !== category) return false;
      if (keyword && !a.name.includes(keyword) && !a.path.includes(keyword) && !a.enName.includes(keyword)) return false;
      return true;
    });
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/service/apis', async ({ request }) => {
    const data = await request.json() as any;
    const newApi = {
      ...data,
      id: `api-${Date.now()}`,
      status: 'maintaining',
      qps: 0,
      avgLatency: '-',
      p99Latency: '-',
      errorRate: '-',
      totalCalls: '0',
      callerCount: 0,
      version: 'v1.0',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    mockServiceApis.unshift(newApi as any);
    return HttpResponse.json({ code: 0, data: newApi });
  }),
  http.post('/api/v1/service/apis/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { status } = await request.json() as any;
    const index = mockServiceApis.findIndex(a => a.id === id);
    if (index > -1) {
      (mockServiceApis[index] as any).status = status;
      return HttpResponse.json({ code: 0, data: mockServiceApis[index] });
    }
    return HttpResponse.json({ code: 404, message: 'API not found' }, { status: 404 });
  }),

  // ─── 数据共享 ─────────────────────────────────────────────────────────────────
  http.get('/api/v1/service/sharing-overview', () => {
    return HttpResponse.json({ code: 0, data: mockDataSharingOverview });
  }),
  http.get('/api/v1/service/shares', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';
    const level = url.searchParams.get('level') ?? 'all';
    const type = url.searchParams.get('type') ?? 'all';
    const category = url.searchParams.get('category') ?? 'all';
    const result = mockShareAssets.filter(a => {
      if (level !== 'all' && a.level !== level) return false;
      if (type !== 'all' && a.type !== type) return false;
      if (category !== 'all' && a.category !== category) return false;
      if (keyword && !a.name.includes(keyword) && !a.bizName.includes(keyword) && !a.description.includes(keyword)) return false;
      return true;
    });
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/service/shares/:id/apply', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockShareAssets.findIndex(a => a.id === id);
    if (index > -1) {
      (mockShareAssets[index] as any).status = 'applied';
      return HttpResponse.json({ code: 0, data: { success: true, message: '申请已提交，等待审批' } });
    }
    return HttpResponse.json({ code: 404, message: 'Asset not found' }, { status: 404 });
  }),

  // ─── 数据同步 ──────────────────────────────────────────────────────────
  http.get('/api/v1/development/sync-overview', () => {
    return HttpResponse.json({ code: 0, data: mockSyncOverview });
  }),
  http.get('/api/v1/development/sync-tasks', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const syncType = url.searchParams.get('syncType') ?? 'all';
    const result = mockSyncTasks.filter(t => {
      if (status !== 'all' && t.status !== status) return false;
      if (syncType !== 'all' && t.syncType !== syncType) return false;
      if (keyword && !t.name.includes(keyword) && !t.sourceName.includes(keyword) && !t.targetName.includes(keyword)) return false;
      return true;
    });
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/development/sync-tasks/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const body = await request.json() as { status: string };
    const index = mockSyncTasks.findIndex(t => t.id === id);
    if (index > -1) {
      (mockSyncTasks[index] as any).status = body.status;
      return HttpResponse.json({ code: 0, data: mockSyncTasks[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task not found' }, { status: 404 });
  }),
  http.get('/api/v1/development/sync-logs', ({ request }) => {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    const result = taskId ? mockSyncLogs.filter(l => l.taskId === taskId) : mockSyncLogs;
    return HttpResponse.json({ code: 0, data: result });
  }),

  // ─── 实时计算 ──────────────────────────────────────────────────────────
  http.get('/api/v1/development/flink-overview', () => {
    return HttpResponse.json({ code: 0, data: mockFlinkOverview });
  }),
  http.get('/api/v1/development/flink-tasks', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const result = mockFlinkTasks.filter(t => {
      if (status !== 'all' && t.status !== status) return false;
      if (keyword && !t.name.includes(keyword) && !t.description.includes(keyword)) return false;
      return true;
    });
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/development/flink-tasks/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const body = await request.json() as { status: string };
    const index = mockFlinkTasks.findIndex(t => t.id === id);
    if (index > -1) {
      (mockFlinkTasks[index] as any).status = body.status;
      return HttpResponse.json({ code: 0, data: mockFlinkTasks[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task not found' }, { status: 404 });
  }),

  // ─── 任务编排 ──────────────────────────────────────────────────────────
  http.get('/api/v1/development/orchestrations', () => {
    return HttpResponse.json({ code: 0, data: mockOrchestrations });
  }),
  http.get('/api/v1/development/dag-nodes', ({ request }) => {
    const url = new URL(request.url);
    const orchId = url.searchParams.get('orchestrationId');
    const result = orchId ? mockDagNodes.filter(n => n.orchestrationId === orchId) : mockDagNodes;
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.get('/api/v1/development/dag-run-history', ({ request }) => {
    const url = new URL(request.url);
    const orchId = url.searchParams.get('orchestrationId');
    const result = orchId ? mockDagRunHistory.filter(r => r.orchestrationId === orchId) : mockDagRunHistory;
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/development/orchestrations/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const body = await request.json() as { status: string };
    const index = mockOrchestrations.findIndex(o => o.id === id);
    if (index > -1) {
      (mockOrchestrations[index] as any).status = body.status;
      return HttpResponse.json({ code: 0, data: mockOrchestrations[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Orchestration not found' }, { status: 404 });
  }),
  http.post('/api/v1/development/orchestrations/:id/run', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const orch = mockOrchestrations.find(o => o.id === id);
    if (orch) {
      return HttpResponse.json({ code: 0, data: { success: true, message: `编排「${orch.name}」已触发手动运行` } });
    }
    return HttpResponse.json({ code: 404, message: 'Orchestration not found' }, { status: 404 });
  }),

  // ─── 元数据采集 ──────────────────────────────────────────────────────────
  http.get('/api/v1/metadata/collect-tasks', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const result = mockCollectTasks.filter(t => {
      if (status !== 'all' && t.status !== status) return false;
      if (keyword && !t.name.includes(keyword) && !t.dataSource.includes(keyword)) return false;
      return true;
    });
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.get('/api/v1/metadata/collect-records', ({ request }) => {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    const result = taskId ? mockCollectRecords.filter(r => r.taskId === taskId) : mockCollectRecords;
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.get('/api/v1/metadata/collect-rules', () => {
    return HttpResponse.json({ code: 0, data: mockCollectRules });
  }),
  http.post('/api/v1/metadata/collect-tasks', async ({ request }) => {
    const body = await request.json();
    const newTask = { ...body as any, id: 't' + Date.now(), status: 'waiting', lastRun: '-', nextRun: '-', duration: '-', tableCount: 0, fieldCount: 0, createdAt: new Date().toISOString().substring(0, 10) };
    mockCollectTasks.push(newTask);
    return HttpResponse.json({ code: 0, data: newTask });
  }),
  http.post('/api/v1/metadata/collect-tasks/:id/status', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const body = await request.json() as { status: string };
    const index = mockCollectTasks.findIndex(t => t.id === id);
    if (index > -1) {
      (mockCollectTasks[index] as any).status = body.status;
      return HttpResponse.json({ code: 0, data: mockCollectTasks[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Task not found' }, { status: 404 });
  }),

  // ─── 运维监控 ──────────────────────────────────────────────────────────
  http.get('/api/v1/ops/services', () => {
    return HttpResponse.json({ code: 0, data: mockOpsServices });
  }),
  http.get('/api/v1/ops/alerts', ({ request }) => {
    const url = new URL(request.url);
    const resolved = url.searchParams.get('resolved');
    const result = resolved === null ? mockOpsAlerts : mockOpsAlerts.filter(a => a.resolved === (resolved === 'true'));
    return HttpResponse.json({ code: 0, data: result });
  }),
  http.post('/api/v1/ops/alerts/:id/resolve', ({ params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const index = mockOpsAlerts.findIndex(a => a.id === id);
    if (index > -1) {
      (mockOpsAlerts[index] as any).resolved = true;
      return HttpResponse.json({ code: 0, data: mockOpsAlerts[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Alert not found' }, { status: 404 });
  }),

  // ─── 元数据模型 ──────────────────────────────────────────────────────────
  http.get('/api/v1/metadata/models', () => {
    return HttpResponse.json({ code: 0, data: mockMetadataModels });
  }),
  http.put('/api/v1/metadata/models/:id', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const body = await request.json();
    const index = mockMetadataModels.findIndex((m: any) => m.id === id);
    if (index > -1) {
      mockMetadataModels[index] = { ...mockMetadataModels[index], ...body as any };
      return HttpResponse.json({ code: 0, data: mockMetadataModels[index] });
    }
    return HttpResponse.json({ code: 404, message: 'Model not found' }, { status: 404 });
  }),

  // ─── 筛选选项 ──────────────────────────────────────────────────────────────
  http.get('/api/v1/filter-options/data-layers', () => {
    return HttpResponse.json({ code: 0, data: mockDataLayers });
  }),
  http.get('/api/v1/filter-options/sensitivities', () => {
    return HttpResponse.json({ code: 0, data: mockSensitivities });
  }),
  http.get('/api/v1/filter-options/tag-options', () => {
    return HttpResponse.json({ code: 0, data: mockTagOptions });
  }),
  http.get('/api/v1/filter-options/source-types', () => {
    return HttpResponse.json({ code: 0, data: mockSourceTypeOptions });
  }),
  http.get('/api/v1/filter-options/data-source-categories', () => {
    return HttpResponse.json({ code: 0, data: mockDataSourceCategories });
  }),
  http.get('/api/v1/filter-options/quality-domains', () => {
    return HttpResponse.json({ code: 0, data: mockQualityDomains });
  }),
  http.get('/api/v1/filter-options/standard-domains', () => {
    return HttpResponse.json({ code: 0, data: mockStandardDomains });
  }),
  http.get('/api/v1/filter-options/standard-databases', () => {
    return HttpResponse.json({ code: 0, data: mockStandardDatabases });
  }),
];
