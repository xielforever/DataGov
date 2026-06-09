import type {
  AuthUser, LoginRequestData, LoginResponseData,
  CreateQualityRuleData, CreateCheckBatchData, CreateReportData,
  CreateSensitiveScanTaskData, CreateAuditLogExportData,
  CreateBusinessDomainData, UpdateBusinessDomainData, RegisterAssetTablesData,
  CreateMetadataDataSourceData,
  CreateMetricData, UpdateMetricData, CreateServiceApiData,
  CreateStandardDefinitionData, UpdateStandardDefinitionData, CreateStandardMappingData,
  CreateSyncTaskData, ProcessApprovalData,
  CreateUserData, UpdateUserData, CreateRoleData, UpdateRoleData,
  CreateOrgData, UpdateOrgData, CreateNotificationData, UpdateSystemConfigData,
  CreateDictCategoryData, CreateDictItemData, UpdateDictItemData,
  CreateModelData, UpdateModelData,
  AiAssistantRequest, AiBehaviorEventData, AiConversation, AiConversationDetail,
  AiFeedbackData, AiPreference, AiContextPreview, AiTokenUsageOverview,
  AiObservabilityOverview, AiToolInfo, CreateAiConversationData, PreviewAiContextData, UpdateAiConversationData,
  AiAssistantResponse,
  IamPermission,
} from '../types/api';

// Use relative path so MSW can correctly intercept regardless of the preview environment or port
const BASE_URL = '/api/v1';
export const AUTH_TOKEN_STORAGE_KEY = 'datagov.auth.token';
export const AUTH_USER_STORAGE_KEY = 'datagov.auth.user';

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
}

export function getStoredAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function persistAuthSession(session: LoginResponseData) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem('datagov.authenticated');
}

