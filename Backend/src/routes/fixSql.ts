/**
 * POST /ai/fix
 * Fix SQL errors using AI
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { validateSql } from '../lib/services/sql/validation';
import { createRateLimiter } from '../lib/rateLimiter';
import { createAuthService } from '../lib/services/auth/auth';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig } from '../lib/config';
import { buildFixSqlSystemPrompt, type DatabaseSchema } from '../lib/aiPrompts';
import { parseAIResponse, getCodeMessage } from '../lib/aiCodes';

const router = new Hono<{ Bindings: Env }>();

/**
 * Table data for AI context
 */
interface TableData {
	name: string;
	rows: Array<Record<string, unknown>>;
	rowCount: number;
}

/**
 * Fix SQL request body
 */
interface FixSqlRequest {
	errorSql: string;
	errorMessage: string;
	schema: DatabaseSchema;
	tableData?: TableData[];
	allowedTables?: readonly string[];
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
 * POST /ai/fix
 * Fix SQL errors using AI
 */
router.post('/', async (c: Context<{ Bindings: Env }>): Promise<Response> => {
	let userId: string | null = null;

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

		// Get user ID from auth
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
		let body: FixSqlRequest;
		try {
			body = await c.req.json<FixSqlRequest>();
		} catch (err) {
			return c.json(errorResponse('Invalid JSON in request body', 'INVALID_JSON'), 400);
		}

		// Validate required fields
		if (!body.errorSql || typeof body.errorSql !== 'string') {
			return c.json(
				errorResponse('Missing or invalid "errorSql" field', 'INVALID_ERROR_SQL'),
				400,
			);
		}

		if (!body.errorMessage || typeof body.errorMessage !== 'string') {
			return c.json(
				errorResponse('Missing or invalid "errorMessage" field', 'INVALID_ERROR_MESSAGE'),
				400,
			);
		}

		if (!body.schema || !body.schema.tables || !Array.isArray(body.schema.tables)) {
			return c.json(errorResponse('Missing or invalid "schema" field', 'INVALID_SCHEMA'), 400);
		}

		// Rate limiting
		const rateLimiter = createRateLimiter(config.storageDo);
		const rateLimitResult = await rateLimiter.checkLimit(userId);

		if (!rateLimitResult.allowed) {
			return c.json(
				errorResponse('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED', {
					retryAfter: 60,
					remaining: rateLimitResult.remaining,
				}),
				429,
			);
		}

		// Build prompt for fixing SQL
		const systemPrompt = buildFixSqlSystemPrompt(body.schema);
		
		// Include table data if provided
		let dataContext = '';
		if (body.tableData && body.tableData.length > 0) {
			dataContext = '\n\nEXISTING TABLE DATA (for constraint understanding):\n';
			for (const table of body.tableData) {
				dataContext += `\nTABLE: ${table.name} (${table.rowCount} rows shown)\n`;
				if (table.rows.length > 0) {
					dataContext += JSON.stringify(table.rows, null, 2) + '\n';
				} else {
					dataContext += '(empty table)\n';
				}
			}
		}
		
		const userPrompt = `The following SQL query failed with an error. Please fix it.

ERROR SQL:
${body.errorSql}

ERROR MESSAGE:
${body.errorMessage}

DATABASE SCHEMA:
${JSON.stringify(body.schema, null, 2)}${dataContext}

Please provide a corrected SQL statement that will work with this schema and existing data. 
- If the error is due to missing tables or columns, create them first.
- If the error is a UNIQUE constraint violation, suggest a different value that doesn't conflict with existing data.
- If the error is a foreign key constraint, ensure referenced values exist.
- Always check existing data to understand constraints better.`;

		// Call DeepSeek API
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
				max_tokens: 1000,
			}),
		});

		if (!deepseekResponse.ok) {
			const errorText = await deepseekResponse.text();
			const statusCode = deepseekResponse.status >= 500 ? 500 : 400;
			return c.json(
				errorResponse('Failed to fix SQL', 'DEEPSEEK_API_ERROR', {
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

		// Parse AI response
		let responseData: {
			code?: string;
			message?: string;
			sql?: string;
			explanation?: string;
			validated?: boolean;
		} = {};

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

		// Validate fixed SQL using PGlite-aware validation
		// PGlite runs in-browser, so we only block truly unsafe operations
		if (sql) {
			const validation = validateSql(sql);
			if (!validation.ok) {
				return c.json(
					errorResponse('Fixed SQL contains unsafe operations', 'UNSAFE_SQL', {
						reason: validation.error,
					}),
					400,
				);
			}
			
			// Mark as validated (PGlite-aware validation passed)
			responseData.validated = true;
		}
		return c.json(successResponse(responseData));
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		return c.json(
			errorResponse('Internal server error', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;

