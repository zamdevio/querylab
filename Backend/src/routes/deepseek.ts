import { Hono } from 'hono';
import type { Context } from 'hono';
import { validateSql } from '../lib/services/sql/validation';
import { createRateLimiter } from '../lib/rateLimiter';
import { createAuthService } from '../lib/services/auth/auth';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig } from '../lib/config';
import { buildSystemPrompt, buildUserPrompt, type DatabaseSchema } from '../lib/aiPrompts';
import { parseAIResponse, getCodeMessage } from '../lib/aiCodes';

const router = new Hono<{ Bindings: Env }>();

/**
 * DeepSeek API request body
 */
interface DeepSeekRequest {
	prompt: string;
	runSql?: boolean;
	allowedTables?: readonly string[];
	schema?: DatabaseSchema;
}

/**
 * DeepSeek API response data
 */
interface DeepSeekResponseData {
	sql?: string;
	text?: string;
	validated?: boolean;
	code?: string;
	message?: string;
	explanation?: string;
	[key: string]: unknown;
}

/**
 * Get user ID from request using auth service
 * Falls back to IP address if not authenticated
 */
async function getUserId(config: { storageDo: DurableObjectNamespace; jwtSecret: string }, request: Request): Promise<string | null> {
	const authService = createAuthService(config.storageDo, config.jwtSecret);
	const user = await authService.getUserFromRequest(request);
	
	if (user) {
		return user.email; // Use email as userId
	}

	// Auth required - return null if not authenticated
	return null;
}

/**
 * Log usage for monitoring and abuse detection
 */
function logUsage(
	userId: string,
	prompt: string,
	success: boolean,
	error?: string,
): void {
	const logEntry = {
		timestamp: new Date().toISOString(),
		userId,
		promptLength: prompt.length,
		success,
		...(error && { error }),
	};

	// Log to console (in production, send to analytics/logging service)
	console.log('[USAGE]', JSON.stringify(logEntry));
}

/**
 * POST /ai/generate
 * Public endpoint - no authentication required
 * Proxy to DeepSeek API with rate limiting and SQL validation
 */
