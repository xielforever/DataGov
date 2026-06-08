# 认证鉴权 (Auth) 接口规范

**Base URL**: `/api/v1`

> 首期真实后端范围：账号密码登录、当前用户、登出、基础 RBAC 和登录审计。注册、重置密码暂列为后续能力。

### 1.1 用户登录
- **Endpoint**: `POST /api/v1/auth/login`
- **Request `body` Schema**:
  ```json
  {
    "username": "string",
    "password": "string",
    "rememberMe": "boolean(optional)"
  }
  ```
- **Response `data` Schema**:
  ```json
  {
    "token": "string",
    "expiresAt": "string(datetime)",
    "user": {
      "id": "string",
      "username": "string",
      "realName": "string",
      "roles": ["string"],
      "permissions": ["string"],
      "avatar": "string",
      "department": "string"
    }
  }
  ```

### 1.2 获取当前用户
- **Endpoint**: `GET /api/v1/auth/me`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response `data` Schema**:
  ```json
  {
    "id": "string",
    "username": "string",
    "realName": "string",
    "roles": ["string"],
    "permissions": ["string"],
    "menus": ["string"],
    "department": "string",
    "lastLoginAt": "string(datetime)"
  }
  ```

### 1.3 用户登出
- **Endpoint**: `POST /api/v1/auth/logout`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response `data` Schema**:
  ```json
  {
    "success": true
  }
  ```

### 1.4 用户注册（后续）
- **Endpoint**: `POST /api/v1/auth/register`
- **Request `body` Schema**:
  ```json
  {
    "username": "string",
    "password": "string(encrypted)",
    "email": "string",
    "realName": "string"
  }
  ```
- **Response `data` Schema**:
  ```json
  {
    "userId": "string",
    "status": "enum ('pending_approval' | 'active')"
  }
  ```

### 1.5 重置密码（后续）
- **Endpoint**: `POST /api/v1/auth/reset-password`
- **Request `body` Schema**:
  ```json
  {
    "email": "string"
  }
  ```
- **Response `data` Schema**:
  ```json
  {
    "success": "boolean",
    "message": "string"
  }
  ```
