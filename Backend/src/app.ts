import { Hono } from 'hono';
import deepseekRoute from './routes/deepseek';
import fixSqlRoute from './routes/fixSql';
import suggestionsRoute from './routes/suggestions';
import healthRoute from './routes/health';
import loginRoute from './routes/login';
import loginVerifyRoute from './routes/loginVerify';
import logoutRoute from './routes/logout';
import meRoute from './routes/me';
import { StorageDurableObject } from './lib/services/do/storage';
import { errorResponse } from './lib/response';
import { getConfig, getAllowedOrigins } from './lib/config';

/**
 * Main Hono application
 * Compatible with Cloudflare Workers
 */
const app = new Hono<{ Bindings: Env }>();

/**
 * CORS middleware
 * Allows localhost:3000 in development, configured frontend URL in production
 */
app.use('*', async (c, next) => {
	// Get config - use fallback for health check if config fails
	let config;
	let allowedOrigins: string[];
	try {
		config = getConfig(c.env);
		allowedOrigins = getAllowedOrigins(config, c.env);
	} catch (err) {
		// For health check, allow all origins if config fails
		if (c.req.path === '/health') {
			allowedOrigins = ['*'];
		} else {
			// For other routes, return config error
			return c.json(
				errorResponse(
					err instanceof Error ? err.message : 'Configuration error',
					'CONFIG_ERROR',
				),
				500,
			);
		}
	}
	
	const origin = c.req.header('Origin');
	const isAllowedOrigin = origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin));
	
	// Determine the CORS origin to use
	// If requesting origin is in the allowed list, use it exactly as sent
	// Otherwise, fall back to FRONTEND_URL (which should always be in the allowed list)
	let corsOrigin: string;
	if (isAllowedOrigin && origin) {
		// Use the requesting domain if it's in the allowed list
		corsOrigin = origin;
	} else if (allowedOrigins.includes('*')) {
		// Allow all origins (development/health check)
		corsOrigin = '*';
	} else {
		// Fall back to FRONTEND_URL (first in allowed origins list, which should always contain FRONTEND_URL)
		corsOrigin = allowedOrigins[0] || '';
	}
	
	// Handle preflight OPTIONS request
	if (c.req.method === 'OPTIONS') {
		// Always allow OPTIONS if origin is in allowed list or wildcard is enabled
		if (isAllowedOrigin || allowedOrigins.includes('*') || !origin) {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': corsOrigin,
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Max-Age': '86400',
				},
			});
		}
		// Reject preflight if origin is not allowed
		return new Response(null, { status: 403 });
	}
	
	// Add CORS headers to response
	await next();
	
	// Set CORS headers if origin is allowed, or if no origin (same-origin), or wildcard enabled
	if (isAllowedOrigin || allowedOrigins.includes('*') || !origin) {
		c.header('Access-Control-Allow-Origin', corsOrigin);
		c.header('Access-Control-Allow-Credentials', 'true');
		c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
	}
});

/**
 * Simple logger middleware
 * Logs request method, path, and timestamp
 */
app.use('*', async (c, next) => {
	const start = Date.now();
	const method = c.req.method;
	const path = c.req.path;
	
	await next();
	
	const duration = Date.now() - start;
	console.log(`[${new Date().toISOString()}] ${method} ${path} - ${duration}ms`);
});

// Health check endpoint
app.get('/health', healthRoute);

// Auth routes
app.route('/auth/login', loginRoute);
app.route('/auth/login/verify', loginVerifyRoute);
app.route('/auth/logout', logoutRoute);
app.route('/auth/me', meRoute);

// AI routes
app.route('/ai/generate', deepseekRoute);
app.route('/ai/fix', fixSqlRoute);
app.route('/ai/suggest', suggestionsRoute);

// 404 handler
app.notFound((c) => {
	return c.json(errorResponse('Not Found', 'NOT_FOUND'), 404);
});

// Error handler
app.onError((err, c) => {
	console.error('Unhandled error:', err);
	return c.json(
		errorResponse('Internal Server Error', 'INTERNAL_ERROR', {
			message: err.message,
		}),
		500,
	);
});

/**
 * Cloudflare Workers export
 * Hono app can be used directly as it has a fetch method
 */
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;

/**
 * Export Durable Object class for Cloudflare Workers
 */
export { StorageDurableObject };

