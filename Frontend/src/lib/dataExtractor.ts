/**
 * Extract table data for AI context
 */

import type { Database } from './sqlClient';
import { listTables, runQuery } from './sqlClient';

export interface TableData {
	[tableName: string]: Array<Record<string, unknown>>;
}

/**
 * Extract data from tables for AI context
 * @param db - Database instance
 * @param maxRows - Maximum rows per table (default: 1000)
 * @param tableNames - Optional: specific tables to extract (if not provided, extracts all)
 * @returns Object mapping table names to their data
 */
export async function extractTableData(
	db: Database,
	maxRows: number = 1000,
	tableNames?: string[],
): Promise<TableData> {
	const tables = tableNames || await listTables(db);
	const tableData: TableData = {};

	for (const tableName of tables) {
		try {
			// Get row count first
			const countResult = await runQuery(db, `SELECT COUNT(*) as count FROM ${tableName}`);
			
			if (countResult.ok && countResult.results.length > 0) {
				const firstResult = countResult.results[0] as { columns: string[]; values: unknown[][] };
				if (firstResult && firstResult.values && firstResult.values.length > 0) {
					const count = Number(firstResult.values[0][0]) || 0;
					
					// Only extract if table has data and within limit
					if (count > 0 && count <= maxRows) {
						const query = `SELECT * FROM ${tableName} LIMIT ${maxRows}`;
						const result = await runQuery(db, query);
						
						if (result.ok && result.results.length > 0) {
							const queryResult = result.results[0] as { columns: string[]; values: unknown[][] };
							if (queryResult && queryResult.columns && queryResult.values) {
								// Convert to array of objects
								tableData[tableName] = queryResult.values.map((row) => {
									const obj: Record<string, unknown> = {};
									queryResult.columns.forEach((col, idx) => {
										obj[col] = row[idx];
									});
									return obj;
								});
							}
						}
					}
				}
			}
		} catch {
			// Silent fail for individual table extraction errors
		}
	}

	return tableData;
}
