# QueryLab Backend

Hono-based backend API for QueryLab, running on Cloudflare Workers with edge computing capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for deployment)
- Wrangler CLI: `npm install -g wrangler`

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/zamdevio/querylab.git
   cd querylab/Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure secrets for local development**:

   Create `Backend/.dev.vars` file (this file is gitignored):
   ```env
   DEEPSEEK_KEY=sk-your-actual-deepseek-key-here
   JWT_SECRET=your-strong-random-jwt-secret-here
   RESEND_API_KEY=re_your-resend-api-key-here
   EMAIL_FROM=QueryLab <noreply@yourdomain.com>
   FRONTEND_URL=http://localhost:3000
   # COOKIE_DOMAIN is optional in development, required in production
   # COOKIE_DOMAIN=.yourdomain.com
   ```
   
   **Note:** `ENVIRONMENT` is set in `wrangler.jsonc` vars (not in `.dev.vars`). Update it to `"development"` or `"production"`.

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:8787`

## 📋 Configuration

### Environment Variables

The backend uses a **centralized configuration system** that reads all secrets from environment variables. Only `ENVIRONMENT` is set in `wrangler.jsonc` (required). All other configuration (including `FRONTEND_URL`) can be set via Wrangler secrets or `.dev.vars`.

#### Required Secrets

| Variable | Type | Description | Where to Set |
|----------|------|-------------|--------------|
| `ENVIRONMENT` | Plain text | `development` or `production` | **Required** in `wrangler.jsonc` vars |
| `DEEPSEEK_KEY` | Secret | DeepSeek API key for AI features | Wrangler secret or `.dev.vars` |
| `JWT_SECRET` | Secret | Random string for JWT token signing | Wrangler secret or `.dev.vars` |
| `RESEND_API_KEY` | Secret | Resend API key for sending emails | Wrangler secret or `.dev.vars` |
| `EMAIL_FROM` | Secret | Email sender address | Wrangler secret or `.dev.vars` |
| `FRONTEND_URL` | Secret | Frontend URL for CORS | Wrangler secret or `.dev.vars` |
| `COOKIE_DOMAIN` | Config | Cookie domain for cross-origin cookies | **Required in production** when using secure cookies. Wrangler secret, `.dev.vars`, or `wrangler.jsonc` vars. Example: `.zamdev.dev` (with leading dot for subdomain sharing) |

### Setting Secrets

#### For Local Development

Create `Backend/.dev.vars`:
```env
DEEPSEEK_KEY=sk-your-key
JWT_SECRET=your-secret
RESEND_API_KEY=re_your-key
EMAIL_FROM=QueryLab <noreply@yourdomain.com>
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

#### For Production

   **Option 1: Wrangler CLI (Recommended)**
   ```bash
   cd Backend
   wrangler secret put DEEPSEEK_KEY
   wrangler secret put JWT_SECRET
   wrangler secret put RESEND_API_KEY
   wrangler secret put EMAIL_FROM
   wrangler secret put FRONTEND_URL
   wrangler secret put COOKIE_DOMAIN  # Required in production for cross-origin cookies
   ```
   
   **Option 2: Cloudflare Dashboard**
   1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   2. Navigate to **Workers & Pages** > Your Worker > **Settings**
   3. Scroll to **Variables and Secrets**
   4. Click **Add variable** for each secret
   5. Select **Encrypted** type for secrets, or **Plain text** for `FRONTEND_URL` and `COOKIE_DOMAIN`
   6. Enter the variable name and value

Then update `wrangler.jsonc` to set environment:
```jsonc
"vars": {
  "ENVIRONMENT": "production"
}
```

**Important Notes:**
- `FRONTEND_URL` can be set as a secret, in vars, or in `.dev.vars`. For production, it's recommended to set it as a secret or in vars.
- `COOKIE_DOMAIN` is **required in production** when using secure cross-origin cookies (secure=true, sameSite=None). Set it to your main domain with a leading dot (e.g., `.zamdev.dev`) to enable cookie sharing across subdomains.

## 🏗️ Architecture

### Tech Stack

- **Hono**: Fast web framework optimized for edge runtimes
- **Cloudflare Workers**: Serverless platform for edge computing
- **Durable Objects**: For rate limiting and state management
- **DeepSeek API**: AI-powered SQL generation and fixing
- **node-sql-parser**: SQL validation and AST parsing
- **Resend**: Email service for verification codes

### Project Structure

