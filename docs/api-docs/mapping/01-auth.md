# 认证鉴权 (Auth) 页面映射

> 首期真实后端只实现账号密码登录、当前用户、登出和基础权限。注册、找回密码保留为后续能力，不作为第一阶段交付范围。

### 1.1 登录页面
- **状态/页面**: `登录状态`
- **对应组件**: `src/pages/auth/LoginForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/login`: 用户账号密码登录，成功后返回 token 和用户基础信息。
  - `GET /api/v1/auth/me`: 获取当前登录用户、角色、权限和菜单能力。
  - `POST /api/v1/auth/logout`: 注销当前会话，服务端记录登出审计。

### 1.2 注册页面（后续）
- **状态/页面**: `注册状态`
- **对应组件**: `src/pages/auth/RegisterForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/register`: 提交新用户注册信息。

### 1.3 找回密码页面（后续）
- **状态/页面**: `忘记密码状态`
- **对应组件**: `src/pages/auth/ForgotPasswordForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/reset-password`: 请求密码重置邮件或验证码。
