# 认证鉴权 (Auth) 页面映射

### 1.1 登录页面
- **状态/页面**: `登录状态`
- **对应组件**: `src/pages/auth/LoginForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/login`: 用户账号密码登录，成功后返回 token 和用户基础信息。

### 1.2 注册页面
- **状态/页面**: `注册状态`
- **对应组件**: `src/pages/auth/RegisterForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/register`: 提交新用户注册信息。

### 1.3 找回密码页面
- **状态/页面**: `忘记密码状态`
- **对应组件**: `src/pages/auth/ForgotPasswordForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/reset-password`: 请求密码重置邮件或验证码。