# Authentication Guide

QueryLab uses email-based authentication with verification codes for secure access to AI features.

## Why Authentication?

Authentication is required for:
- AI-powered SQL generation
- SQL error fixing
- Query suggestions
- Rate limiting and usage tracking

Basic SQL execution and database management work without authentication.

## Authentication Flow

### Step 1: Initiate Login

1. Click the login button in the header
2. Enter your email address (must be @ucsiuniversity.edu.my)
3. Optionally enter your name
4. Click "Send Verification Code"

### Step 2: Verify Email

1. Check your email for a 6-digit verification code
2. Enter the code in the verification modal
3. Code auto-submits when all 6 digits are entered
4. You're logged in upon successful verification

## Email Requirements

- Must be a @ucsiuniversity.edu.my email address
- Email verification is required
- Codes expire after 24 hours

## Session Management

### Session Duration

- Verification session: 24 hours (pending verification)
- Auth token: 7 days (after successful login)
- Sessions persist across browser restarts

### Cookies

QueryLab uses secure, httpOnly cookies:
- `_auth.jti`: Session ID (during verification)
- `_auth.t`: JWT authentication token (after login)

### Cookie Settings

- `SameSite=None`: For cross-origin requests
- `Secure=true`: HTTPS only (production)
- `HttpOnly=true`: Not accessible via JavaScript (security)

## Logging Out

1. Click your profile in the header
2. Select "Logout"
3. Session is cleared immediately
4. You'll need to log in again for AI features

## Troubleshooting

### Can't Receive Verification Code

- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes and request a new code
- Ensure email service is working

### Code Expired

- Request a new verification code
- Codes expire after 24 hours
- Old codes become invalid after new code is requested

### Session Not Found

If you see "SESSION_NOT_FOUND" error:
- Your verification session expired
- Request a new verification code
- Complete the login process again

### Cookie Issues

If cookies aren't working:
- Ensure cookies are enabled in browser
- Check browser privacy settings
- Try a different browser
- Clear cookies and try again

## Security Features

### JWT Tokens

- Tokens are signed and verified server-side
- Include expiration time
- Cannot be modified without invalidating signature

### HttpOnly Cookies

- Cookies cannot be accessed via JavaScript
- Prevents XSS attacks
- Only sent over HTTPS in production

### Rate Limiting

- Prevents abuse of AI features
- 30 requests per minute per user
- Based on authenticated user ID

## Privacy

- Email addresses are only used for authentication
- No personal data is stored beyond what's needed for authentication
- All data processing happens server-side
- Cookies are only used for session management

