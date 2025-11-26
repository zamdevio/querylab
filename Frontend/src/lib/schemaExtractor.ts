/**
 * Extract database schema for AI
 */

import type { Database } from './sqlClient';
import { listTables } from './sqlClient';

export interface DatabaseSchema {
	tables: Array<{
		name: string;
		columns: Array<{
			name: string;
			type: string;
			notNull?: boolean;
			pk?: boolean;
		}>;
	}>;
}

/**
 * Extract full schema from database using PostgreSQL information_schema
 */
export async function extractSchema(db: Database): Promise<DatabaseSchema> {
	const tableNames = await listTables(db);
	const tables: DatabaseSchema['tables'] = [];

		for (const tableName of tableNames) {
		try {
			// Use parameterized query with proper escaping for table name
			const result = await db.query(`
				SELECT 
					c.column_name as name,
					c.data_type as type,
					(c.is_nullable = 'NO') as notnull,
					CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as pk
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
			
			if (result.rows && result.rows.length > 0) {
				const columns = result.rows.map((row: unknown) => {
					if (typeof row === 'object' && row !== null) {
						const r = row as Record<string, unknown>;
						return {
							name: String(r.name),
							type: String(r.type),
							notNull: Boolean(r.notnull),
							pk: Boolean(r.pk),
						};
					}
					return {
						name: '',
						type: '',
						notNull: false,
						pk: false,
					};
				});

				tables.push({
					name: tableName,
					columns,
				});
			}
		} catch {
			// Silent fail for individual table schema extraction errors
		}
	}

	return { tables };
}
