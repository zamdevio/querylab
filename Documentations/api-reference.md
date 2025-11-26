# API Reference

Complete reference for QueryLab's backend API endpoints.

## Base URL

Production: `https://your-worker.your-subdomain.workers.dev`

Development: `http://localhost:8787`

## Authentication

Most endpoints require authentication via JWT cookies. The authentication flow:

1. `POST /auth/login` - Initiate login (sends verification code)
2. `POST /auth/login/verify` - Verify code and get auth token
3. `GET /auth/me` - Get current user info
4. `POST /auth/logout` - Logout and clear session

## Endpoints

### Health Check

#### `GET /health`

Check API health status.

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "querylab-backend"
  }
}
```

### AI SQL Generation

#### `POST /api/deepseek`

Generate SQL from natural language.

**Authentication**: Required

**Request Body**:
```json
{
  "prompt": "Show me all students older than 20",
  "runSql": false,
  "schema": {
    "tables": [
      {
        "name": "students",
        "columns": [
          {"name": "id", "type": "INTEGER"},
          {"name": "name", "type": "TEXT"},
          {"name": "age", "type": "INTEGER"}
        ]
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sql": "SELECT * FROM students WHERE age > 20",
    "validated": true
  }
}
```

**Rate Limit**: 30 requests per minute

### SQL Error Fixing

#### `POST /api/fix-sql`

Fix SQL errors using AI.

**Authentication**: Required

**Request Body**:
```json
{
  "errorSql": "SELECT * FROM studnts",
  "errorMessage": "no such table: studnts",
  "schema": {
    "tables": [...]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "fixedSql": "SELECT * FROM students",
    "explanation": "Fixed table name typo"
  }
}
```

**Rate Limit**: 30 requests per minute

### SQL Suggestions

#### `POST /api/suggestions`

Get SQL query suggestions.

**Authentication**: Required

**Request Body**:
```json
{
  "prompt": "find students",
  "schema": {
    "tables": [...]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "SELECT * FROM students",
      "SELECT name, age FROM students"
    ]
  }
}
```

### Authentication

#### `POST /auth/login`

Initiate login process.

**Request Body**:
```json
{
  "email": "user@ucsiuniversity.edu.my",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Verification code sent",
    "status": "AUTH_PENDING"
  }
}
```

**Cookies**: Sets `_auth.jti` cookie (session ID)

#### `POST /auth/login/verify`

Verify login code.

**Request Body**:
```json
{
  "code": "123456"
}
```

**Cookies**: Requires `_auth.jti` cookie

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "email": "user@ucsiuniversity.edu.my"
  }
}
```

**Cookies**: Sets `_auth.t` cookie (JWT token)

#### `GET /auth/me`

Get current user information.

**Authentication**: Required (JWT cookie)

**Response**:
```json
{
  "success": true,
  "data": {
    "email": "user@ucsiuniversity.edu.my",
    "name": "John Doe",
    "university": "UCSI University"
  }
}
```

#### `POST /auth/logout`

Logout current user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

- `AUTH_MISSING`: Authentication required
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- AI endpoints: 30 requests per minute per user
- Other endpoints: No specific limit (subject to Cloudflare Workers limits)

## CORS

The API supports CORS with:
- `Access-Control-Allow-Origin`: Configured frontend URL
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS

## Request Size Limits

- Maximum request body: 1MB
- SQL queries: No specific limit (but large queries may timeout)

