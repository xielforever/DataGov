# DataGov

DataGov 是一个 React + Vite + Tailwind 的企业级数据治理与数据开发工作台，后端采用 Go 模块化单体起步，核心能力逐步从 MSW mock 退出到真实 API。

## 本地开发

复制本地配置：

```powershell
Copy-Item .env.example .env.local
```

启动后端：

```powershell
go run ./backend/cmd/datagov-api
```

启动前端：

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

访问：

```text
http://127.0.0.1:5174/
```

更多说明见 `docs/local-development.md`。

## 验证

```powershell
npx.cmd vite build --emptyOutDir=false
```

```powershell
cd backend
go test ./...
```

后端 smoke：

```powershell
.\scripts\smoke-api.ps1
```

核心 UI E2E（需前后端已启动）：

```powershell
npm run e2e:core
```

AI MiniMax E2E（需后端已启动且本地配置真实模型环境变量）：

```powershell
.\scripts\smoke-ai-minimax.ps1
```
