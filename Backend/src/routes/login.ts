/**
 * Login route
 * POST /login - Initiate login with email verification
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { createLoginService } from '../lib/services/auth/login';
import { createMailerService } from '../lib/services/email/mailer';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig, isProduction } from '../lib/config';
import { setCookie } from 'hono/cookie';

const router = new Hono<{ Bindings: Env }>();

interface LoginRequest {
	email: string;
	name?: string; // Optional name, defaults to "Student"
}

/**
 * POST /login
 * Initiate login process - sends verification email
 * No account creation needed - just validates email domain and sends OTP
 */
router.post('/', async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json<LoginRequest>();

		if (!body.email) {
			return c.json(
				errorResponse('Email is required', 'VALIDATION_ERROR'),
				400,
			);
		}

		// Validate email domain - only @ucsiuniversity.edu.my allowed
		if (!body.email.trim().toLowerCase().endsWith('@ucsiuniversity.edu.my')) {
			return c.json(
				errorResponse('Only @ucsiuniversity.edu.my email addresses are allowed', 'VALIDATION_ERROR'),
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

		const mailer = createMailerService({
			apiKey: config.resendApiKey,
			defaultFrom: config.emailFrom,
			frontendUrl: config.frontendUrl,
		});

		const loginService = createLoginService(config.storageDo, config.jwtSecret);
		const result = await loginService.initiateLogin({
			email: body.email.trim().toLowerCase(),
			name: body.name || 'Student',
		});

		if (!result.success) {
			return c.json(
				errorResponse(result.error || 'Login failed', 'LOGIN_ERROR'),
				400,
			);
		}

		// Send verification email with code
		if (!result.code) {
			return c.json(
				errorResponse('Verification code not generated', 'LOGIN_ERROR'),
				500,
			);
		}
		const emailResult = await mailer.sendVerificationEmail(
			body.email.trim().toLowerCase(),
			result.code,
		);

		if (!emailResult.success) {
			console.error('[LOGIN ERROR] Failed to send verification email:', {
				email: body.email.trim().toLowerCase(),
				error: emailResult.error,
				code: result.code,
				timestamp: new Date().toISOString(),
			});
			return c.json(
				errorResponse('Failed to send verification email', 'EMAIL_ERROR'),
				500,
			);
		}

		// Set jti cookie
		// For cross-origin cookies (different subdomains), we need SameSite=None and Secure=true
		if (result.jti) {
			const prod = isProduction(config);
			setCookie(c, '_auth.jti', result.jti, {
				httpOnly: true,
				secure: prod, // Must be true when SameSite=None (required by browsers)
				sameSite: prod ? 'None' : 'Lax', // None for cross-origin, Lax for same-origin (dev)
				maxAge: 24 * 60 * 60, // 24 hours (matches pending verification TTL)
				path: '/',
				domain: config.cookieDomain,
			});
		}

		return c.json(
			successResponse({
				message: 'Verification code sent. Please check your email.',
				status: 'AUTH_PENDING',
			}),
		);
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[LOGIN ERROR]', error);
		return c.json(
			errorResponse('Internal server error', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;

