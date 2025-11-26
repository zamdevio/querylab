/**
 * PGlite client wrapper with IndexedDB persistence
 * PostgreSQL in WASM for standard SQL syntax support
 */

import { addDbToList, listDbsWithMetadata, getDbMetadata, setDbMetadata } from './indexedDb';

// Dynamic import for PGlite to avoid SSR issues
let PGliteClass: typeof import('@electric-sql/pglite').PGlite | null = null;

async function getPGlite(): Promise<typeof import('@electric-sql/pglite').PGlite> {
	if (!PGliteClass) {
		// Only import in browser environment
		if (typeof window !== 'undefined') {
			const pgliteModule = await import('@electric-sql/pglite');
			PGliteClass = pgliteModule.PGlite;
		} else {
			throw new Error('PGlite can only be used in browser environment');
		}
	}
	return PGliteClass;
}

// Database type - PGlite instance
export type Database = InstanceType<Awaited<ReturnType<typeof getPGlite>>>;

/**
 * Create a new database with a specific key
 */
export async function createDb(seedSql?: string, key?: string): Promise<Database> {
	// Create PGlite instance with IndexedDB persistence (browser mode)
	// For browser, only use idb:// prefix, no dataDir option
	const PGlite = await getPGlite();
	const dbKey = key ? `idb://querylab-db-${key}` : 'idb://querylab-db';
	const db = new PGlite(dbKey);
	
	await db.waitReady;
	
	if (seedSql) {
		try {
			// Convert SQLite syntax to PostgreSQL if needed
			const pgSql = convertSqliteToPostgres(seedSql);
			await db.exec(pgSql);
		} catch (err) {
			// Re-throw for caller to handle
			throw err;
		}
	}
	
	// Add to list if key provided
	if (key) {
		await addDbToList(key);
		await setDbMetadata(key, {
			name: `Database ${key}`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			key,
		});
	}
	
	return db;
}

/**
 * Create a new named database
 */
export async function createNamedDb(name: string, seedSql?: string): Promise<{ db: Database; key: string }> {
	const key = `db-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const db = await createDb(seedSql, key);
	
	// Update metadata with name
	await setDbMetadata(key, {
		name,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		key,
	});
	
	return { db, key };
}

/**
 * Load database from IndexedDB
 * PGlite automatically loads from IndexedDB if it exists
 */
export async function loadDbFromStorage(key: string): Promise<Database | null> {
	try {
		// PGlite uses IndexedDB for persistence in browser
		// Use the key as part of the idb:// path
		const PGlite = await getPGlite();
		const db = new PGlite(`idb://querylab-db-${key}`);
		
		await db.waitReady;
		return db;
	} catch {
		return null;
	}
}

/**
 * Save database to IndexedDB
 * PGlite automatically persists to IndexedDB, but we can trigger a checkpoint
 */
export async function saveDbToStorage(key: string, _db: Database): Promise<void> {
	try {
		// PGlite auto-persists to IndexedDB, just add to list and update metadata
		await addDbToList(key);
		const metadata = await getDbMetadata(key);
		if (metadata) {
			await setDbMetadata(key, {
				...metadata,
				updatedAt: Date.now(),
			});
		}
	} catch (err) {
		// Re-throw for caller to handle
		throw err;
	}
}

/**
 * List all available databases
 */
export async function listAllDatabases(): Promise<Array<{ key: string; name: string; updatedAt: number }>> {
	return await listDbsWithMetadata();
}

/**
 * Delete a database
 */
export async function deleteDatabase(key: string): Promise<void> {
	try {
		// PGlite databases in IndexedDB are automatically cleaned up
		// We just need to remove from our list
		const { deleteDb } = await import('./indexedDb');
		await deleteDb(key);
	} catch {
		// Re-throw for caller to handle
		throw new Error('Failed to delete database');
	}
}

/**
 * Check if SQL statement is a SELECT query
 */
function isSelectQuery(sql: string): boolean {
	const trimmed = sql.trim().toUpperCase();
	return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
}

