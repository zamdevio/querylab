/**
 * Get current user info route
 * GET /auth/me - Get authenticated user information
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { createAuthService } from '../lib/services/auth/auth';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig } from '../lib/config';

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /auth/me
 * Get current authenticated user information
 */
router.get('/', async (c: Context<{ Bindings: Env }>) => {
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

		if (!user) {
			return c.json(
				errorResponse('Not authenticated', 'AUTH_MISSING'),
				401,
			);
		}

		// Extract university from email domain if it's @ucsiuniversity.edu.my
		const university = user.email.endsWith('@ucsiuniversity.edu.my')
			? 'UCSI University'
			: undefined;

		return c.json(
			successResponse({
				email: user.email,
				name: user.name,
				university,
			}),
		);
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[ME ERROR]', error);
		return c.json(
			errorResponse('Internal server error', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;

