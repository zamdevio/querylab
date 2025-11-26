# Deployment Guide

Complete guide for deploying QueryLab frontend and backend.

## Installation

First, clone the repository from GitHub:

```bash
git clone https://github.com/zamdevio/querylab.git
cd querylab
```

## Backend Deployment (Cloudflare Workers)

### Prerequisites

- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- Repository cloned from `https://github.com/zamdevio/querylab.git`

### Step 1: Configure Wrangler

Edit `Backend/wrangler.jsonc`:

```jsonc
{
  "name": "querylab-api",
  "compatibility_date": "2024-01-01",
  "main": "src/app.ts",
  "vars": {
    "ENVIRONMENT": "production"
  }
}
```

**Note:** `FRONTEND_URL` can be set as a Wrangler secret or in vars. It's recommended to set it as a secret for production.

### Step 2: Set Secrets

Set required secrets using Wrangler (these are stored securely and not in your code):

```bash
cd Backend
wrangler secret put DEEPSEEK_KEY
# Enter your DeepSeek API key when prompted

wrangler secret put JWT_SECRET
# Enter a strong random string for JWT signing

wrangler secret put RESEND_API_KEY
# Enter your Resend API key when prompted

wrangler secret put EMAIL_FROM
# Enter your email sender address (e.g., "QueryLab <noreply@yourdomain.com>")

wrangler secret put FRONTEND_URL
# Enter your frontend URL (e.g., "https://your-frontend-domain.com")
# Optional: Can also be set in wrangler.jsonc vars

wrangler secret put COOKIE_DOMAIN
# Enter your cookie domain (e.g., ".yourdomain.com" with leading dot for subdomain sharing)
# Required in production when using secure cross-origin cookies
```

**Important:** 
- Never commit secrets to GitHub. Use Wrangler secrets for production.
- `ENVIRONMENT` must be set in `wrangler.jsonc` vars (not as a secret)
- `COOKIE_DOMAIN` is required in production for cross-origin cookie sharing

### Step 3: Deploy

```bash
npm run deploy
```

Or for a specific environment:

```bash
wrangler deploy --env production
```

### Step 4: Verify Deployment

Check your Worker URL:
```
https://your-worker.your-subdomain.workers.dev
```

Test the health endpoint:
```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

## Frontend Deployment (Cloudflare Pages)

### Prerequisites

- Cloudflare account
- Repository cloned from `https://github.com/zamdevio/querylab.git`
- Backend API URL configured

### Step 1: Configure Environment Variables

In Cloudflare Pages settings, set:

- `NEXT_PUBLIC_API_URL`: Your backend Worker URL

### Step 2: Build Configuration

Build command:
```bash
npm run build
```

Output directory:
```
.next
```

### Step 3: Deploy via Git

1. Connect your GitHub repository
2. Select the `Frontend` directory as root
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Deploy

### Step 4: Custom Domain (Optional)

1. Go to Pages settings
2. Add custom domain
3. Update DNS records as instructed
4. SSL certificate is automatic

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
cd Frontend
vercel
```

### Step 3: Set Environment Variables

In Vercel dashboard:
- `NEXT_PUBLIC_API_URL`: Your backend API URL

### Step 4: Configure Domain

- Add custom domain in Vercel settings
- Update DNS records
- SSL is automatic

## Environment Variables

### Backend

**Required in `wrangler.jsonc` vars:**
- `ENVIRONMENT`: `"development"` or `"production"` (required - only in vars)

**Required as Wrangler secrets or in `.dev.vars`:**
- `DEEPSEEK_KEY`: DeepSeek API key
- `JWT_SECRET`: Secret for JWT signing
- `RESEND_API_KEY`: Resend API key for emails
- `EMAIL_FROM`: Email sender address

**Optional (can be secret, vars, or `.dev.vars`):**
- `FRONTEND_URL`: Frontend domain URL (defaults to `http://localhost:3000` in development)

**Required in production (can be secret, vars, or `.dev.vars`):**
- `COOKIE_DOMAIN`: Cookie domain for cross-origin cookies (required when using secure cookies in production). Example: `.zamdev.dev` (with leading dot for subdomain sharing)

### Frontend

Required in build environment:

- `NEXT_PUBLIC_API_URL`: Backend API URL

## CORS Configuration

Ensure backend CORS allows your frontend domain:

In `Backend/src/lib/config.ts`:
```typescript
frontendUrl: env.FRONTEND_URL || 'https://your-frontend-domain.com'
```

## Cookie Configuration

For cross-origin cookies (different subdomains):

- `SameSite=None`
- `Secure=true` (HTTPS only)
- No `Domain` attribute

## SSL/HTTPS

### Cloudflare

- Automatic SSL for Workers
- Automatic SSL for Pages
- Free SSL certificates

### Vercel

- Automatic SSL
- Free certificates
- Custom domain support

## Monitoring

### Cloudflare Workers

- View logs in Cloudflare dashboard
- Monitor requests and errors
- Set up alerts for failures

### Frontend

- Use browser DevTools
- Monitor network requests
- Check console for errors

## Troubleshooting

### Backend Not Responding

- Check Worker logs in Cloudflare dashboard
- Verify secrets are set correctly
- Check CORS configuration
- Verify Worker is deployed

### Frontend Can't Connect to Backend

- Verify `NEXT_PUBLIC_API_URL` is set
- Check CORS allows frontend domain
- Verify backend is deployed and accessible
- Check browser console for errors

### Cookies Not Working

- Ensure `SameSite=None` and `Secure=true`
- Verify both frontend and backend use HTTPS
- Check CORS credentials setting
- Verify cookie domain settings

## Performance Optimization

### Backend

- Use Durable Objects for state
- Implement caching where appropriate
- Monitor Worker execution time
- Optimize database queries

### Frontend

- Enable Next.js static optimization
- Use image optimization
- Implement code splitting
- Cache static assets

## Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] Environment variables set securely
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] JWT secrets are strong
- [ ] Cookies are httpOnly and Secure
- [ ] API keys are stored as secrets
- [ ] Error messages don't leak sensitive info

