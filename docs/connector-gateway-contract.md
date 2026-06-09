# Connector Gateway Contract

DataGov 不内置外部源数据执行代理。除平台后台库直连外，连接测试、元数据采集、血缘采集和后续任务执行都应通过独立 Connector Gateway / CDM 类项目承载。

## Boundary

- DataGov 保存数据源注册、采集任务、资产快照、字段快照、血缘摘要和审计结果。
- Connector Gateway 负责连接外部源、执行探测、采集元数据、解析血缘和回调任务状态。
- DataGov 后端无 Gateway 配置时只读取平台库内样例快照；前端可通过 MSW fallback 保持页面可用。
- AI 工具只能读取 DataGov 已落库的只读摘要，不能绕过业务 service 直连外部源。

## Endpoints

### Connection Test

`POST /gateway/v1/connections/test`

Request:

```json
{
  "requestId": "req_xxx",
  "dataSourceId": "ds_xxx",
  "type": "PostgreSQL",
  "endpoint": {
    "host": "10.0.0.10",
    "port": 5432,
    "database": "demo"
  },
  "secretRef": "vault://datagov/ds_xxx/v3",
  "timeoutSeconds": 10
}
```

Response:

```json
{
  "status": "ok",
  "latencyMs": 42,
  "message": "connection ok",
  "checkedAt": "2026-06-09T03:00:00Z",
  "sample": {
    "version": "PostgreSQL 16",
    "schemas": 4,
    "tables": 128
  }
}
```

### Metadata Collect

`POST /gateway/v1/metadata/collect`

Request:

```json
{
  "taskId": "collect_xxx",
  "dataSourceId": "ds_xxx",
  "scope": {
    "schemas": ["public"],
    "tables": ["orders", "users"]
  },
  "mode": "snapshot",
  "callbackUrl": "https://datagov.example.com/api/v1/gateway/callbacks/metadata"
}
```

Callback payload:

```json
{
  "taskId": "collect_xxx",
  "status": "succeeded",
  "startedAt": "2026-06-09T03:00:00Z",
  "finishedAt": "2026-06-09T03:00:08Z",
  "summary": {
    "tables": 2,
    "columns": 42,
    "newTables": 1,
    "changedTables": 1
  },
  "snapshotUri": "s3://gateway-snapshots/collect_xxx.json"
}
```

### Lineage Collect

`POST /gateway/v1/lineage/collect`

Request:

```json
{
  "taskId": "lineage_xxx",
  "dataSourceId": "ds_xxx",
  "assetIds": ["asset-dwd-order-detail"],
  "depth": {
    "upstream": 2,
    "downstream": 2
  },
  "callbackUrl": "https://datagov.example.com/api/v1/gateway/callbacks/lineage"
}
```

Callback payload:

```json
{
  "taskId": "lineage_xxx",
  "status": "succeeded",
  "summary": {
    "nodes": 8,
    "edges": 12,
    "fieldEdges": 36
  },
  "snapshotUri": "s3://gateway-snapshots/lineage_xxx.json"
}
```

## Security

- DataGov 传递 `secretRef`，不把明文密码发送到日志、AI、前端或回调结果。
- Gateway 与 DataGov 使用 mTLS 或 HMAC 签名，签名头建议为 `X-Datagov-Signature`。
- Gateway 回调必须幂等，使用 `taskId + statusVersion` 去重。
- 回调只允许摘要和快照 URI，不允许携带业务数据样本值。

## Current DataGov Placeholder

- 当前 Sprint 2 先落库 `business_domains`、`asset_tables`、`asset_columns`、`lineage_edges`，作为 Gateway 未接入前的资产快照。
- `/api/v1/assets/*` 和 `/api/v1/business-domains/*` 读取平台库快照。
- 后续接入 Gateway 时，新增 client interface 和回调 handler，不改变前端页面主 API。
