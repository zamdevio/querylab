/**
 * Logout route
 * POST /auth/logout - Logout user and delete session
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { createAuthService } from '../lib/services/auth/auth';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig, isProduction } from '../lib/config';
import { deleteCookie } from 'hono/cookie';

const router = new Hono<{ Bindings: Env }>();

/**
 * POST /auth/logout
 * Logout user by deleting session
 */
router.post('/', async (c: Context<{ Bindings: Env }>) => {
	try {
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

		const authService = createAuthService(config.storageDo, config.jwtSecret);
		const user = await authService.getUserFromRequest(c.req.raw);

		if (user) {
			// Delete session from storage
			await authService.logout(user.token);
		}

		// Delete auth cookie (must use same attributes as when setting)
		const prod = isProduction(config);
		deleteCookie(c, '_auth.t', {
			path: '/',
			secure: prod,
			sameSite: prod ? 'None' : 'Lax',
			domain: config.cookieDomain,
		});

		return c.json(
			successResponse({
				message: 'Logged out successfully',
			}),
		);
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[LOGOUT ERROR]', error);
		return c.json(
			errorResponse('Internal server error', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;