function withAuthHeaders(options?: RequestInit) {
  const headers = new Headers(options?.headers);
  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...options, headers };
}

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${BASE_URL}${url}`, withAuthHeaders(options));
  let json: { code?: number; message?: string; data?: unknown } | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(json?.message || `Failed to fetch: ${response.statusText}`);
  }
  if (!json || json.code !== 0) {
    throw new Error(json?.message || 'API Error');
  }
  return json.data;
}

// Auth
export const login = (data: LoginRequestData) => fetchJson('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<LoginResponseData>;

export const fetchCurrentUser = () => fetchJson('/auth/me') as Promise<AuthUser>;

export const logout = () => fetchJson('/auth/logout', {
  method: 'POST'
}) as Promise<{ success: boolean }>;

// Home
export const fetchHomeGovernanceOverview = () => fetchJson('/home/governance-overview');

// AI Assistant
export const fetchAiCapabilities = () => fetchJson('/ai/capabilities');
export const askAiAssistant = (data: AiAssistantRequest) => fetchJson('/ai/assistant/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<AiAssistantResponse>;
export const fetchAiConversations = (params?: { search?: string; includeArchived?: boolean; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.includeArchived) query.set('includeArchived', 'true');
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return fetchJson(`/ai/conversations${suffix}`) as Promise<AiConversation[]>;
};
export const createAiConversation = (data: CreateAiConversationData) => fetchJson('/ai/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<AiConversation>;
export const fetchAiConversationDetail = (id: string) => fetchJson(`/ai/conversations/${id}`) as Promise<AiConversationDetail>;
export const updateAiConversation = (id: string, data: UpdateAiConversationData) => fetchJson(`/ai/conversations/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<AiConversation>;
export const sendAiConversationMessage = (conversationId: string, data: AiAssistantRequest) => fetchJson(`/ai/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<AiAssistantResponse>;
export const regenerateAiMessage = (messageId: string) => fetchJson(`/ai/messages/${messageId}/regenerate`, {
  method: 'POST'
}) as Promise<AiAssistantResponse>;
export const submitAiMessageFeedback = (messageId: string, data: AiFeedbackData) => fetchJson(`/ai/messages/${messageId}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<{ success: boolean }>;
export const recordAiBehaviorEvent = (data: AiBehaviorEventData) => fetchJson('/ai/behavior-events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<{ success: boolean }>;
export const fetchAiPreferences = () => fetchJson('/ai/preferences') as Promise<AiPreference>;
export const updateAiPreferences = (data: AiPreference) => fetchJson('/ai/preferences', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<AiPreference>;
export const previewAiContext = (data: PreviewAiContextData) => fetchJson('/ai/context/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}) as Promise<AiContextPreview>;
export const fetchAiTokenUsage = () => fetchJson('/ai/token-usage') as Promise<AiTokenUsageOverview>;
export const fetchAiTools = () => fetchJson('/ai/tools') as Promise<AiToolInfo[]>;
export const fetchAiObservability = () => fetchJson('/ai/observability') as Promise<AiObservabilityOverview>;

// Dashboard
export const fetchDashboardStats = () => fetchJson('/dashboard/stats').catch(() => []);
export const fetchDashboardRecentTables = () => fetchJson('/dashboard/recent-tables').catch(() => []);
export const fetchDashboardQualityTrends = () => fetchJson('/dashboard/quality-trends').catch(() => []);
export const fetchDashboardTasks = () => fetchJson('/dashboard/tasks').catch(() => []);

// Data Quality
export const fetchQualityRules = () => fetchJson('/quality/rules');
export const createQualityRule = (data: CreateQualityRuleData) => fetchJson('/quality/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateQualityRuleStatus = (id: string, status: string) => fetchJson(`/quality/rules/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchQualityRuleTemplates = () => fetchJson('/quality/rule-templates');
export const fetchQualityCheckBatches = () => fetchJson('/quality/check-batches');
export const fetchQualityCheckIssues = (batchId?: string) => fetchJson(batchId ? `/quality/check-issues?batchId=${batchId}` : '/quality/check-issues');
export const createQualityCheckBatch = (data: CreateCheckBatchData) => fetchJson('/quality/check-batches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateQualityIssueStatus = (id: string, status: string) => fetchJson(`/quality/check-issues/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchQualityMonitorOverview = () => fetchJson('/quality/monitor-overview');
export const fetchQualityMonitorTrends = () => fetchJson('/quality/monitor-trends');
export const fetchQualityMonitorAlerts = () => fetchJson('/quality/monitor-alerts');
export const fetchQualityMonitorRuleHealth = () => fetchJson('/quality/monitor-rule-health');
export const updateQualityMonitorAlertStatus = (id: string, status: string) => fetchJson(`/quality/monitor-alerts/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchQualityReportOverview = () => fetchJson('/quality/report-overview');
export const fetchQualityReportTrends = () => fetchJson('/quality/report-trends');
export const fetchQualityReportDomains = () => fetchJson('/quality/report-domains');
export const fetchQualityReportIssues = () => fetchJson('/quality/report-issues');
export const fetchQualityReportRemediation = () => fetchJson('/quality/report-remediation');
export const fetchQualityReportReports = () => fetchJson('/quality/reports');
export const createQualityReport = (data: CreateReportData) => fetchJson('/quality/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const exportQualityReport = (id: string) => fetchJson(`/quality/reports/${id}/export`, {
  method: 'POST'
});

// Data Security
export const fetchSecurityLevelOverview = () => fetchJson('/security/level-overview');
export const fetchSecurityLevelDistribution = () => fetchJson('/security/level-distribution');
export const fetchSecurityLevelRules = () => fetchJson('/security/level-rules');
export const fetchSecurityLevelAssets = () => fetchJson('/security/level-assets');
export const fetchSecurityLevelReviews = () => fetchJson('/security/level-reviews');
export const updateSecurityLevelReviewStatus = (id: string, status: string) => fetchJson(`/security/level-reviews/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchSensitiveScanOverview = () => fetchJson('/security/sensitive-scan-overview');
export const fetchSensitiveScanTasks = () => fetchJson('/security/sensitive-scan-tasks');
export const fetchSensitiveScanRules = () => fetchJson('/security/sensitive-scan-rules');
export const fetchSensitiveScanFindings = () => fetchJson('/security/sensitive-scan-findings');
export const createSensitiveScanTask = (data: CreateSensitiveScanTaskData) => fetchJson('/security/sensitive-scan-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateSensitiveFindingStatus = (id: string, status: string) => fetchJson(`/security/sensitive-scan-findings/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchDataMaskOverview = () => fetchJson('/security/data-mask-overview');
export const fetchDataMaskPolicies = () => fetchJson('/security/data-mask-policies');
export const fetchDataMaskRules = () => fetchJson('/security/data-mask-rules');
export const fetchDataMaskValidations = () => fetchJson('/security/data-mask-validations');
export const updateDataMaskPolicyStatus = (id: string, status: string) => fetchJson(`/security/data-mask-policies/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchAccessControlOverview = () => fetchJson('/security/access-overview');
export const fetchAccessControlPolicies = () => fetchJson('/security/access-policies');
export const fetchAccessControlApplications = () => fetchJson('/security/access-applications');
export const fetchAccessControlGrants = () => fetchJson('/security/access-grants');
export const fetchAccessControlRisks = () => fetchJson('/security/access-risks');
export const processAccessApplication = (id: string, action: 'approve' | 'reject') => fetchJson(`/security/access-applications/${id}/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action })
});
export const revokeAccessGrant = (id: string) => fetchJson(`/security/access-grants/${id}/revoke`, {
  method: 'POST'
});
export const fetchAuditLogOverview = () => fetchJson('/security/audit-overview');
export const fetchAuditLogEvents = (params?: { keyword?: string; result?: string; risk?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.result) search.set('result', params.result);
  if (params?.risk) search.set('risk', params.risk);
  const query = search.toString();
  return fetchJson(query ? `/security/audit-events?${query}` : '/security/audit-events');
};
export const fetchAuditLogRisks = () => fetchJson('/security/audit-risks');
export const updateAuditLogRiskStatus = (id: string, status: string) => fetchJson(`/security/audit-risks/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchAuditLogExports = () => fetchJson('/security/audit-exports');
export const createAuditLogExport = (data: CreateAuditLogExportData) => fetchJson('/security/audit-exports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchAuditLogRetentionPolicies = () => fetchJson('/security/audit-retention-policies');

// Business Domain
export const fetchBusinessDomains = (params?: { status?: string; keyword?: string }) => {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.keyword) search.set('keyword', params.keyword);
  const query = search.toString();
  return fetchJson(query ? `/business-domains?${query}` : '/business-domains');
};
export const fetchBusinessDomainOptions = () => fetchJson('/business-domains/options');
export const createBusinessDomain = (data: CreateBusinessDomainData) => fetchJson('/business-domains', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateBusinessDomain = (id: string, data: UpdateBusinessDomainData) => fetchJson(`/business-domains/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateBusinessDomainStatus = (id: string, status: string) => fetchJson(`/business-domains/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});

// Asset Overview
export const fetchAssetCoreMetrics = () => fetchJson('/assets/core-metrics');
export const fetchAssetLayerDistribution = () => fetchJson('/assets/layer-distribution');
export const fetchAssetBusinessDomains = () => fetchJson('/assets/business-domains');
export const fetchAssetDataSources = () => fetchJson('/assets/data-sources');
export const fetchAssetGrowthTrend = () => fetchJson('/assets/growth-trend');
export const fetchAssetHealthMetrics = () => fetchJson('/assets/health-metrics');
export const fetchAssetHotAssets = () => fetchJson('/assets/hot-assets');
export const fetchAssetPendingItems = () => fetchJson('/assets/pending-items');
export const fetchAssetCatalog = (params?: {
  keyword?: string;
  domains?: string[];
  layers?: string[];
  sensitivities?: string[];
  sources?: string[];
  tags?: string[];
  certified?: boolean;
  sortField?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  params?.domains?.forEach((value) => search.append('domain', value));
  params?.layers?.forEach((value) => search.append('layer', value));
  params?.sensitivities?.forEach((value) => search.append('sensitivity', value));
  params?.sources?.forEach((value) => search.append('source', value));
  params?.tags?.forEach((value) => search.append('tag', value));
  if (params?.certified) search.set('certified', 'true');
  if (params?.sortField) search.set('sortField', params.sortField);
  if (params?.sortOrder) search.set('sortOrder', params.sortOrder);
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const query = search.toString();
  return fetchJson(query ? `/assets/catalog?${query}` : '/assets/catalog');
};
export const fetchAssetCatalogDetail = (id: string) => fetchJson(`/assets/catalog/${id}/detail`);
export const fetchAssetRegisterOptions = () => fetchJson('/assets/register-options');
export const registerAssetTables = (data: RegisterAssetTablesData) => fetchJson('/assets/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchLineageData = (center?: string) => fetchJson(center ? `/assets/lineage?center=${center}` : '/assets/lineage');
export const fetchMapData = () => fetchJson('/assets/map');

// Metadata
export const fetchMetadataDataSources = () => fetchJson('/metadata/data-sources');
export const createMetadataDataSource = (data: CreateMetadataDataSourceData) => fetchJson('/metadata/data-sources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const syncMetadataDataSource = (id: string) => fetchJson(`/metadata/data-sources/${id}/sync`, {
  method: 'POST'
});
export const updateMetadataDataSourceStatus = (id: string, status: string) => fetchJson(`/metadata/data-sources/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchMetadataQueryData = () => fetchJson('/metadata/query');
export const fetchMetadataMaintainData = () => fetchJson('/metadata/maintain');

// Data Service — Metric Manage
export const fetchMetricOverview = () => fetchJson('/service/metric-overview');
export const fetchMetrics = (params?: { keyword?: string; type?: string; category?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.type) search.set('type', params.type);
  if (params?.category) search.set('category', params.category);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/service/metrics?${query}` : '/service/metrics');
};
export const createMetric = (data: CreateMetricData) => fetchJson('/service/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateMetricStatus = (id: string, status: string) => fetchJson(`/service/metrics/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchMetricCategories = () => fetchJson('/service/metric-categories');

// Data Service — API Management
export const fetchServiceApiOverview = () => fetchJson('/service/api-overview');
export const fetchServiceApis = (params?: { keyword?: string; status?: string; category?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  if (params?.category) search.set('category', params.category);
  const query = search.toString();
  return fetchJson(query ? `/service/apis?${query}` : '/service/apis');
};
export const createServiceApi = (data: CreateServiceApiData) => fetchJson('/service/apis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateServiceApiStatus = (id: string, status: string) => fetchJson(`/service/apis/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});

// Data Service — Data Sharing
export const fetchDataSharingOverview = () => fetchJson('/service/sharing-overview');
export const fetchServiceShares = (params?: { keyword?: string; level?: string; type?: string; category?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.level) search.set('level', params.level);
  if (params?.type) search.set('type', params.type);
  if (params?.category) search.set('category', params.category);
  const query = search.toString();
  return fetchJson(query ? `/service/shares?${query}` : '/service/shares');
};
export const applyShareAsset = (id: string) => fetchJson(`/service/shares/${id}/apply`, {
  method: 'POST'
});

// Data Standard
export const fetchStandardDefinitions = () => fetchJson('/standard/definitions');
export const createStandardDefinition = (data: CreateStandardDefinitionData) => fetchJson('/standard/definitions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateStandardDefinition = (id: string, data: UpdateStandardDefinitionData) => fetchJson(`/standard/definitions/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const offlineStandardDefinition = (id: string) => fetchJson(`/standard/definitions/${id}/offline`, {
  method: 'POST'
});
export const importStandardDefinitions = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetchJson('/standard/definitions/import', {
    method: 'POST',
    body: formData
  });
};
export const fetchStandardMappings = () => fetchJson('/standard/mappings');
export const updateStandardMappingStatus = (id: string, status: string) => fetchJson(`/standard/mappings/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const rescanStandardMappings = () => fetchJson('/standard/mappings/rescan', {
  method: 'POST'
});
export const createManualMapping = (data: any) => fetchJson('/standard/mappings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchStandardEvaluations = () => fetchJson('/standard/evaluations');
export const triggerStandardEvaluation = () => fetchJson('/standard/evaluations/run', {
  method: 'POST'
});
export const exportStandardEvalReport = () => fetchJson('/standard/evaluations/export', {
  method: 'POST'
});
export const fetchDictCategories = () => fetchJson('/standard/dictionaries/categories');
export const createDictCategory = (data: CreateDictCategoryData) => fetchJson('/standard/dictionaries/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchDictItems = (code: string) => fetchJson(`/standard/dictionaries/${code}/items`);
export const createDictItem = (code: string, data: CreateDictItemData) => fetchJson(`/standard/dictionaries/${code}/items`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateDictItem = (code: string, itemId: string, data: any) => fetchJson(`/standard/dictionaries/${code}/items/${itemId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteDictItem = (code: string, itemId: string) => fetchJson(`/standard/dictionaries/${code}/items/${itemId}`, {
  method: 'DELETE'
});

// Code Manage
export const fetchCodeSets = () => fetchJson('/standard/codes');
export const createCodeSet = (data: any) => fetchJson('/standard/codes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateCodeSet = (id: string, data: any) => fetchJson(`/standard/codes/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteCodeSet = (id: string) => fetchJson(`/standard/codes/${id}`, {
  method: 'DELETE'
});
export const cloneCodeSet = (id: string) => fetchJson(`/standard/codes/${id}/clone`, {
  method: 'POST'
});
export const importCodeSets = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetchJson('/standard/codes/import', {
    method: 'POST',
    body: formData
  });
};
export const fetchCodeValues = (code: string) => fetchJson(`/standard/codes/${code}/values`);
export const createCodeValue = (code: string, data: any) => fetchJson(`/standard/codes/${code}/values`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateCodeValue = (code: string, id: string, data: any) => fetchJson(`/standard/codes/${code}/values/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteCodeValue = (code: string, id: string) => fetchJson(`/standard/codes/${code}/values/${id}`, {
  method: 'DELETE'
});

// Data Development
export const fetchModels = () => fetchJson('/development/models');
export const createModel = (data: CreateModelData) => fetchJson('/development/models', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateModel = (id: string, data: UpdateModelData) => fetchJson(`/development/models/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteModel = (id: string) => fetchJson(`/development/models/${id}`, {
  method: 'DELETE'
});
export const updateModelStatus = (id: string, status: string) => fetchJson(`/development/models/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const applyModelSync = (id: string, reason: string) => fetchJson(`/development/models/${id}/sync`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reason })
});
export const fetchModelSyncLogs = (id: string) => fetchJson(`/development/models/${id}/sync-logs`);
export const fetchTaskScheduleOverview = () => fetchJson('/development/task-schedule-overview');
export const fetchTaskSchedules = (params?: { keyword?: string; status?: string; cycle?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  if (params?.cycle) search.set('cycle', params.cycle);
  const query = search.toString();
  return fetchJson(query ? `/development/task-schedules?${query}` : '/development/task-schedules');
};
export const updateTaskScheduleStatus = (id: string, status: string) => fetchJson(`/development/task-schedules/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const runTaskSchedule = (id: string) => fetchJson(`/development/task-schedules/${id}/run`, {
  method: 'POST'
});
export const fetchTaskScheduleDependencies = () => fetchJson('/development/task-schedule-dependencies');
export const fetchTaskScheduleCalendars = () => fetchJson('/development/task-schedule-calendars');
export const fetchTaskScheduleBackfills = () => fetchJson('/development/task-schedule-backfills');
export const createTaskScheduleBackfill = (data: any) => fetchJson('/development/task-schedule-backfills', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchTaskOpsOverview = () => fetchJson('/development/task-ops-overview');
export const fetchTaskOpsInstances = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/development/task-ops-instances?${query}` : '/development/task-ops-instances');
};
export const rerunTaskInstance = (id: string) => fetchJson(`/development/task-ops-instances/${id}/rerun`, {
  method: 'POST'
});
export const stopTaskInstance = (id: string) => fetchJson(`/development/task-ops-instances/${id}/stop`, {
  method: 'POST'
});
export const fetchTaskOpsLogs = (instanceId?: string) => fetchJson(instanceId ? `/development/task-ops-logs?instanceId=${instanceId}` : '/development/task-ops-logs');
export const fetchTaskOpsRecoveryPlans = () => fetchJson('/development/task-ops-recovery-plans');
export const updateTaskOpsRecoveryPlanStatus = (id: string, status: string) => fetchJson(`/development/task-ops-recovery-plans/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchTaskOpsAlerts = () => fetchJson('/development/task-ops-alerts');
export const updateTaskOpsAlertStatus = (id: string, status: string) => fetchJson(`/development/task-ops-alerts/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchTaskOpsQueues = () => fetchJson('/development/task-ops-queues');

// System Management
export const fetchIamPermissions = () => fetchJson('/iam/permissions') as Promise<IamPermission[]>;
export const fetchIamRolePermissions = (roleId: string) => fetchJson(`/iam/roles/${roleId}/permissions`) as Promise<string[]>;
export const updateIamRolePermissions = (roleId: string, permissions: string[]) => fetchJson(`/iam/roles/${roleId}/permissions`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ permissions })
}) as Promise<string[]>;
export const fetchUserManageOverview = () => fetchJson('/system/user-overview');
export const fetchSystemUsers = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/system/users?${query}` : '/system/users');
};
export const updateSystemUserStatus = (id: string, status: string) => fetchJson(`/system/users/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchUserLoginPolicies = () => fetchJson('/system/user-login-policies');
export const fetchUserOrgBindings = () => fetchJson('/system/user-org-bindings');
export const fetchUserRiskAccounts = () => fetchJson('/system/user-risk-accounts');
export const updateUserRiskAccountStatus = (id: string, status: string) => fetchJson(`/system/user-risk-accounts/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchRoleManageOverview = () => fetchJson('/system/role-overview');
export const fetchSystemRoles = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/system/roles?${query}` : '/system/roles');
};
export const updateSystemRoleStatus = (id: string, status: string) => fetchJson(`/system/roles/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchRolePermissionGroups = (roleId?: string) => fetchJson(roleId ? `/system/role-permission-groups?roleId=${roleId}` : '/system/role-permission-groups');
export const fetchRoleDataScopes = (roleId?: string) => fetchJson(roleId ? `/system/role-data-scopes?roleId=${roleId}` : '/system/role-data-scopes');
export const fetchRoleMembers = (roleId?: string) => fetchJson(roleId ? `/system/role-members?roleId=${roleId}` : '/system/role-members');
export const fetchRoleRisks = (roleId?: string) => fetchJson(roleId ? `/system/role-risks?roleId=${roleId}` : '/system/role-risks');
export const updateRoleRiskStatus = (id: string, status: string) => fetchJson(`/system/role-risks/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchOrgManageOverview = () => fetchJson('/system/org-overview');
export const fetchSystemOrgs = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/system/orgs?${query}` : '/system/orgs');
};
export const updateSystemOrgStatus = (id: string, status: string) => fetchJson(`/system/orgs/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchOrgResponsibilities = (orgId?: string) => fetchJson(orgId ? `/system/org-responsibilities?orgId=${orgId}` : '/system/org-responsibilities');
export const fetchOrgStewards = (orgId?: string) => fetchJson(orgId ? `/system/org-stewards?orgId=${orgId}` : '/system/org-stewards');
export const fetchOrgChanges = (orgId?: string) => fetchJson(orgId ? `/system/org-changes?orgId=${orgId}` : '/system/org-changes');
export const updateOrgChangeStatus = (id: string, status: string) => fetchJson(`/system/org-changes/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchNotificationOverview = () => fetchJson('/system/notification-overview');
export const fetchNotificationTemplates = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/system/notification-templates?${query}` : '/system/notification-templates');
};
export const updateNotificationTemplateStatus = (id: string, status: string) => fetchJson(`/system/notification-templates/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchNotificationSubscriptions = (templateId?: string) => fetchJson(templateId ? `/system/notification-subscriptions?templateId=${templateId}` : '/system/notification-subscriptions');
export const fetchNotificationChannels = () => fetchJson('/system/notification-channels');
export const fetchNotificationMessages = (templateId?: string) => fetchJson(templateId ? `/system/notification-messages?templateId=${templateId}` : '/system/notification-messages');
export const updateNotificationMessageStatus = (id: string, status: string) => fetchJson(`/system/notification-messages/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchOperationLogOverview = () => fetchJson('/system/operation-log-overview');
export const fetchOperationLogEvents = (params?: { keyword?: string; risk?: string; result?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.risk) search.set('risk', params.risk);
  if (params?.result) search.set('result', params.result);
  const query = search.toString();
  return fetchJson(query ? `/system/operation-log-events?${query}` : '/system/operation-log-events');
};
export const updateOperationLogEventStatus = (id: string, status: string) => fetchJson(`/system/operation-log-events/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchOperationLogObjects = () => fetchJson('/system/operation-log-objects');
export const fetchOperationLogDiffs = (eventId?: string) => fetchJson(eventId ? `/system/operation-log-diffs?eventId=${eventId}` : '/system/operation-log-diffs');
export const fetchOperationLogExports = () => fetchJson('/system/operation-log-exports');
export const createOperationLogExport = (data: any) => fetchJson('/system/operation-log-exports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchSystemConfigOverview = () => fetchJson('/system/config-overview');
export const fetchSystemConfigParams = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/system/config-params?${query}` : '/system/config-params');
};
export const updateSystemConfigParamStatus = (id: string, status: string) => fetchJson(`/system/config-params/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchSystemConfigIntegrations = () => fetchJson('/system/config-integrations');
export const fetchSystemRuntimeSwitches = () => fetchJson('/system/runtime-switches');
export const updateSystemRuntimeSwitchStatus = (id: string, status: string) => fetchJson(`/system/runtime-switches/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchSystemEnvironmentPolicies = () => fetchJson('/system/environment-policies');
export const fetchSystemConfigChanges = () => fetchJson('/system/config-changes');
export const updateSystemConfigChangeStatus = (id: string, status: string) => fetchJson(`/system/config-changes/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});

// Approvals
export const fetchApprovals = () => fetchJson('/approvals');
export const processApproval = (id: string, action: 'approve' | 'reject') => fetchJson(`/approvals/${id}/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action })
});

// Development Scripts
export const fetchScripts = () => fetchJson('/development/scripts');
export const createScript = (data: any) => fetchJson('/development/scripts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateScript = (id: string, data: any) => fetchJson(`/development/scripts/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const runScript = (id: string) => fetchJson(`/development/scripts/${id}/run`, {
  method: 'POST'
});
export const publishScript = (id: string) => fetchJson(`/development/scripts/${id}/publish`, {
  method: 'POST'
});
export const fetchScriptVersions = (id: string) => fetchJson(`/development/scripts/${id}/versions`);

// Data Sync
export const fetchSyncOverview = () => fetchJson('/development/sync-overview');
export const fetchSyncTasks = (params?: { keyword?: string; status?: string; syncType?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  if (params?.syncType) search.set('syncType', params.syncType);
  const query = search.toString();
  return fetchJson(query ? `/development/sync-tasks?${query}` : '/development/sync-tasks');
};
export const updateSyncTaskStatus = (id: string, status: string) => fetchJson(`/development/sync-tasks/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const fetchSyncLogs = (taskId?: string) => fetchJson(taskId ? `/development/sync-logs?taskId=${taskId}` : '/development/sync-logs');

// Realtime Compute (Flink)
export const fetchFlinkOverview = () => fetchJson('/development/flink-overview');
export const fetchFlinkTasks = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/development/flink-tasks?${query}` : '/development/flink-tasks');
};
export const updateFlinkTaskStatus = (id: string, status: string) => fetchJson(`/development/flink-tasks/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});

// Task Orchestration
export const fetchOrchestrations = () => fetchJson('/development/orchestrations');
export const fetchDagNodes = (orchestrationId?: string) => fetchJson(orchestrationId ? `/development/dag-nodes?orchestrationId=${orchestrationId}` : '/development/dag-nodes');
export const fetchDagRunHistory = (orchestrationId?: string) => fetchJson(orchestrationId ? `/development/dag-run-history?orchestrationId=${orchestrationId}` : '/development/dag-run-history');
export const updateOrchestrationStatus = (id: string, status: string) => fetchJson(`/development/orchestrations/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});
export const runOrchestration = (id: string) => fetchJson(`/development/orchestrations/${id}/run`, {
  method: 'POST'
});

// Metadata Collect
export const fetchCollectTasks = (params?: { keyword?: string; status?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword) search.set('keyword', params.keyword);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return fetchJson(query ? `/metadata/collect-tasks?${query}` : '/metadata/collect-tasks');
};
export const fetchCollectRecords = (taskId?: string) => fetchJson(taskId ? `/metadata/collect-records?taskId=${taskId}` : '/metadata/collect-records');
export const fetchCollectRules = () => fetchJson('/metadata/collect-rules');
export const createCollectTask = (data: any) => fetchJson('/metadata/collect-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateCollectTaskStatus = (id: string, status: string) => fetchJson(`/metadata/collect-tasks/${id}/status`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
});

// Operations Monitor
export const fetchOpsServices = () => fetchJson('/ops/services');
export const fetchOpsAlerts = (resolved?: boolean) => {
  const params = resolved !== undefined ? `?resolved=${resolved}` : '';
  return fetchJson(`/ops/alerts${params}`);
};
export const resolveOpsAlert = (id: string) => fetchJson(`/ops/alerts/${id}/resolve`, {
  method: 'POST'
});

// Metadata Models
export const fetchMetadataModels = () => fetchJson('/metadata/models');
export const updateMetadataModel = (id: string, data: UpdateModelData) => fetchJson(`/metadata/models/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Filter Options
export const fetchDataLayers = () => fetchJson('/filter-options/data-layers');
export const fetchSensitivities = () => fetchJson('/filter-options/sensitivities');
export const fetchTagOptions = () => fetchJson('/filter-options/tag-options');
export const fetchSourceTypes = () => fetchJson('/filter-options/source-types');
export const fetchDataSourceCategories = () => fetchJson('/filter-options/data-source-categories');
export const fetchQualityDomains = () => fetchJson('/filter-options/quality-domains');
export const fetchStandardDomains = () => fetchJson('/filter-options/standard-domains');
export const fetchStandardDatabases = () => fetchJson('/filter-options/standard-databases');
