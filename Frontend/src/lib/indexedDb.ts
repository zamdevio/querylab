/**
 * IndexedDB helper for persisting SQLite database blobs
 */

import { get, set, del, clear } from 'idb-keyval';

const DB_STORAGE_KEY = 'querylab-db';
const DB_METADATA_KEY = 'querylab-db-metadata';

export interface DbMetadata {
	name: string;
	createdAt: number;
	updatedAt: number;
	key: string;
}

/**
 * Save database blob to IndexedDB
 */
export async function saveDb(key: string, dbBlob: Uint8Array, metadata?: Partial<DbMetadata>): Promise<void> {
	await set(`${DB_STORAGE_KEY}-${key}`, dbBlob);
	
	if (metadata) {
		const fullMetadata: DbMetadata = {
			name: metadata.name || `Database ${key}`,
			createdAt: metadata.createdAt || Date.now(),
			updatedAt: Date.now(),
			key: key,
		};
		await set(`${DB_METADATA_KEY}-${key}`, fullMetadata);
	}
}

/**
 * Set database metadata
 */
export async function setDbMetadata(key: string, metadata: Partial<DbMetadata>): Promise<void> {
	const fullMetadata: DbMetadata = {
		name: metadata.name || `Database ${key}`,
		createdAt: metadata.createdAt || Date.now(),
		updatedAt: Date.now(),
		key: key,
	};
	await set(`${DB_METADATA_KEY}-${key}`, fullMetadata);
}

/**
 * Load database blob from IndexedDB
 */
export async function loadDb(key: string): Promise<Uint8Array | null> {
	return (await get<Uint8Array>(`${DB_STORAGE_KEY}-${key}`)) || null;
}

/**
 * Get database metadata
 */
export async function getDbMetadata(key: string): Promise<DbMetadata | null> {
	return (await get<DbMetadata>(`${DB_METADATA_KEY}-${key}`)) || null;
}

/**
 * Delete database from IndexedDB
 */
export async function deleteDb(key: string): Promise<void> {
	await del(`${DB_STORAGE_KEY}-${key}`);
	await del(`${DB_METADATA_KEY}-${key}`);
	await removeDbFromList(key);
}

/**
 * List all database keys
 */
export async function listDbs(): Promise<string[]> {
	// Maintain a separate list since idb-keyval doesn't support listing
	const listKey = await get<string[]>(`${DB_STORAGE_KEY}-list`);
	return listKey || [];
}

/**
 * List all databases with metadata
 */
export async function listDbsWithMetadata(): Promise<Array<DbMetadata & { key: string }>> {
	const keys = await listDbs();
	const databases: Array<DbMetadata & { key: string }> = [];
	
	for (const key of keys) {
		const metadata = await getDbMetadata(key);
		if (metadata) {
			databases.push({ ...metadata, key });
		} else {
			// Create default metadata if missing
			databases.push({
				key,
				name: `Database ${key}`,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}
	}
	
	return databases.sort((a, b) => b.updatedAt - a.updatedAt); // Most recent first
}

/**
 * Add database key to list
 */
export async function addDbToList(key: string): Promise<void> {
	const list = await listDbs();
	if (!list.includes(key)) {
		list.push(key);
		await set(`${DB_STORAGE_KEY}-list`, list);
	}
}

/**
 * Remove database key from list
 */
export async function removeDbFromList(key: string): Promise<void> {
	const list = await listDbs();
	const filtered = list.filter((k) => k !== key);
	await set(`${DB_STORAGE_KEY}-list`, filtered);
}

/**
 * Clear all databases
 */
export async function clearAllDbs(): Promise<void> {
	await clear();
}

