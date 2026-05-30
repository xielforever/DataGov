// Shared API types for DataGov

export interface CreateQualityRuleData {
  name: string;
  category: string;
  severity: string;
  dataSource: string;
  tableName: string;
  fieldName: string;
  checkExpression: string;
  threshold: string;
  schedule: string;
  description?: string;
}

export interface CreateCheckBatchData {
  name: string;
  ruleIds: string[];
  schedule?: string;
}

export interface CreateReportData {
  name: string;
  period: string;
  domains?: string[];
}

export interface CreateSensitiveScanTaskData {
  name: string;
  ruleIds: string[];
  targetSources: string[];
  scope: string;
}

export interface CreateAuditLogExportData {
  startTime: string;
  endTime: string;
  format: string;
  filters?: Record<string, string>;
}

export interface CreateBusinessDomainData {
  name: string;
  code: string;
  parentId?: string;
  owner?: string;
  description?: string;
}

export interface UpdateBusinessDomainData {
  name?: string;
  owner?: string;
  description?: string;
  status?: string;
}

export interface RegisterAssetTablesData {
  dataSourceId: string;
  tables: Array<{ name: string; database: string; schema?: string }>;
  domain?: string;
}

export interface CreateMetadataDataSourceData {
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  env: string;
  description?: string;
}

export interface CreateMetricData {
  name: string;
  code: string;
  category: string;
  unit: string;
  formula: string;
  description?: string;
  owner?: string;
}

export interface UpdateMetricData {
  name?: string;
  category?: string;
  unit?: string;
  formula?: string;
  description?: string;
  status?: string;
}

export interface CreateServiceApiData {
  name: string;
  path: string;
  method: string;
  dataSource: string;
  description?: string;
  rateLimit?: number;
}

export interface CreateStandardDefinitionData {
  code: string;
  name: string;
  domain: string;
  type: string;
  length: number | string;
  description?: string;
}

export interface UpdateStandardDefinitionData {
  name?: string;
  domain?: string;
  type?: string;
  length?: number | string;
  description?: string;
  status?: string;
}

export interface CreateStandardMappingData {
  standardId: string;
  database: string;
  tableName: string;
  fieldName: string;
  transformRule?: string;
}

export interface CreateSyncTaskData {
  name: string;
  sourceId: string;
  targetId: string;
  syncType: string;
  schedule?: string;
  description?: string;
}

export interface ProcessApprovalData {
  action: 'approve' | 'reject';
  comment?: string;
}

export interface CreateUserData {
  username: string;
  name: string;
  email: string;
  roleIds: string[];
  orgId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleIds?: string[];
  orgId?: string;
  status?: string;
}

export interface CreateRoleData {
  name: string;
  code: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
  status?: string;
}

export interface CreateOrgData {
  name: string;
  code: string;
  parentId?: string;
  managerId?: string;
  description?: string;
}

export interface UpdateOrgData {
  name?: string;
  managerId?: string;
  description?: string;
  status?: string;
}

export interface CreateNotificationData {
  title: string;
  content: string;
  type: string;
  targetUsers?: string[];
}

export interface UpdateSystemConfigData {
  value: string;
  description?: string;
}

export interface CreateDictCategoryData {
  name: string;
  code: string;
  parentId?: string;
  description?: string;
}

export interface CreateDictItemData {
  itemValue: string;
  itemLabel: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

export interface UpdateDictItemData {
  itemLabel?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

export interface CreateModelData {
  name: string;
  domain: string;
  type: string;
  layer: string;
  dataSourceId: string;
  description?: string;
}

export interface UpdateModelData {
  name?: string;
  domain?: string;
  description?: string;
  entities?: any[];
  relationships?: any[];
}
