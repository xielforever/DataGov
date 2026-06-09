# AI MiniMax E2E 验收指南

本文档用于 Sprint 4 的 AI 助手真实模型验收。真实密钥只允许放在本地 `.env.local`、`backend/.env.local` 或当前 shell 环境变量中，不得写入仓库、测试报告或截图。

## 前置条件

- 后端已启动并通过 `GET /api/v1/health`。
- PostgreSQL 迁移已全部应用，至少包含 `000005_ai_production_hardening.sql`。
- Redis 可用；如果 Redis 不可用，日配额仍生效，但分钟级限流会降级。
- MiniMax Anthropic-compatible 配置已通过环境变量注入：
  - `ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic`
  - `ANTHROPIC_API_KEY=<local-secret>`
  - `ANTHROPIC_MODEL=MiniMax-M3`

## 验收路径

1. 登录获取后端 token。
2. 调用 `GET /api/v1/ai/capabilities`，确认能力列表可读。
3. 调用 `GET /api/v1/ai/token-usage`，确认今日配额窗口和剩余 Token。
4. 调用 `POST /api/v1/ai/assistant/messages`，使用短问题验证 MiniMax 返回。
5. 调用 `GET /api/v1/ai/tools`，确认工具按当前用户权限展示 enabled 状态。
6. 调用 `GET /api/v1/ai/observability`，确认请求数、Token、工具调用、限流事件可观测。

后端启动后可直接执行：

```powershell
.\scripts\smoke-ai-minimax.ps1
```

脚本会验证真实模型回复、Token 记录和观测接口，但不会打印模型回复正文，避免误带敏感上下文进入终端日志。

## 建议测试问题

```text
帮我写一段 PostgreSQL SQL，统计 raw.ods_order 最近 1 天订单数，要求只输出 SQL 和一句口径说明。
```

## 通过标准

- AI 回复来自后端真实模型链路，不由 MSW 生成。
- 响应、日志、浏览器控制台不包含 `sk-` token、数据库密码或完整连接串。
- `ai_token_usage` 有本次调用记录。
- `audit_events` 有 `ai.assistant.message` 记录，并包含 prompt template code/version。
- `GET /api/v1/ai/observability` 的 `requestCount` 和 `totalTokens` 反映本次调用。

## 降级条件

仅当 MiniMax 网络、额度、供应商接口或本地后端依赖不可恢复时，允许临时设置：

```powershell
$env:VITE_REAL_AI_ASSISTANT="false"
```

降级后只能证明前端交互不白屏，不能视为真实模型 E2E 通过；需要在 `PROJECT_STATUS.md` 记录原因和待补测项。
