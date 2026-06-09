# DataGov 本地开发运行指南

本文档用于下一阶段生产化加固开发，目标是让前端、Go 后端、远程 PostgreSQL、Redis 和 MiniMax 配置都能被稳定复现。真实密钥只允许写入本地 `.env.local` 或当前 shell 环境变量，不得提交到 Git。

## 1. 依赖

- Node.js 与 npm：用于 React/Vite 前端。
- Go 1.22+：用于 `backend` Go API。
- 远程 PostgreSQL：平台后台库 `datagov`，样例数据源库 `datagov_sample`。
- 远程 Redis：开发期使用独立 DB 和 key prefix。
- MiniMax Anthropic-compatible API：仅后端读取 token，前端不保存、不传递。

## 2. 配置

从仓库根目录复制配置样例：

```powershell
Copy-Item .env.example .env.local
```

如果只在 `backend` 目录内执行 Go 命令，也可以复制后端样例：

```powershell
Copy-Item backend\.env.example backend\.env.local
```

必须本地填写的字段：

- `DATAGOV_DATABASE_URL`
- `DATAGOV_SAMPLE_DATABASE_URL`
- `DATAGOV_BOOTSTRAP_ADMIN_PASSWORD`
- `ANTHROPIC_API_KEY` 或 `MINIMAX_API_KEY`

AI 生产加固相关变量可按本地成本预算调整：

- `DATAGOV_AI_DAILY_QUOTA_TOKENS`：单用户每日 Token 预算。
- `DATAGOV_AI_USER_RATE_LIMIT_PER_MINUTE`：单用户每分钟请求上限。
- `DATAGOV_AI_GLOBAL_RATE_LIMIT_PER_MINUTE`：全局与模型维度每分钟请求上限。
- `DATAGOV_AI_REDIS_KEY_PREFIX`：AI 限流 Redis key 前缀，建议与平台 Redis 前缀隔离。

不要把真实 token、数据库密码、SSH 密码或完整连接串写入文档、截图、测试报告或提交记录。

## 3. 启动后端

从仓库根目录启动：

```powershell
go run ./backend/cmd/datagov-api
```

只执行数据库迁移：

```powershell
go run ./backend/cmd/datagov-api --migrate-only
```

只校验迁移是否全部应用：

```powershell
go run ./backend/cmd/datagov-api --check-migrations
```

后端默认监听：

```text
http://127.0.0.1:8080
```

健康检查：

```powershell
curl http://127.0.0.1:8080/api/v1/health
```

返回中 `checks.postgres`、`checks.redis`、`checks.migrations` 应分别展示依赖状态、耗时和错误信息。

## 4. 启动前端

从仓库根目录启动：

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

访问：

```text
http://127.0.0.1:5174/
```

Vite 会把以下真实后端接口代理到 `VITE_BACKEND_TARGET`：

- `/api/v1/auth`
- `/api/v1/health`
- `/api/v1/metadata/data-sources`
- `/api/v1/development/scripts`
- `/api/v1/ai`
- `/api/v1/approvals`

其他尚未退出 mock 的页面继续由 MSW 兜底。

## 5. 核心 Smoke

后端启动后执行：

```powershell
.\scripts\smoke-api.ps1
```

如果本地 `.env.local` 修改了管理员密码，可以显式传入：

```powershell
.\scripts\smoke-api.ps1 -ApiBase http://127.0.0.1:8080/api/v1 -Username admin -Password "<LOCAL_ADMIN_PASSWORD>"
```

覆盖路径：

- `GET /health`
- `POST /auth/login`
- `GET /auth/me`
- `GET /metadata/data-sources`
- `GET /development/scripts`
- `GET /ai/capabilities`
- `GET /ai/token-usage`
- `GET /ai/tools`
- `GET /ai/observability`
- `GET /approvals`

脚本输出不会打印 token。

MiniMax 真实 E2E 见 `docs/testing/ai-e2e.md`。真实 token 只允许来自本地 `.env.local` 或当前 shell 环境变量。

## 6. 验证命令

前端构建：

```powershell
npx.cmd vite build --emptyOutDir=false
```

后端测试：

```powershell
cd backend
go test ./...
```

核心 UI E2E（需前后端已启动）：

```powershell
npm run e2e:core
```

CI 会在 GitHub Actions 中执行前端构建和 Go 测试；真实数据库、Redis 和 MiniMax E2E 不进入无密钥 CI。

如果修改了 UI 行为，还需要浏览器检查 `http://127.0.0.1:5174/`，确认控制台无白屏错误，改动页面无横向溢出。

## 7. 常见问题

- **端口占用**：前端固定使用 `5174`，后端默认使用 `8080`；如冲突先确认占用进程再处理。
- **迁移 pending**：执行 `go run ./backend/cmd/datagov-api --migrate-only` 后再次运行 `--check-migrations`。
- **Redis 失败**：检查 `DATAGOV_REDIS_ADDR`、`DATAGOV_REDIS_DB` 和网络连通性。
- **MiniMax 失败**：先确认后端环境变量，不要在前端或请求体中传 token；供应商异常时允许记录原因并临时 MSW 兜底。
- **PowerShell 显示乱码**：优先用 UTF-8 工具或编辑器查看文件内容，不要因为终端 code page 误判文件编码。
