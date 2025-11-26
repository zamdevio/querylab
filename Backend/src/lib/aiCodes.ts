/**
 * AI response codes system
 * AI returns codes in format: CODE:DESCRIPTION
 * System interprets codes and shows prepared messages to users
 */

export type AICode =
	| 'SUCCESS'
	| 'SCHEMA_MISMATCH'
	| 'INVALID_REQUEST'
	| 'COMPLEX_QUERY'
	| 'NO_DATA'
	| 'UNSUPPORTED_OPERATION'
	| 'NOT_SQL_REQUEST';

export interface AICodeResponse {
	code: AICode;
	message: string;
	sql?: string;
	explanation?: string;
}

/**
 * Prepared user messages based on AI codes
 */
const CODE_MESSAGES: Record<AICode, string> = {
	SUCCESS: 'SQL generated successfully! Review it before running.',
	SCHEMA_MISMATCH:
		"The requested query doesn't match your database schema. Please check your tables and columns.",
	INVALID_REQUEST:
		"Your request couldn't be understood. Please try rephrasing your question.",
	COMPLEX_QUERY:
		'This query is too complex or too long (exceeds 50 lines). Please break it into smaller parts or simplify your request.',
	NO_DATA: 'No data found matching your criteria.',
	UNSUPPORTED_OPERATION:
		'This operation is not supported. Only SELECT, INSERT, and UPDATE queries are allowed.',
	NOT_SQL_REQUEST: 'This question is not about SQL operations. I can help you write SQL queries!',
};

/**
 * Parse AI response to extract code and SQL
 * Format: CODE:DESCRIPTION\n\nSQL_STATEMENT
 */
