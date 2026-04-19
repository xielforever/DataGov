import { http, HttpResponse } from 'msw';
import { 
  mockDashboardStats,
  mockDashboardRecentTables,
  mockDashboardQualityTrends,
  mockDashboardTasks,
  mockAssetCoreMetrics,
  mockAssetLayerDistribution,
  mockAssetBusinessDomains,
  mockAssetDataSources,
  mockAssetGrowthTrend,
  mockAssetHealthMetrics,
  mockAssetHotAssets,
  mockAssetPendingItems,
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
  mockScriptVersions
} from './data';

export const handlers = [
  // Health check
  http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok' })),

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

  // Asset Overview endpoints
  http.get('/api/v1/assets/core-metrics', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetCoreMetrics
    });
  }),

  http.get('/api/v1/assets/layer-distribution', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetLayerDistribution
    });
  }),

  http.get('/api/v1/assets/business-domains', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetBusinessDomains
    });
  }),

  http.get('/api/v1/assets/data-sources', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetDataSources
    });
  }),

  http.get('/api/v1/assets/growth-trend', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetGrowthTrend
    });
  }),

  http.get('/api/v1/assets/health-metrics', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetHealthMetrics
    });
  }),

  http.get('/api/v1/assets/hot-assets', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetHotAssets
    });
  }),

  http.get('/api/v1/assets/pending-items', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAssetPendingItems
    });
  }),

  http.get('/api/v1/assets/lineage', ({ request }) => {
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
    return HttpResponse.json({
      code: 0,
      data: mockMapData
    });
  }),

  // Metadata endpoints
  http.get('/api/v1/metadata/data-sources', () => {
    return HttpResponse.json({
      code: 0,
      data: mockAllDataSources
    });
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
    return HttpResponse.json({ code: 0, data: mockApprovals });
  }),
  http.post('/api/v1/approvals/:id/process', async ({ request, params }) => {
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
    return HttpResponse.json({ code: 0, data: mockScripts });
  }),
  http.post('/api/v1/development/scripts', async ({ request }) => {
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
    return HttpResponse.json({
      code: 0,
      data: {
        logs: ['Job started...', 'Running query...', 'Success in 2.3s'],
        data: [{ id: 1, name: 'Test Result' }]
      }
    });
  }),
  http.post('/api/v1/development/scripts/:id/publish', async ({ params }) => {
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
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const versions = mockScriptVersions.filter(v => v.scriptId === id);
    return HttpResponse.json({ code: 0, data: versions });
  }),
];
