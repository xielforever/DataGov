# DataGov Backend

DataGov 首期真实后端采用 Go 模块化单体起步，优先覆盖账号密码登录、数据源管理、脚本开发和 AI 助手。

## 本地启动

从仓库根目录执行：

```powershell
go run ./backend/cmd/datagov-api
```

默认读取仓库根目录 `.env.local`，连接远程 PostgreSQL 和 Redis。`.env.local` 不允许提交，示例配置见 `.env.example`。

如果从 `backend` 目录内执行命令，可以复制 `backend/.env.example` 为 `backend/.env.local`。

## 健康检查

```powershell
curl http://127.0.0.1:8080/api/v1/health
```

返回结构遵循前端 API 契约：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "ok",
    "checks": {
      "postgres": { "status": "ok" },
      "redis": { "status": "ok" },
      "migrations": { "status": "ok" }
    }
  }
}
```

## 认证接口

首期提供以下认证接口：

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

本地开发会按 `.env.local` 中的 `DATAGOV_BOOTSTRAP_ADMIN_*` 初始化默认管理员。不要把真实密码写入文档或提交到 Git。

## AI 助手接口

首期 AI Gateway 由 Go 后端直连 Anthropic-compatible 模型服务，前端不保存也不传递模型密钥：

- `GET /api/v1/ai/capabilities`
- `POST /api/v1/ai/assistant/messages`

本地通过 `.env.local` 配置 `ANTHROPIC_BASE_URL`、`ANTHROPIC_API_KEY`、`ANTHROPIC_MODEL`，默认模型为 `MiniMax-M3`。AI 请求会写入 `ai_sessions` 和 `ai_messages`，并在入模前做基础敏感信息脱敏。

## Migration

启动时默认执行 `backend/migrations/*.sql` 中尚未执行过的非破坏性 migration。

可通过环境变量关闭：

```text
DATAGOV_AUTO_MIGRATE=false
```

只执行迁移：

```powershell
go run ./backend/cmd/datagov-api --migrate-only
```

只校验迁移状态：

```powershell
go run ./backend/cmd/datagov-api --check-migrations
```

如果存在 pending migration，`--check-migrations` 会返回非零退出码，适合后续 CI 或发布前检查。
