/**
 * PGlite-aware SQL validation service
 * - Uses node-sql-parser for AST-based validation
 * - PGlite runs in-browser (WASM), so most dangerous operations are already blocked
 * - Only blocks truly unsafe operations that could cause issues
 * - Allows all standard SQL commands for learning/practice
 */

import { Parser, AST } from 'node-sql-parser';

const parser = new Parser();

/**
 * Result of SQL validation
 */
export type ValidationResult =
	| {
			ok: true;
			statements: AST | AST[];
	  }
	| {
			ok: false;
			error: string;
	  };

/**
 * Allowed SQL statement types
 * Allow all standard SQL commands for PGlite (PostgreSQL in-browser)
 */
const ALLOWED_TYPES = new Set<string>([
	'select',
	'insert',
	'update',
	'delete',
	'create',
	'drop',
	'alter',
	'truncate',
	'with', // CTE (Common Table Expression)
]);

/**
 * Blocked keywords for PGlite safety
 * Only block operations that could cause issues in browser context:
 * - COPY FROM/TO: Attempts file system access (not supported in PGlite anyway)
 * - CREATE EXTENSION: Could try to load unsafe code
 * - GRANT/REVOKE: Not relevant in browser, but could cause confusion
 * - CREATE USER/ROLE: Not relevant in browser
 * - ATTACH: SQLite-specific, not in PostgreSQL
 * - PRAGMA: SQLite-specific, not in PostgreSQL
 * - VACUUM: Safe in PostgreSQL, but we'll allow it for learning
 * - SHELL: Doesn't exist in PostgreSQL
 */
/**
 * Blocked patterns for PGlite safety
 * Only block operations that could cause issues in browser context
 */
const BLOCKED_PATTERNS: readonly { pattern: RegExp; name: string }[] = [
	{ pattern: /\bcopy\s+from\b/i, name: 'COPY FROM' }, // File system access attempt
	{ pattern: /\bcopy\s+to\b/i, name: 'COPY TO' }, // File system access attempt
	{ pattern: /\\copy/i, name: '\\COPY' }, // psql command (not SQL)
	{ pattern: /\bcreate\s+extension\b/i, name: 'CREATE EXTENSION' }, // Could try to load unsafe code
	{ pattern: /\bgrant\s+/i, name: 'GRANT' }, // Not relevant in browser context
	{ pattern: /\brevoke\s+/i, name: 'REVOKE' }, // Not relevant in browser context
	{ pattern: /\bcreate\s+user\b/i, name: 'CREATE USER' }, // Not relevant in browser context
	{ pattern: /\bcreate\s+role\b/i, name: 'CREATE ROLE' }, // Not relevant in browser context
	{ pattern: /\bdrop\s+user\b/i, name: 'DROP USER' }, // Not relevant in browser context
	{ pattern: /\bdrop\s+role\b/i, name: 'DROP ROLE' }, // Not relevant in browser context
] as const;

/**
 * Parse SQL to AST
 * @param sql - SQL string to parse
 * @returns AST or throws error
 */
export function parseSqlToAst(sql: string): AST | AST[] {
	try {
		const ast = parser.astify(sql);
		return ast;
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		throw new Error(`SQL parse error: ${error.message}`);
	}
}

/**
 * Extract table names from AST node
 * @param node - AST node
 * @returns Array of table names found
 */
function extractTableNames(node: AST): string[] {
	const tables: string[] = [];

	// Handle SELECT statements with FROM clause
	if ('from' in node && node.from) {
		const fromItems = Array.isArray(node.from) ? node.from : [node.from];
		for (const fromItem of fromItems) {
			if (fromItem && typeof fromItem === 'object') {
				if ('table' in fromItem && fromItem.table) {
					let tableName: string | null = null;
					if (typeof fromItem.table === 'string') {
						tableName = fromItem.table;
					} else if (typeof fromItem.table === 'object' && fromItem.table !== null && 'table' in fromItem.table) {
						tableName = String((fromItem.table as { table: unknown }).table);
					}
					if (tableName) tables.push(tableName);
				}
				if ('expr' in fromItem && fromItem.expr && typeof fromItem.expr === 'object') {
					if ('table' in fromItem.expr && fromItem.expr.table) {
						tables.push(String(fromItem.expr.table));
					}
				}
			}
		}
	}

	// Handle INSERT/UPDATE statements with table property
	if ('table' in node && node.table) {
		const tableItems = Array.isArray(node.table) ? node.table : [node.table];
		for (const tableItem of tableItems) {
			if (tableItem && typeof tableItem === 'object') {
				if ('table' in tableItem && tableItem.table) {
					tables.push(String(tableItem.table));
				}
			}
		}
	}

	return tables;
}

/**
 * Validate SQL statement
 * @param sql - SQL string to validate
 * @param allowedTables - Optional array of allowed table names
 * @returns ValidationResult with ok status and either statements or error
 */
export function validateSql(
	sql: string,
	allowedTables?: readonly string[],
): ValidationResult {
	// Check for empty SQL
	if (!sql || typeof sql !== 'string') {
		return { ok: false, error: 'Empty SQL' };
	}

	// Allow multiple statements for PGlite (it supports them)
	// Just split to validate each one
	const statements = sql
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean);
	
	if (statements.length === 0) {
		return { ok: false, error: 'Empty SQL' };
	}

	// Parse SQL to AST
	let ast: AST | AST[];
	try {
		ast = parseSqlToAst(sql);
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		return { ok: false, error: error.message };
	}

	// Normalize to array - handle multiple statements
	const astArray = Array.isArray(ast) ? ast : [ast];
	const nodes: AST[] = [];
	
	// Flatten if we have multiple statements
	for (const a of astArray) {
		if (Array.isArray(a)) {
			nodes.push(...a);
		} else {
			nodes.push(a);
		}
	}

	// Validate each node
	for (const node of nodes) {
		// Check statement type
		const type = (node.type || '').toLowerCase();
		if (!ALLOWED_TYPES.has(type)) {
			return {
				ok: false,
				error: `Statement type '${type}' is not supported. Supported types: ${Array.from(ALLOWED_TYPES).join(', ').toUpperCase()}.`,
			};
		}

		// Check for blocked patterns in SQL
		// PGlite runs in-browser, so we only block truly unsafe operations
		for (const blocked of BLOCKED_PATTERNS) {
			if (blocked.pattern.test(sql)) {
				return {
					ok: false,
					error: `Operation '${blocked.name}' is not allowed in PGlite (browser environment).`,
				};
			}
		}

		// Optional: enforce allowedTables
		if (allowedTables && allowedTables.length > 0) {
			const tablesFound = extractTableNames(node);
			for (const table of tablesFound) {
				if (!allowedTables.includes(table)) {
					return {
						ok: false,
						error: `Table '${table}' is not allowed. Allowed tables: ${allowedTables.join(', ')}`,
					};
				}
			}
		}
	}

	return { ok: true, statements: ast };
}

