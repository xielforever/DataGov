# DataGov API Specification Draft (v1)

本文档基于前端 v2.0 Mock 数据重构产出，作为与后端开发对接的契约草案。为便于管理，接口规范已按照业务模块进行了拆分。

## 全局规范

**Base URL**: `/api/v1`

**通用返回结构 (JSON)**:
```json
{
  "code": 0,           // 0 表示成功，非 0 表示业务错误
  "message": "success",// 错误信息或成功提示
  "data": {}           // 具体的业务数据负载
}
```

---

## 模块拆分文档

请点击下方链接查看各业务模块的接口详情：

- [1. 认证鉴权 (Auth)](./01-auth.md)
- [2. 仪表盘 (Dashboard)](./02-dashboard.md)
- [3. 数据资产 (Asset)](./03-asset.md)
- [4. 元数据管理 (Metadata)](./04-metadata.md)
- [5. 数据标准 (Standard)](./05-standard.md)
- [6. 数据开发 (Development)](./06-development.md)
- [7. 数据质量与监控 (Quality)](./07-quality.md)
- [8. 数据服务 (Service)](./08-service.md)
- [9. 系统管理 (System)](./09-system.md)
- [10. AI 助手 (AI)](./10-ai.md)

*(注：未进入首期真实后端的模块可继续由 MSW 提供 Mock；首期真实后端优先覆盖认证、数据源管理、脚本开发和 AI 助手。)*
