# 认证鉴权 (Auth) 接口规范

**Base URL**: `/api/v1`

### 1.1 用户登录
- **Endpoint**: `POST /api/v1/auth/login`
- **Request `body` Schema**:
  ```json
  {
    "username": "string",
    "password": "string(encrypted)"
  }
  ```
- **Response `data` Schema**:
  ```json
  {
    "token": "string (JWT)",
    "user": {
      "id": "string",
      "username": "string",
      "realName": "string",
      "role": "string",
      "avatar": "string",
      "department": "string"
    }
  }
  ```

### 1.2 用户注册
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

### 1.3 重置密码
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