```
Backend/
├── src/
│   ├── app.ts              # Main Hono application
│   ├── routes/             # API route handlers
│   │   ├── deepseek.ts     # AI SQL generation
│   │   ├── fixSql.ts       # AI SQL error fixing
│   │   ├── suggestions.ts  # AI query suggestions
│   │   ├── login.ts        # Login initiation
│   │   ├── loginVerify.ts  # Login verification
│   │   ├── logout.ts       # Logout
│   │   ├── me.ts           # Get user info
│   │   └── health.ts        # Health check
│   └── lib/
│       ├── config.ts        # Centralized configuration
│       ├── response.ts      # Standardized response format
│       ├── rateLimiter.ts   # Rate limiting logic
│       └── services/
│           ├── auth/        # Authentication services
│           ├── email/       # Email services
│           ├── sql/         # SQL validation
│           └── do/          # Durable Object services
├── wrangler.jsonc          # Cloudflare Workers config
└── package.json
```

### Centralized Configuration

All routes use a centralized `getConfig()` function from `lib/config.ts` that:
- Validates all required secrets are present
- Provides type-safe access to configuration
- Throws clear errors if secrets are missing
- Separates secrets from non-sensitive config

**Example usage in routes:**
```typescript
import { getConfig } from '../lib/config';

// In route handler
const config = getConfig(c.env);
// Now use: config.deepseekKey, config.jwtSecret, etc.
```

## 🔌 API Endpoints

> 📖 **Detailed API Reference**: See [`../Documentations/api-reference.md`](../Documentations/api-reference.md) for complete API documentation with request/response examples

### Health Check

**GET** `/health`

Returns API health status.

### Authentication

**POST** `/auth/login`
- Initiate login with email verification
- Sends 6-digit code to email
- Sets `_auth.jti` cookie

**POST** `/auth/login/verify`
- Verify email code
- Sets `_auth.t` JWT cookie on success

**GET** `/auth/me`
- Get current authenticated user info
- Requires authentication

**POST** `/auth/logout`
- Logout and clear session
- Requires authentication

### AI Features

**POST** `/api/deepseek`
- Generate SQL from natural language
- Requires authentication
- Rate limited: 30 requests/minute

**POST** `/api/fix-sql`
- Fix SQL errors using AI
- Requires authentication
- Rate limited: 30 requests/minute

**POST** `/api/suggestions`
- Get SQL query suggestions
- Requires authentication
- Rate limited: 30 requests/minute

## 🔒 Security Features

- **JWT Authentication**: httpOnly cookies with secure signing (HS256 algorithm)
- **Rate Limiting**: 30 requests/minute per user via Durable Objects
- **CORS Protection**: Origin validation with credentials support
- **SQL Validation**: AST-based validation before AI processing
- **Request Limits**: 1MB max request body size
- **Secrets Management**: All secrets stored securely, never in code

> 📖 **Detailed Security Documentation**: See [`../Documentations/authentication.md`](../Documentations/authentication.md) for complete security implementation details, JWT configuration, and best practices

## 📦 Deployment

> 📖 **Detailed Deployment Guide**: See [`../Documentations/deployment.md`](../Documentations/deployment.md) for complete step-by-step deployment instructions, including production configuration and troubleshooting

### Deploy to Cloudflare Workers

1. **Set production secrets** (if not already done):
   ```bash
   wrangler secret put DEEPSEEK_KEY
   wrangler secret put JWT_SECRET
   wrangler secret put RESEND_API_KEY
   wrangler secret put EMAIL_FROM
   wrangler secret put FRONTEND_URL
   wrangler secret put COOKIE_DOMAIN  # Required in production
   ```

2. **Update `wrangler.jsonc`** for production:
   ```jsonc
   "vars": {
     "ENVIRONMENT": "production"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

### Verify Deployment

Test the health endpoint:
```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📊 Monitoring

- View logs in Cloudflare Dashboard > Workers > Your Worker > Logs
- Monitor requests and errors
- Set up alerts for failures
- Check rate limiting metrics

## 🐛 Troubleshooting

### "Config Error" responses

- Check that all required secrets are set
- Verify `.dev.vars` exists for local dev
- Check Wrangler secrets for production: `wrangler secret list`

### Rate limit issues

- Rate limit is 30 requests/minute per user
- Check Durable Object status in Cloudflare Dashboard
- Verify `STORAGE_DO` binding is configured in `wrangler.jsonc`

### CORS errors

- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check CORS headers in response
- Ensure `Access-Control-Allow-Credentials: true` is set

### Email not sending

- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for email logs
- Ensure `EMAIL_FROM` is a verified domain in Resend

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

## 🤝 Contributing

See the main [README.md](../README.md) for contribution guidelines.
