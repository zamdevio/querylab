/**
 * POST /ai/suggestions
 * Generate AI suggestions for SQL queries
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { createRateLimiter } from '../lib/rateLimiter';
import { createAuthService } from '../lib/services/auth/auth';
import { successResponse, errorResponse } from '../lib/response';
import { getConfig } from '../lib/config';
import { buildSuggestionsSystemPrompt, type DatabaseSchema } from '../lib/aiPrompts';

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
 * Suggestions request body
 */
interface SuggestionsRequest {
	prompt?: string;
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
 * POST /ai/suggestions
 * Generate AI suggestions for SQL queries
 */
router.post('/', async (c: Context<{ Bindings: Env }>): Promise<Response> => {
	const startTime = Date.now();
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

		// Get user ID from auth (falls back to IP if not authenticated)
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
		let body: SuggestionsRequest;
		try {
			body = await c.req.json<SuggestionsRequest>();
		} catch (_err) {
			return c.json(errorResponse('Invalid JSON in request body', 'INVALID_JSON'), 400);
		}

		// Validate required fields
		if (!body.schema || !body.schema.tables || !Array.isArray(body.schema.tables)) {
			return c.json(errorResponse('Missing or invalid "schema" field', 'INVALID_SCHEMA'), 400);
		}

		// Rate limiting
		const rateLimiter = createRateLimiter(config.storageDo);
		const rateLimitResult = await rateLimiter.checkLimit(userId);

		if (!rateLimitResult.allowed) {
			return c.json(
				errorResponse(
					'Rate limit exceeded. Please try again later.',
					'RATE_LIMIT_EXCEEDED',
					{
						remaining: rateLimitResult.remaining,
					},
				),
				429,
			);
		}

		// Build system prompt for suggestions (natural language prompts only)
		const systemPrompt = buildSuggestionsSystemPrompt(body.schema);
		
		// Build user prompt
		const userPrompt = body.prompt
			? `Generate natural language prompts for: ${body.prompt}`
			: 'Generate 10-15 natural language prompts that users can ask to get useful SQL queries based on the database schema.';

		// Call DeepSeek API
		const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${config.deepseekKey}`,
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
				temperature: 0.7,
				max_tokens: 800,
			}),
		});

		if (!deepseekResponse.ok) {
			const errorText = await deepseekResponse.text();
			const statusCode = deepseekResponse.status as 400 | 401 | 429 | 500 | 502 | 503 | 504;
			return c.json(
				errorResponse('AI service error', 'AI_SERVICE_ERROR', {
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

		// Extract suggestions from AI response (natural language prompts only)
		let suggestions: string[] = [];
		if (deepseekData.choices && deepseekData.choices[0]?.message?.content) {
			const content = deepseekData.choices[0].message.content.trim();
			
			// Remove code blocks if present
			const cleanContent = content.replace(/```[\s\S]*?```/g, '');
			
			// Split by lines and clean up
			const lines = cleanContent.split('\n')
				.map((line) => line.trim())
				.filter((line) => {
					// Filter out empty lines
					if (!line) return false;
					// Skip lines that look like SQL commands
					if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|FROM|WHERE|JOIN)\s/i.test(line)) return false;
					// Skip lines with code block markers
					if (line.includes('```') || (line.startsWith('`') && line.endsWith('`'))) return false;
					// Skip lines that are clearly explanations or metadata
					if (/^(CODE:|EXPLANATION:|SUCCESS|SCHEMA_MISMATCH|INVALID_REQUEST|Here are|These queries)/i.test(line)) return false;
					// Skip lines that are just dashes, bullets, or separators
					if (/^[-*•=]{2,}$/.test(line)) return false;
					// Skip lines that are too short (likely formatting)
					if (line.length < 10) return false;
					return true;
				})
				.map((line) => {
					// Remove bullets, numbering, and other prefixes
					let cleaned = line
						.replace(/^[-*•]\s*/, '')
						.replace(/^\d+[.)]\s*/, '')
						.replace(/^-\s*/, '')
						.replace(/^"\s*/, '') // Remove leading quotes
						.replace(/\s*"$/, '') // Remove trailing quotes
						.trim();
					
					// Remove quotes if the entire line is quoted
					if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
						cleaned = cleaned.slice(1, -1).trim();
					}
					
					return cleaned;
				})
				.filter((line) => {
					// Final validation: reasonable prompt length and doesn't look like SQL
					return line.length >= 10 && 
					       line.length <= 200 && 
					       !/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(line);
				});
			
			// Remove duplicates and limit to 15
			const uniqueSuggestions = Array.from(new Set(lines));
			suggestions = uniqueSuggestions.slice(0, 15);
		}

		const duration = Date.now() - startTime;

		return c.json(
			successResponse({
				suggestions,
				duration,
			}),
		);
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[SUGGESTIONS ERROR]', error);
		return c.json(
			errorResponse('Failed to generate suggestions', 'INTERNAL_ERROR', {
				message: error.message,
			}),
			500,
		);
	}
});

export default router;

