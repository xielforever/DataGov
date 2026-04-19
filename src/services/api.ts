// Use relative path so MSW can correctly intercept regardless of the preview environment or port
const BASE_URL = '/api/v1';

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}${url}`, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const json = await response.json();
  if (json.code !== 0) {
    throw new Error(json.message || 'API Error');
  }
  return json.data;
}

// Dashboard
export const fetchDashboardStats = () => fetchJson('/dashboard/stats').catch(() => []);
export const fetchDashboardRecentTables = () => fetchJson('/dashboard/recent-tables').catch(() => []);
export const fetchDashboardQualityTrends = () => fetchJson('/dashboard/quality-trends').catch(() => []);
export const fetchDashboardTasks = () => fetchJson('/dashboard/tasks').catch(() => []);

// Asset Overview
export const fetchAssetCoreMetrics = () => fetchJson('/assets/core-metrics');
export const fetchAssetLayerDistribution = () => fetchJson('/assets/layer-distribution');
export const fetchAssetBusinessDomains = () => fetchJson('/assets/business-domains');
export const fetchAssetDataSources = () => fetchJson('/assets/data-sources');
export const fetchAssetGrowthTrend = () => fetchJson('/assets/growth-trend');
export const fetchAssetHealthMetrics = () => fetchJson('/assets/health-metrics');
export const fetchAssetHotAssets = () => fetchJson('/assets/hot-assets');
export const fetchAssetPendingItems = () => fetchJson('/assets/pending-items');
export const fetchLineageData = (center?: string) => fetchJson(center ? `/assets/lineage?center=${center}` : '/assets/lineage');
export const fetchMapData = () => fetchJson('/assets/map');

// Metadata
export const fetchMetadataDataSources = () => fetchJson('/metadata/data-sources');
export const fetchMetadataQueryData = () => fetchJson('/metadata/query');
export const fetchMetadataMaintainData = () => fetchJson('/metadata/maintain');

// Data Service
export const fetchServiceApis = () => fetchJson('/service/apis');
export const fetchServiceShares = () => fetchJson('/service/shares');

// Data Standard
export const fetchStandardDefinitions = () => fetchJson('/standard/definitions');
export const createStandardDefinition = (data: any) => fetchJson('/standard/definitions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateStandardDefinition = (id: string, data: any) => fetchJson(`/standard/definitions/${id}`, {
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
export const createDictCategory = (data: any) => fetchJson('/standard/dictionaries/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const fetchDictItems = (code: string) => fetchJson(`/standard/dictionaries/${code}/items`);
export const createDictItem = (code: string, data: any) => fetchJson(`/standard/dictionaries/${code}/items`, {
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
export const createModel = (data: any) => fetchJson('/development/models', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateModel = (id: string, data: any) => fetchJson(`/development/models/${id}`, {
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