export function parseAIResponse(response: string): AICodeResponse {
	// Trim response to handle any leading/trailing whitespace
	const trimmedResponse = response.trim();
	
	// Look for code pattern: CODE: or [CODE] or CODE -
	// Updated to handle "CODE:NOT_SQL_REQUEST" format at the start
	const codePatterns = [
		/^CODE:\s*(SUCCESS|SCHEMA_MISMATCH|INVALID_REQUEST|COMPLEX_QUERY|NO_DATA|UNSUPPORTED_OPERATION|NOT_SQL_REQUEST)/i,
		/^(SUCCESS|SCHEMA_MISMATCH|INVALID_REQUEST|COMPLEX_QUERY|NO_DATA|UNSUPPORTED_OPERATION|NOT_SQL_REQUEST):/i,
		/\[(SUCCESS|SCHEMA_MISMATCH|INVALID_REQUEST|COMPLEX_QUERY|NO_DATA|UNSUPPORTED_OPERATION|NOT_SQL_REQUEST)\]/i,
		/^(SUCCESS|SCHEMA_MISMATCH|INVALID_REQUEST|COMPLEX_QUERY|NO_DATA|UNSUPPORTED_OPERATION|NOT_SQL_REQUEST)\s*-/i,
	];

	let code: AICode = 'SUCCESS';
	let message = CODE_MESSAGES.SUCCESS;
	let sql = '';
	let explanation = '';

	// Try to extract code
	for (const pattern of codePatterns) {
		const match = trimmedResponse.match(pattern);
		if (match) {
			// For "CODE:NOT_SQL_REQUEST" format, match[1] will be the code
			// For other formats, extract appropriately
			let extractedCode: string;
			if (pattern.source.includes('^CODE:')) {
				extractedCode = match[1]?.toUpperCase() || '';
			} else {
				extractedCode = (match[1] || match[0].split(/[:\[]/)[0]).toUpperCase();
			}
			// Validate it's a known code
			if (['SUCCESS', 'SCHEMA_MISMATCH', 'INVALID_REQUEST', 'COMPLEX_QUERY', 'NO_DATA', 'UNSUPPORTED_OPERATION', 'NOT_SQL_REQUEST'].includes(extractedCode)) {
				code = extractedCode as AICode;
				message = CODE_MESSAGES[code] || CODE_MESSAGES.SUCCESS;
				break;
			}
		}
	}

	// Check if SQL field contains "NOT_SQL_REQUEST" text (AI sometimes puts it in SQL field)
	// Pattern matches: "NOT_SQL_REQUEST" at the start, optionally followed by newlines and explanation
	const notSqlRequestPattern = /^NOT_SQL_REQUEST\s*(?:\n|$)/i;
	const notSqlRequestWithExplanationPattern = /^NOT_SQL_REQUEST\s*\n\s*EXPLANATION:\s*(.+?)(?:\n\n|$)/is;
	
	// For NOT_SQL_REQUEST, don't extract SQL - it should be empty
	if (code === 'NOT_SQL_REQUEST') {
		sql = '';
	} else {
		// Extract SQL (usually after code or in code blocks)
		const sqlBlockMatch = trimmedResponse.match(/```sql\n?([\s\S]*?)\n?```/i);
		if (sqlBlockMatch) {
			const extractedSql = sqlBlockMatch[1].trim();
			// Check if extracted SQL is actually NOT_SQL_REQUEST
			if (notSqlRequestPattern.test(extractedSql) || notSqlRequestWithExplanationPattern.test(extractedSql)) {
				code = 'NOT_SQL_REQUEST';
				message = CODE_MESSAGES.NOT_SQL_REQUEST;
				sql = '';
				// Try to extract explanation from the SQL field if present
				const explanationInSql = extractedSql.match(/EXPLANATION:\s*(.+?)(?:\n\n|$)/is);
				if (explanationInSql && !explanation) {
					explanation = explanationInSql[1].trim();
				}
			} else {
				sql = extractedSql;
			}
		} else {
			// Try to find SQL after "SQL_STATEMENT:" marker
			// Match SQL_STATEMENT: followed by content until EXPLANATION: or end
			// Use a more precise pattern that stops at EXPLANATION: marker
			const sqlStatementMatch = trimmedResponse.match(/SQL_STATEMENT:\s*([\s\S]*?)(?=\n\s*EXPLANATION:|$)/i);
			if (sqlStatementMatch) {
				const extractedSql = sqlStatementMatch[1].trim();
				// Check if code is NOT_SQL_REQUEST (using string comparison to avoid type narrowing)
				const isNotSqlRequest = (code as string) === 'NOT_SQL_REQUEST';
				if (isNotSqlRequest) {
					sql = '';
				} else if (!extractedSql || extractedSql.length === 0) {
					// If SQL_STATEMENT is empty, keep SQL empty
					sql = '';
				} else {
					// Check if extracted SQL is actually NOT_SQL_REQUEST
					if (notSqlRequestPattern.test(extractedSql) || notSqlRequestWithExplanationPattern.test(extractedSql)) {
						code = 'NOT_SQL_REQUEST';
						message = CODE_MESSAGES.NOT_SQL_REQUEST;
						sql = '';
						// Try to extract explanation from the SQL field if present
						const explanationInSql = extractedSql.match(/EXPLANATION:\s*(.+?)(?:\n\n|$)/is);
						if (explanationInSql && !explanation) {
							explanation = explanationInSql[1].trim();
						}
					} else {
						sql = extractedSql;
					}
				}
			} else {
			// Try to find SQL after code line
			const lines = trimmedResponse.split('\n');
			let sqlStart = false;
			const sqlLines: string[] = [];
			let foundExplanation = false;

			for (const line of lines) {
				// Stop if we hit EXPLANATION marker
				if (line.match(/^EXPLANATION:/i)) {
					foundExplanation = true;
					break;
				}
				
				// Skip CODE: and SQL_STATEMENT: marker lines
				if (line.match(/^(CODE|SQL_STATEMENT):/i)) {
					continue;
				}
				
				// If code is NOT_SQL_REQUEST, don't collect any SQL lines - skip to explanation
				// Use string comparison to avoid TypeScript narrowing issues
				if ((code as string) === 'NOT_SQL_REQUEST') {
					break;
				}
				
				// Check if line contains NOT_SQL_REQUEST
				if (line.match(/^NOT_SQL_REQUEST\s*$/i)) {
					code = 'NOT_SQL_REQUEST';
					message = CODE_MESSAGES.NOT_SQL_REQUEST;
					sql = '';
					break;
				}
				
				if (sqlStart) {
					// Continue collecting SQL lines until we hit a non-SQL marker
					if (line.trim() && !line.match(/^(CODE|RESPONSE|EXPLANATION|SQL_STATEMENT):/i)) {
						sqlLines.push(line);
					}
				} else if (line.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|TRUNCATE)/i)) {
					sqlStart = true;
					sqlLines.push(line);
				}
			}

			if (sqlLines.length > 0) {
				// Join with newlines to preserve multi-line formatting
				const extractedSql = sqlLines.join('\n').trim();
				// If code is already NOT_SQL_REQUEST, don't process SQL lines
				if (code === 'NOT_SQL_REQUEST') {
					sql = '';
				} else {
					// Check if extracted SQL is actually NOT_SQL_REQUEST
					if (notSqlRequestPattern.test(extractedSql) || notSqlRequestWithExplanationPattern.test(extractedSql)) {
						code = 'NOT_SQL_REQUEST';
						message = CODE_MESSAGES.NOT_SQL_REQUEST;
						sql = '';
						// Try to extract explanation from the SQL field if present
						const explanationInSql = extractedSql.match(/EXPLANATION:\s*(.+?)(?:\n\n|$)/is);
						if (explanationInSql && !explanation) {
							explanation = explanationInSql[1].trim();
						}
					} else {
						sql = extractedSql;
					}
				}
			}
		}
		}
	}

	// Extract explanation if present
	const explanationMatch = trimmedResponse.match(/EXPLANATION:\s*(.+?)(?:\n\n|$)/is);
	if (explanationMatch) {
		explanation = explanationMatch[1].trim();
	}
	
	// If code is NOT_SQL_REQUEST, ensure SQL is empty and extract explanation if needed
	if (code === 'NOT_SQL_REQUEST') {
		sql = '';
		// If no explanation was extracted but response has content, try to extract it
		if (!explanation && response.trim()) {
			// Try to find explanation after NOT_SQL_REQUEST
			const notSqlExplanationMatch = response.match(/NOT_SQL_REQUEST\s*\n\s*EXPLANATION:\s*(.+?)(?:\n\n|$)/is);
			if (notSqlExplanationMatch) {
				explanation = notSqlExplanationMatch[1].trim();
			} else {
				// Fallback: use the rest of the response as explanation
				const cleaned = response
					.replace(/^(NOT_SQL_REQUEST|CODE|SQL_STATEMENT)[:\[]/i, '')
					.replace(/^NOT_SQL_REQUEST\s*\n?/i, '')
					.replace(/SQL_STATEMENT:\s*NOT_SQL_REQUEST\s*\n?/i, '')
					.trim();
				if (cleaned && cleaned.length > 10) {
					explanation = cleaned;
				}
			}
		}
	}

	// Check SQL line count - if exceeds 50 lines, set code to COMPLEX_QUERY
	if (sql && code === 'SUCCESS') {
		const sqlLines = sql.split('\n').filter(line => line.trim().length > 0);
		if (sqlLines.length > 50) {
			code = 'COMPLEX_QUERY';
			message = CODE_MESSAGES.COMPLEX_QUERY;
			sql = ''; // Empty SQL for complex queries
			if (!explanation) {
				explanation = `The generated SQL query is ${sqlLines.length} lines long, which exceeds the maximum limit of 50 lines. Please break your request into smaller, simpler queries.`;
			}
		}
	}

	// If no SQL found but response exists and not NOT_SQL_REQUEST, use response as SQL (fallback)
	if (!sql && response.trim() && code !== 'NOT_SQL_REQUEST') {
		// Remove code line if present
		const cleaned = response
			.replace(/^(SUCCESS|SCHEMA_MISMATCH|INVALID_REQUEST|COMPLEX_QUERY|NO_DATA|UNSUPPORTED_OPERATION|NOT_SQL_REQUEST)[:\[]/i, '')
			.trim();
		if (cleaned && cleaned.length > 10) {
			sql = cleaned;
		}
	}

	// Check SQL line count - if exceeds 50 lines, set code to COMPLEX_QUERY
	if (sql && code === 'SUCCESS') {
		const sqlLines = sql.split('\n').filter(line => line.trim().length > 0);
		if (sqlLines.length > 50) {
			code = 'COMPLEX_QUERY';
			message = CODE_MESSAGES.COMPLEX_QUERY;
			sql = ''; // Empty SQL for complex queries
			if (!explanation) {
				explanation = `The generated SQL query is ${sqlLines.length} lines long, which exceeds the maximum limit of 50 lines. Please break your request into smaller, simpler queries.`;
			}
		}
	}

	return {
		code,
		message,
		sql: code === 'NOT_SQL_REQUEST' || code === 'COMPLEX_QUERY' ? '' : (sql || undefined),
		explanation: explanation || undefined,
	};
}

/**
 * Get user-friendly message for code
 */
export function getCodeMessage(code: AICode): string {
	return CODE_MESSAGES[code];
}

