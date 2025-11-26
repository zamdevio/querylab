/**
 * General-purpose Durable Object for key-value storage
 * Can be used for rate limiting, user sessions, and any stateful data
 * Ensures consistency across all worker instances
 */

/**
 * Storage value with optional TTL (time to live)
 */
export interface StorageValue<T = unknown> {
	value: T;
	expiresAt?: number; // Unix timestamp in milliseconds
}

/**
 * Storage operations result
 */
export interface StorageResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * General Storage Durable Object
 * Provides key-value storage with optional TTL support
 */
export class StorageDurableObject implements DurableObject {
	private state: DurableObjectState;
	private env: Env;

	// In-memory cache for faster access (backed by persistent storage)
	private cache: Map<string, StorageValue> = new Map();

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
	}

	/**
	 * Get value by key
	 * @param key - Storage key
	 * @returns Storage result with value or error
	 */
	async get<T = unknown>(key: string): Promise<StorageResult<T>> {
		try {
			// Check cache first
			const cached = this.cache.get(key);
			if (cached) {
				// Check if expired
				if (cached.expiresAt && cached.expiresAt < Date.now()) {
					await this.delete(key);
					return { success: false, error: 'Key expired' };
				}
				return { success: true, data: cached.value as T };
			}

			// Get from persistent storage
			const stored = await this.state.storage.get<StorageValue<T>>(key);
			if (!stored) {
				return { success: false, error: 'Key not found' };
			}

			// Check if expired
			if (stored.expiresAt && stored.expiresAt < Date.now()) {
				await this.delete(key);
				return { success: false, error: 'Key expired' };
			}

			// Cache it
			this.cache.set(key, stored);

			return { success: true, data: stored.value };
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return { success: false, error: error.message };
		}
	}

	/**
	 * Set value by key with optional TTL
	 * @param key - Storage key
	 * @param value - Value to store
	 * @param ttlMs - Optional time to live in milliseconds
	 * @returns Storage result
	 */
	async set<T = unknown>(
		key: string,
		value: T,
		ttlMs?: number,
	): Promise<StorageResult<void>> {
		try {
			const storageValue: StorageValue<T> = {
				value,
				...(ttlMs && { expiresAt: Date.now() + ttlMs }),
			};

			// Save to persistent storage
			await this.state.storage.put(key, storageValue);

			// Update cache
			this.cache.set(key, storageValue);

			return { success: true };
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return { success: false, error: error.message };
		}
	}

	/**
	 * Delete value by key
	 * @param key - Storage key
	 * @returns Storage result
	 */
	async delete(key: string): Promise<StorageResult<void>> {
		try {
			await this.state.storage.delete(key);
			this.cache.delete(key);
			return { success: true };
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return { success: false, error: error.message };
		}
	}

	/**
	 * Check if key exists and is not expired
	 * @param key - Storage key
	 * @returns true if key exists and is valid
	 */
	async has(key: string): Promise<boolean> {
		const result = await this.get(key);
		return result.success;
	}

	/**
	 * Get multiple keys at once
	 * @param keys - Array of keys
	 * @returns Map of key to value (only includes successful gets)
	 */
	async getMany<T = unknown>(keys: string[]): Promise<Map<string, T>> {
		const results = new Map<string, T>();

		await Promise.all(
			keys.map(async (key) => {
				const result = await this.get<T>(key);
				if (result.success && result.data !== undefined) {
					results.set(key, result.data);
				}
			}),
		);

		return results;
	}

	/**
	 * Set multiple key-value pairs at once
	 * @param entries - Map of key to value
	 * @param ttlMs - Optional TTL for all entries
	 * @returns Storage result
	 */
	async setMany<T = unknown>(
		entries: Map<string, T>,
		ttlMs?: number,
	): Promise<StorageResult<void>> {
		try {
			await Promise.all(
				Array.from(entries.entries()).map(([key, value]) =>
					this.set(key, value, ttlMs),
				),
			);
			return { success: true };
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return { success: false, error: error.message };
		}
	}

	/**
	 * Delete multiple keys at once
	 * @param keys - Array of keys to delete
	 * @returns Storage result
	 */
	async deleteMany(keys: string[]): Promise<StorageResult<void>> {
		try {
			await Promise.all(keys.map((key) => this.delete(key)));
			return { success: true };
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return { success: false, error: error.message };
		}
	}

	/**
	 * List all keys (with optional prefix filter)
	 * @param prefix - Optional prefix to filter keys
	 * @returns Array of keys
	 */
	async listKeys(prefix?: string): Promise<string[]> {
		try {
			const keys: string[] = [];
			const list = await this.state.storage.list({ prefix });
			for await (const key of list.keys()) {
				keys.push(key);
			}
			return keys;
		} catch (err) {
			console.error('Error listing keys:', err);
			return [];
		}
	}

	/**
	 * Clear all keys (use with caution!)
	 * @returns Storage result
	 */
	async clear(): Promise<StorageResult<void>> {
		try {
			const keys = await this.listKeys();
			await this.deleteMany(keys);
			this.cache.clear();
			return { success: true };
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return { success: false, error: error.message };
		}
	}

	/**
	 * Handle fetch requests for HTTP API access
	 */
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		try {
			// GET /storage/:key
			if (method === 'GET' && url.pathname.startsWith('/storage/')) {
				const key = decodeURIComponent(url.pathname.slice('/storage/'.length));
				const result = await this.get(key);
				return Response.json(result);
			}

			// POST /storage/:key
			if (method === 'POST' && url.pathname.startsWith('/storage/')) {
				const key = decodeURIComponent(url.pathname.slice('/storage/'.length));
				const body = await request.json<{ value: unknown; ttlMs?: number }>();
				const result = await this.set(key, body.value, body.ttlMs);
				return Response.json(result);
			}

			// DELETE /storage/:key
			if (method === 'DELETE' && url.pathname.startsWith('/storage/')) {
				const key = decodeURIComponent(url.pathname.slice('/storage/'.length));
				const result = await this.delete(key);
				return Response.json(result);
			}

			// POST /storage/batch/get
			if (method === 'POST' && url.pathname === '/storage/batch/get') {
				const body = await request.json<{ keys: string[] }>();
				const results = await this.getMany(body.keys);
				return Response.json({
					success: true,
					data: Object.fromEntries(results),
				});
			}

			// POST /storage/batch/set
			if (method === 'POST' && url.pathname === '/storage/batch/set') {
				const body = await request.json<{
					entries: Record<string, unknown>;
					ttlMs?: number;
				}>();
				const entries = new Map(Object.entries(body.entries));
				const result = await this.setMany(entries, body.ttlMs);
				return Response.json(result);
			}

			// POST /storage/batch/delete
			if (method === 'POST' && url.pathname === '/storage/batch/delete') {
				const body = await request.json<{ keys: string[] }>();
				const result = await this.deleteMany(body.keys);
				return Response.json(result);
			}

			// GET /storage/list?prefix=...
			if (method === 'GET' && url.pathname === '/storage/list') {
				const prefix = url.searchParams.get('prefix') || undefined;
				const keys = await this.listKeys(prefix);
				return Response.json({ success: true, data: keys });
			}

			// POST /storage/clear
			if (method === 'POST' && url.pathname === '/storage/clear') {
				const result = await this.clear();
				return Response.json(result);
			}

			return new Response('Not Found', { status: 404 });
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			return Response.json(
				{ success: false, error: error.message },
				{ status: 500 },
			);
		}
	}
}