router.post('/', async (c: Context<{ Bindings: Env }>): Promise<Response> => {
	const startTime = Date.now();
	let userId: string = 'unknown';

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

		// Get user ID from auth - authentication required
		const userIdResult = await getUserId(config, c.req.raw);
		if (userIdResult === null) {
			return c.json(
				errorResponse('Authentication required', 'AUTH_MISSING'),
				401,
			);
		}
		userId = userIdResult;
		// Check body size limit (1MB max)
		const contentLength = c.req.header('content-length');
		if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
			return c.json(
				errorResponse('Request body too large. Maximum size is 1MB.', 'PAYLOAD_TOO_LARGE'),
				413,
			);
		}

		// Parse request body
		let body: DeepSeekRequest;
		try {
			body = await c.req.json<DeepSeekRequest>();
		} catch (err) {
			return c.json(
				errorResponse('Invalid JSON in request body', 'INVALID_JSON'),
				400,
			);
		}

		// Validate required fields
		if (!body.prompt || typeof body.prompt !== 'string') {
			return c.json(
				errorResponse('Missing or invalid "prompt" field', 'INVALID_PROMPT'),
				400,
			);
		}

		// Validate schema if provided
		if (body.schema) {
			if (!body.schema.tables || !Array.isArray(body.schema.tables)) {
				return c.json(
					errorResponse('Invalid schema format', 'INVALID_SCHEMA'),
					400,
				);
			}
		}

		// Rate limiting using general storage Durable Object
		const rateLimiter = createRateLimiter(config.storageDo);
		const rateLimitResult = await rateLimiter.checkLimit(userId);

		if (!rateLimitResult.allowed) {
			logUsage(userId, body.prompt, false, 'Rate limit exceeded');
			return c.json(
				errorResponse(
					'Rate limit exceeded. Please try again later.',
					'RATE_LIMIT_EXCEEDED',
					{
						retryAfter: 60,
						remaining: rateLimitResult.remaining,
					},
				),
				429,
			);
		}

		// Build prompts with schema
		const systemPrompt = buildSystemPrompt(body.schema);
		const userPrompt = buildUserPrompt(body.prompt, body.schema);

		// Forward to DeepSeek API
		const deepseekUrl = 'https://api.deepseek.com/v1/chat/completions';

		const deepseekResponse = await fetch(deepseekUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${config.deepseekKey}`,
			},
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [
					{
						role: 'system',
						content: systemPrompt,
					},
					{
						role: 'user',
						content: userPrompt,
					},
				],
				temperature: 0.3,
				max_tokens: 1000, // Increased for code + SQL + explanation
			}),
		});

		if (!deepseekResponse.ok) {
			const errorText = await deepseekResponse.text();
			logUsage(userId, body.prompt, false, `DeepSeek API error: ${errorText}`);
			const statusCode = deepseekResponse.status >= 500 ? 500 : 400;
			return c.json(
				errorResponse('Failed to generate SQL', 'DEEPSEEK_API_ERROR', {
					status: deepseekResponse.status,
					details: errorText,
				}),
				statusCode,
			);
		}

		const deepseekData = await deepseekResponse.json<{
			choices?: Array<{
				message?: {
					content?: string;
				};
			}>;
			[key: string]: unknown;
		}>();

		// Parse AI response to extract code, SQL, and explanation
		// Exclude usage, choices, and other internal fields from response
		let responseData: DeepSeekResponseData = {};

		let sql: string | undefined;
		if (deepseekData.choices && deepseekData.choices[0]?.message?.content) {
			const aiContent = deepseekData.choices[0].message.content.trim();
			const parsed = parseAIResponse(aiContent);

			// For NOT_SQL_REQUEST, ensure SQL is empty string
			if (parsed.code === 'NOT_SQL_REQUEST') {
				sql = '';
			} else {
				sql = parsed.sql;
				// Final safety check: if SQL contains "NOT_SQL_REQUEST", treat it as NOT_SQL_REQUEST
				if (sql && /^NOT_SQL_REQUEST\s*(?:\n|$)/i.test(sql)) {
					// Extract explanation from SQL field if present
					const explanationMatch = sql.match(/EXPLANATION:\s*(.+?)(?:\n\n|$)/is);
					const extractedExplanation = explanationMatch ? explanationMatch[1].trim() : undefined;
					
					responseData = {
						code: 'NOT_SQL_REQUEST',
						message: getCodeMessage('NOT_SQL_REQUEST'),
						sql: '',
						explanation: parsed.explanation || extractedExplanation,
					};
				} else {
					// Only return SQL if code is SUCCESS
					responseData = {
						code: parsed.code,
						message: parsed.message,
						sql: parsed.code === 'SUCCESS' ? (sql || '') : '', // Empty SQL if not SUCCESS
						explanation: parsed.explanation,
					};
				}
			}
			
			// Only set responseData if not already set above
			if (!responseData.code) {
				responseData = {
					code: parsed.code,
					message: parsed.message,
					sql: parsed.code === 'SUCCESS' ? (sql || '') : '', // Empty SQL if not SUCCESS
					explanation: parsed.explanation,
				};
			}
		}

		// If runSql is true and we have SQL, validate it before returning
		if (body.runSql === true && sql) {
			const validation = validateSql(sql, body.allowedTables);

			if (!validation.ok) {
				logUsage(userId, body.prompt, false, `Unsafe SQL: ${validation.error}`);
				return c.json(
					errorResponse('Unsafe SQL generated', 'UNSAFE_SQL', {
						reason: validation.error,
						sql, // Still return SQL so user can see what was generated
					}),
					400,
				);
			}

			// Add validation result to response
			responseData.validated = true;
		}

		// Log successful usage
		const duration = Date.now() - startTime;
		logUsage(userId, body.prompt, true);
		console.log(`[DEEPSEEK] userId=${userId} duration=${duration}ms sqlGenerated=${!!sql}`);

		return c.json(successResponse(responseData));
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[DEEPSEEK ERROR]', error);
		logUsage(userId, 'unknown', false, error.message);

		return c.json(
			errorResponse('Internal server error', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;