/**
 * Run SQL query on database
 * Supports multiple statements separated by semicolons
 */
export async function runQuery(
	db: Database,
	sql: string,
): Promise<{ ok: true; results: unknown[] } | { ok: false; error: string }> {
	try {
		// Convert SQLite syntax to PostgreSQL if needed
		const pgSql = convertSqliteToPostgres(sql);
		
		// Split into individual statements
		const statements = pgSql
			.split(';')
			.map((s) => s.trim())
			.filter(Boolean);
		
		if (statements.length === 0) {
			return { ok: true, results: [] };
		}
		
		// Execute statements sequentially
		const transformedResults: unknown[] = [];
		let lastResult: { rows: unknown[]; fields?: Array<{ name: string }> } | null = null;
		
		for (const statement of statements) {
			if (isSelectQuery(statement)) {
				// Use query() for SELECT statements to get results
				lastResult = await db.query(statement);
			} else {
				// Use exec() for non-SELECT statements (CREATE, INSERT, UPDATE, DELETE, etc.)
				await db.exec(statement);
				lastResult = null; // Non-SELECT statements don't return rows
			}
		}
		
		// Only return results from the last SELECT statement (if any)
		if (lastResult && lastResult.rows && lastResult.rows.length > 0) {
			// Transform rows to match sql.js format: { columns: string[], values: unknown[][] }
			const columns = lastResult.fields?.map((f: { name: string }) => f.name) || [];
			const values = lastResult.rows.map((row: unknown) => {
				if (Array.isArray(row)) {
					return row;
				}
				// If row is an object, convert to array
				if (typeof row === 'object' && row !== null) {
					const rowObj = row as Record<string, unknown>;
					return columns.map((col: string) => rowObj[col]);
				}
				return [];
			});
			
			transformedResults.push({
				columns,
				values,
			});
		}
		
		return { ok: true, results: transformedResults };
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		return { ok: false, error: error.message };
	}
}

/**
 * Get table schema using PostgreSQL information_schema
 */
