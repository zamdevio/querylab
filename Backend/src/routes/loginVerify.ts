/**
 * Login verification route
 * POST /login/verify - Verify code and set auth cookie
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { createLoginService } from '../lib/services/auth/login';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig, isProduction } from '../lib/config';
import { setCookie, getCookie } from 'hono/cookie';
// Env type is available globally from worker-configuration.d.ts

const router = new Hono<{ Bindings: Env }>();

/**
 * POST /auth/login/verify
 * Verify email verification code and set auth cookie
 */
router.post('/', async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json<{ code: string }>();

		if (!body.code) {
			return c.json(
				errorResponse('Verification code is required', 'VALIDATION_ERROR'),
				400,
			);
		}

		// Get jti from cookie
		const jti = getCookie(c, '_auth.jti');
		if (!jti) {
			return c.json(
				errorResponse('Session not found. Please request a new verification code.', 'SESSION_NOT_FOUND'),
				400,
			);
		}

		// Get centralized config (validates all secrets are present)
		let config;
		try {
			config = getConfig(c.env);
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return c.json(
				errorResponse(error.message, 'CONFIG_ERROR'),
				500,
			);
		}

		const loginService = createLoginService(config.storageDo, config.jwtSecret);
		const result = await loginService.verifyLogin(body.code, jti);

		if (!result.success) {
			// Use the error code from result if available, otherwise default to VERIFICATION_ERROR
			const errorCode = result.code || 'VERIFICATION_ERROR';
			return c.json(
				errorResponse(result.error || 'Verification failed', errorCode, {
					remainingAttempts: result.remainingAttempts,
				}),
				400,
			);
		}

		// Set auth token cookie
		// For cross-origin cookies (different subdomains), we need SameSite=None and Secure=true
		if (!result.token) {
			return c.json(
				errorResponse('Authentication token not generated', 'VERIFICATION_ERROR'),
				500,
			);
		}
		const prod = isProduction(config);
		setCookie(c, '_auth.t', result.token, {
			httpOnly: true,
			secure: prod, // Must be true when SameSite=None (required by browsers)
			sameSite: prod ? 'None' : 'Lax', // None for cross-origin, Lax for same-origin (dev)
			maxAge: 7 * 24 * 60 * 60, // 7 days
			path: '/',
			domain: config.cookieDomain,
		});

		// Delete jti cookie after successful verification (no longer needed)
		setCookie(c, '_auth.jti', '', {
			httpOnly: true,
			secure: prod,
			sameSite: prod ? 'None' : 'Lax',
			maxAge: 0, // Delete cookie
			path: '/',
			domain: config.cookieDomain,
		});

		return c.json(
			successResponse({
				message: 'Email verified successfully',
				email: result.email,
			}),
		);
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[LOGIN_VERIFY ERROR]', error);
		return c.json(
			errorResponse('Internal server error', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;

