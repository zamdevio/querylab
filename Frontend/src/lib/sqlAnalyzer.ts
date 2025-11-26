/**
 * Analyze SQL and error messages to identify relevant tables
 * This helps optimize data extraction by only sending relevant table data to AI
 */

/**
 * Extract table names from SQL statement
 * Uses simple regex patterns (more lightweight than full AST parsing on frontend)
 */
export function extractTablesFromSql(sql: string): string[] {
	const tables: Set<string> = new Set();

	// Pattern 1: FROM clause (SELECT ... FROM table)
	const fromMatches = sql.matchAll(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
	for (const match of fromMatches) {
		if (match[1]) tables.add(match[1]);
	}

	// Pattern 2: INSERT INTO table
	const insertMatches = sql.matchAll(/INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
	for (const match of insertMatches) {
		if (match[1]) tables.add(match[1]);
	}

	// Pattern 3: UPDATE table
	const updateMatches = sql.matchAll(/UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
	for (const match of updateMatches) {
		if (match[1]) tables.add(match[1]);
	}

	// Pattern 4: JOIN clauses
	const joinMatches = sql.matchAll(/JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
	for (const match of joinMatches) {
		if (match[1]) tables.add(match[1]);
	}

	return Array.from(tables);
}

/**
 * Extract table name from error message
 * Handles common SQLite error patterns:
 * - "UNIQUE constraint failed: table.column"
 * - "FOREIGN KEY constraint failed"
 * - "no such table: table"
 * - "no such column: table.column"
 */
export function extractTableFromError(errorMessage: string): string | null {
	if (!errorMessage) return null;

	// Pattern 1: UNIQUE constraint failed: table.column
	const uniqueMatch = errorMessage.match(/UNIQUE\s+constraint\s+failed:\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
	if (uniqueMatch && uniqueMatch[1]) {
		return uniqueMatch[1];
	}

	// Pattern 2: FOREIGN KEY constraint failed (might mention table in context)
	const fkMatch = errorMessage.match(/FOREIGN\s+KEY\s+constraint\s+failed/i);
	if (fkMatch) {
		// Try to find table name nearby
		const tableMatch = errorMessage.match(/(?:table|in)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
		if (tableMatch && tableMatch[1]) {
			return tableMatch[1];
		}
	}

	// Pattern 3: no such table: table
	const noTableMatch = errorMessage.match(/no\s+such\s+table:\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
	if (noTableMatch && noTableMatch[1]) {
		return noTableMatch[1];
	}

	// Pattern 4: no such column: table.column or column
	const noColumnMatch = errorMessage.match(/no\s+such\s+column:\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/i);
	if (noColumnMatch && noColumnMatch[1]) {
		return noColumnMatch[1];
	}

	// Pattern 5: CHECK constraint failed (might mention table)
	const checkMatch = errorMessage.match(/CHECK\s+constraint\s+failed/i);
	if (checkMatch) {
		const tableMatch = errorMessage.match(/(?:table|in)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
		if (tableMatch && tableMatch[1]) {
			return tableMatch[1];
		}
	}

	// Pattern 6: NOT NULL constraint failed: table.column
	const notNullMatch = errorMessage.match(/NOT\s+NULL\s+constraint\s+failed:\s*([a-zA-Z_][a-zA-Z0-9_]*)\./i);
	if (notNullMatch && notNullMatch[1]) {
		return notNullMatch[1];
	}

	return null;
}

/**
 * Get relevant tables for AI context based on SQL and error message
 * Returns array of table names that are likely to be relevant
 */
export function getRelevantTables(sql: string, errorMessage?: string | null): string[] {
	const tables: Set<string> = new Set();

	// Extract tables from SQL
	const sqlTables = extractTablesFromSql(sql);
	sqlTables.forEach((table) => tables.add(table));

	// Extract table from error message (if provided)
	if (errorMessage) {
		const errorTable = extractTableFromError(errorMessage);
		if (errorTable) {
			tables.add(errorTable);
		}
	}

	return Array.from(tables);
}