export async function getTableSchema(db: Database, tableName: string): Promise<unknown[] | null> {
	try {
		let result;
		try {
			result = await db.query(`
				SELECT 
					c.column_name as name,
					c.data_type as type,
					(c.is_nullable = 'NO')::boolean as notnull,
					c.column_default as dflt_value,
					CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END as pk,
					0 as cid
				FROM information_schema.columns c
				LEFT JOIN (
					SELECT kcu.column_name
					FROM information_schema.table_constraints tc
					JOIN information_schema.key_column_usage kcu
						ON tc.constraint_name = kcu.constraint_name
						AND tc.table_schema = kcu.table_schema
						AND tc.table_catalog = kcu.table_catalog
					WHERE tc.constraint_type = 'PRIMARY KEY'
						AND tc.table_name = $1
						AND tc.table_schema = 'public'
				) pk ON c.column_name = pk.column_name
				WHERE c.table_name = $1
					AND c.table_schema = 'public'
				ORDER BY c.ordinal_position
			`, [tableName]);
		} catch {
			// Fallback: use pg_attribute
			result = await db.query(`
				SELECT 
					a.attname as name,
					pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
					NOT a.attnotnull as notnull,
					a.atthasdef as has_default,
					CASE WHEN pk.attname IS NOT NULL THEN 1 ELSE 0 END as pk,
					a.attnum as cid
				FROM pg_attribute a
				JOIN pg_class c ON a.attrelid = c.oid
				JOIN pg_namespace n ON c.relnamespace = n.oid
				LEFT JOIN (
					SELECT k.attname
					FROM pg_index i
					JOIN pg_attribute k ON i.indrelid = k.attrelid AND k.attnum = ANY(i.indkey)
					WHERE i.indisprimary = true
						AND i.indrelid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
				) pk ON a.attname = pk.attname
				WHERE c.relname = $1
					AND n.nspname = 'public'
					AND a.attnum > 0
					AND NOT a.attisdropped
				ORDER BY a.attnum
			`, [tableName]);
		}
		
		if (result.rows && result.rows.length > 0) {
			return result.rows.map((row: unknown) => {
				if (typeof row === 'object' && row !== null) {
					const r = row as Record<string, unknown>;
					return {
						cid: 0, // Not applicable in PostgreSQL
						name: r.name,
						type: r.type,
						notnull: r.notnull ? 1 : 0,
						dflt_value: r.dflt_value,
						pk: r.pk ? 1 : 0,
					};
				}
				return row;
			});
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * List all tables in database using PostgreSQL information_schema
 */
export async function listTables(db: Database): Promise<string[]> {
	try {
		// Try multiple approaches to get table names
		let result;
		
		// Approach 1: information_schema
		try {
			result = await db.query(`
				SELECT table_name 
				FROM information_schema.tables 
				WHERE table_schema = 'public' 
					AND table_type = 'BASE TABLE'
				ORDER BY table_name
			`);
		} catch {
			// Approach 2: pg_tables
			try {
				result = await db.query(`
					SELECT tablename as table_name
					FROM pg_tables
					WHERE schemaname = 'public'
					ORDER BY tablename
				`);
			} catch {
				// Approach 3: Direct query on pg_class
				result = await db.query(`
					SELECT relname as table_name
					FROM pg_class
					WHERE relkind = 'r'
						AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
					ORDER BY relname
				`);
			}
		}
		
		if (result && result.rows && result.rows.length > 0) {
			const tableNames: string[] = [];
			
			for (const row of result.rows) {
				if (typeof row === 'object' && row !== null) {
					const r = row as Record<string, unknown>;
					const tableName = r.table_name || r['table_name'] || r.tablename || r.relname || r[0];
					if (tableName && typeof tableName === 'string') {
						tableNames.push(tableName);
					}
				} else if (Array.isArray(row) && row.length > 0) {
					tableNames.push(String(row[0]));
				}
			}
			
			return tableNames.filter(Boolean);
		}
		
		return [];
	} catch {
		// Fallback: try to query pg_class directly
		try {
			const fallbackResult = await db.query(`
				SELECT relname
				FROM pg_class
				WHERE relkind = 'r' AND relname NOT LIKE 'pg_%' AND relname NOT LIKE '_%'
				ORDER BY relname
			`);
			if (fallbackResult && fallbackResult.rows) {
				return fallbackResult.rows.map((row: unknown) => {
					if (typeof row === 'object' && row !== null) {
						const r = row as Record<string, unknown>;
						return String(r.relname || '');
					}
					return String(row);
				}).filter(Boolean);
			}
		} catch {
			// Silent fail
		}
		return [];
	}
}

/**
 * Validate SQL file content
 */
export function validateSqlFile(content: string): {
	valid: boolean;
	error?: string;
	statements: string[];
} {
	if (!content || typeof content !== 'string') {
		return { valid: false, error: 'Empty SQL file', statements: [] };
	}

	// Basic validation: check for dangerous statements
	const dangerousKeywords = [
		'ATTACH',
		'DETACH',
		'PRAGMA',
		'VACUUM',
		'ANALYZE',
		'.shell',
		'.read',
		'.open',
	];

	const upperContent = content.toUpperCase();
	for (const keyword of dangerousKeywords) {
		if (upperContent.includes(keyword)) {
			return {
				valid: false,
				error: `Dangerous keyword '${keyword}' is not allowed`,
				statements: [],
			};
		}
	}

	// Split into statements
	const statements = content
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean);

	return { valid: true, statements };
}

/**
 * Import SQL file and execute on database
 * Handles sequences properly by executing statements in order
 */
export async function importSqlFile(
	db: Database,
	sqlContent: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const validation = validateSqlFile(sqlContent);
	
	if (!validation.valid) {
		return { ok: false, error: validation.error || 'Invalid SQL file' };
	}

	try {
		// Split into statements and process them
		// First pass: create sequences, then tables, then data
		const sequences: string[] = [];
		const tables: string[] = [];
		const inserts: string[] = [];
		const others: string[] = [];
		
		for (const statement of validation.statements) {
			const trimmed = statement.trim().toUpperCase();
			if (trimmed.startsWith('CREATE SEQUENCE')) {
				sequences.push(statement);
			} else if (trimmed.startsWith('CREATE TABLE')) {
				tables.push(statement);
			} else if (trimmed.startsWith('INSERT INTO')) {
				inserts.push(statement);
			} else if (trimmed.startsWith('SELECT SETVAL') || trimmed.startsWith('SELECT SET_VAL')) {
				// Sequence setval commands should come after sequences are created
				sequences.push(statement);
			} else if (trimmed) {
				others.push(statement);
			}
		}
		
		// Execute sequences first (required before tables that reference them)
		// Ensure sequences are created and committed before tables reference them
		for (const statement of sequences) {
			if (statement.trim()) {
				const pgSql = convertSqliteToPostgres(statement);
				try {
					if (pgSql.trim().toUpperCase().startsWith('SELECT')) {
						// SELECT SETVAL - execute but don't fail if it errors
						try {
							await db.query(pgSql);
						} catch (queryErr) {
							// Ignore setval errors - sequence might already be set correctly
							console.warn('Setval query failed (non-critical):', queryErr);
						}
					} else {
						// CREATE SEQUENCE - use exec() and ensure it completes
						// Remove IF NOT EXISTS temporarily to ensure it's created
						const createSeqSql = pgSql.replace(/IF NOT EXISTS /gi, '');
						await db.exec(createSeqSql);
					}
				} catch (err) {
					// If it's a sequence that already exists, continue
					const errorMsg = err instanceof Error ? err.message : String(err);
					if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
						continue; // Skip if sequence already exists
					}
					// Try with IF NOT EXISTS if direct creation failed
					try {
						const withIfNotExists = pgSql.includes('IF NOT EXISTS') ? pgSql : pgSql.replace(/CREATE SEQUENCE /i, 'CREATE SEQUENCE IF NOT EXISTS ');
						await db.exec(withIfNotExists);
					} catch {
						throw err; // Re-throw original error if both attempts fail
					}
				}
			}
		}
		
		// Small delay to ensure all sequences are committed and visible
		if (sequences.length > 0) {
			await new Promise(resolve => setTimeout(resolve, 50));
		}
		
		// Then execute tables (sequences are now available)
		// If table creation fails due to missing sequence, provide helpful error
		for (const statement of tables) {
			if (statement.trim()) {
				const pgSql = convertSqliteToPostgres(statement);
				try {
					await db.exec(pgSql);
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					// If table already exists, skip it
					if (errorMsg.includes('already exists')) {
						continue;
					}
					// If sequence doesn't exist, try to find and create missing sequences
					if (errorMsg.includes('does not exist') && (errorMsg.includes('seq') || errorMsg.includes('sequence'))) {
						// Extract sequence name from error message
						// Error format: "relation \"categories_category_id_seq\" does not exist"
						// Try multiple patterns to match sequence names
						const seqMatch = errorMsg.match(/"([^"]*_seq)"/) 
							|| errorMsg.match(/'([^']*_seq)'/)
							|| errorMsg.match(/(\w+_\w+_\w+_seq)/)
							|| errorMsg.match(/(\w+_\w+_seq)/)
							|| errorMsg.match(/(\w+_seq)/);
						
						if (seqMatch && seqMatch[1]) {
							const seqName = seqMatch[1];
							try {
								// Try to create the missing sequence - try both with and without schema
								try {
									await db.exec(`CREATE SEQUENCE IF NOT EXISTS public.${seqName} START 1 INCREMENT 1;`);
								} catch {
									// If public schema fails, try without schema
									await db.exec(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START 1 INCREMENT 1;`);
								}
								
								// Small delay to ensure sequence is visible
								await new Promise(resolve => setTimeout(resolve, 50));
								
								// Retry table creation
								await db.exec(pgSql);
								continue; // Success after creating sequence
							} catch {
								// If retry fails, try to extract sequence name from the CREATE TABLE statement itself
								// Look for nextval('sequence_name') pattern in the SQL
								const nextvalMatch = pgSql.match(/nextval\(['"]([^'"]*_seq)['"]/i);
								if (nextvalMatch && nextvalMatch[1]) {
									const seqFromSql = nextvalMatch[1];
									try {
										await db.exec(`CREATE SEQUENCE IF NOT EXISTS ${seqFromSql} START 1 INCREMENT 1;`);
										await new Promise(resolve => setTimeout(resolve, 50));
										await db.exec(pgSql);
										continue;
									} catch {
										// If all retries fail, throw original error
										throw err;
									}
								}
								// If we can't find sequence name, throw original error
								throw err;
							}
						}
					}
					throw err; // Re-throw other errors
				}
			}
		}
		
		// Then execute inserts
		for (const statement of inserts) {
			if (statement.trim()) {
				const pgSql = convertSqliteToPostgres(statement);
				try {
					await db.exec(pgSql);
				} catch (err) {
					// Log insert errors but continue - some inserts might fail due to constraints
					const errorMsg = err instanceof Error ? err.message : String(err);
					console.warn(`Insert statement failed: ${errorMsg.substring(0, 100)}`);
				}
			}
		}
		
		// Finally execute other statements
		for (const statement of others) {
			if (statement.trim()) {
				const pgSql = convertSqliteToPostgres(statement);
				try {
					if (pgSql.trim().toUpperCase().startsWith('SELECT')) {
						await db.query(pgSql);
					} else {
						await db.exec(pgSql);
					}
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					// Skip "already exists" errors for other statements too
					if (errorMsg.includes('already exists')) {
						continue;
					}
					throw err; // Re-throw other errors
				}
			}
		}
		
		return { ok: true };
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		return { ok: false, error: error.message };
	}
}

/**
 * Export database as SQL
 * Includes sequences and proper CREATE TABLE statements
 */
export async function exportDbAsSql(db: Database): Promise<string> {
	const statements: string[] = [];
	const tables = await listTables(db);

	// First, export sequences (they need to be created before tables that use them)
	try {
		const sequencesResult = await db.query(`
			SELECT 
				sequence_name
			FROM information_schema.sequences
			WHERE sequence_schema = 'public'
			ORDER BY sequence_name
		`);
		
		if (sequencesResult.rows && sequencesResult.rows.length > 0) {
			for (const seqRow of sequencesResult.rows) {
				const seqName = (seqRow as Record<string, unknown>).sequence_name;
				if (seqName && typeof seqName === 'string') {
					try {
						// Get sequence current value
						const seqValueResult = await db.query(`SELECT last_value FROM ${seqName}`);
						if (seqValueResult.rows && seqValueResult.rows.length > 0) {
							const lastValue = (seqValueResult.rows[0] as Record<string, unknown>).last_value;
							const startValue = Math.max(1, Number(lastValue) || 1);
							statements.push(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START ${startValue} INCREMENT 1;`);
						} else {
							statements.push(`CREATE SEQUENCE IF NOT EXISTS ${seqName};`);
						}
					} catch {
						// If we can't get sequence details, just create it
						statements.push(`CREATE SEQUENCE IF NOT EXISTS ${seqName};`);
					}
				}
			}
		}
	} catch {
		// Sequences might not exist, continue
	}

	// Export tables
	for (const table of tables) {
		try {
			// Build CREATE TABLE manually with proper column definitions
			const columnsResult = await db.query(`
				SELECT 
					column_name,
					data_type,
					character_maximum_length,
					numeric_precision,
					numeric_scale,
					is_nullable,
					column_default,
					udt_name
				FROM information_schema.columns
				WHERE table_name = $1 AND table_schema = 'public'
				ORDER BY ordinal_position
			`, [table]);
			
			if (columnsResult.rows && columnsResult.rows.length > 0) {
				const columns: string[] = [];
				for (const colRow of columnsResult.rows) {
					const col = colRow as Record<string, unknown>;
					const colName = String(col.column_name);
					let colType = String(col.data_type);
					
					// Use udt_name if available (for custom types)
					if (col.udt_name && String(col.udt_name) !== colType) {
						colType = String(col.udt_name);
					}
					
					// Handle length for VARCHAR/CHAR
					if (col.character_maximum_length) {
						colType = `${colType}(${col.character_maximum_length})`;
					}
					
					// Handle numeric precision - only for numeric/decimal types, NOT for integer types
					// Integer types (int2, int4, int8, smallint, integer, bigint) should NOT have precision modifiers
					const integerTypes = ['int2', 'int4', 'int8', 'smallint', 'integer', 'bigint'];
					const isIntegerType = integerTypes.includes(colType.toLowerCase());
					
					if (col.numeric_precision && !isIntegerType) {
						// Only add precision/scale for numeric/decimal types
						if (col.numeric_scale) {
							colType = `${colType}(${col.numeric_precision},${col.numeric_scale})`;
						} else {
							colType = `${colType}(${col.numeric_precision})`;
						}
					}
					
					let colDef = `${colName} ${colType}`;
					
					if (col.is_nullable === 'NO') {
						colDef += ' NOT NULL';
					}
					
					if (col.column_default) {
						const defaultValue = String(col.column_default);
						// Keep sequence references as-is (they'll be created first)
						colDef += ` DEFAULT ${defaultValue}`;
					}
					
					columns.push(colDef);
				}
				
				statements.push(`CREATE TABLE ${table} (${columns.join(', ')});`);
			}

			// Get INSERT statements
			const data = await db.query(`SELECT * FROM ${table}`);
			if (data.rows && data.rows.length > 0) {
				const columns = data.fields?.map((f: { name: string }) => f.name) || [];
				for (const row of data.rows) {
					const values = columns.map((col: string) => {
						const val = (row as Record<string, unknown>)[col];
						if (val === null) return 'NULL';
						if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
						if (val instanceof Date) return `'${val.toISOString().split('T')[0]}'`;
						return String(val);
					});
					statements.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
				}
			}
		} catch (err) {
			// Log error but continue with other tables
			console.warn(`Failed to export table ${table}:`, err);
		}
	}

	return statements.join('\n\n');
}

/**
 * Convert SQLite syntax to PostgreSQL syntax
 * This helps with migration from SQLite to PostgreSQL
 */
function convertSqliteToPostgres(sql: string): string {
	let pgSql = sql;
	
	// Convert AUTOINCREMENT to SERIAL or AUTO_INCREMENT
	pgSql = pgSql.replace(/\bAUTOINCREMENT\b/gi, 'SERIAL');
	
	// Convert INTEGER PRIMARY KEY AUTOINCREMENT to SERIAL PRIMARY KEY
	pgSql = pgSql.replace(/\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi, 'SERIAL PRIMARY KEY');
	
	// Convert TEXT to VARCHAR (or keep TEXT, both work in PostgreSQL)
	// We'll keep TEXT as is since PostgreSQL supports it, but AI will generate VARCHAR
	
	// Convert SQLite's datetime('now') to PostgreSQL's NOW()
	pgSql = pgSql.replace(/\bdatetime\(['"]now['"]\)/gi, 'NOW()');
	pgSql = pgSql.replace(/\bdate\(['"]now['"]\)/gi, 'CURRENT_DATE');
	
	// Convert SQLite's strftime to PostgreSQL's TO_CHAR or similar
	// This is more complex, so we'll handle common cases
	
	// Remove SQLite-specific PRAGMA statements (they'll be ignored anyway)
	pgSql = pgSql.replace(/PRAGMA\s+\w+[^;]*;?/gi, '');
	
	// Fix invalid type modifiers for integer types (e.g., int4(32) -> int4)
	// PostgreSQL doesn't allow type modifiers for integer types
	pgSql = pgSql.replace(/\b(int2|int4|int8|smallint|integer|bigint)\(\d+\)/gi, '$1');
	
	return pgSql;
}

// Legacy function for compatibility - no longer needed with PGlite
export async function loadSql(): Promise<void> {
	// PGlite doesn't need a separate load step
	return Promise.resolve();
}
