import { Context } from 'hono';
import { successResponse } from '../lib/response';

/**
 * Health check endpoint
 * GET /health
 */
export default async function healthRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
	return c.json(
		successResponse({
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'querylab-backend',
		}),
	);
}

