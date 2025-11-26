/**
 * Client wrapper for Storage Durable Object
 * Provides easy-to-use functions for accessing storage from workers
 */

import type { StorageResult, StorageValue } from './storage';

/**
 * Storage client interface
 */
export interface StorageClient {
	get<T = unknown>(key: string): Promise<StorageResult<T>>;
	set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<StorageResult<void>>;
	delete(key: string): Promise<StorageResult<void>>;
	has(key: string): Promise<boolean>;
	getMany<T = unknown>(keys: string[]): Promise<Map<string, T>>;
	setMany<T = unknown>(
		entries: Map<string, T>,
		ttlMs?: number,
	): Promise<StorageResult<void>>;
	deleteMany(keys: string[]): Promise<StorageResult<void>>;
	listKeys(prefix?: string): Promise<string[]>;
	clear(): Promise<StorageResult<void>>;
}

/**
 * Storage client implementation using Durable Objects
 */
export class DurableObjectStorageClient implements StorageClient {
	private doNamespace: DurableObjectNamespace;

	constructor(doNamespace: DurableObjectNamespace) {
		this.doNamespace = doNamespace;
	}

	/**
	 * Get a Durable Object instance for a namespace
	 * Uses consistent hashing based on namespace to ensure same namespace hits same DO
	 */
	private getId(namespace: string): DurableObjectId {
		return this.doNamespace.idFromName(namespace);
	}

	/**
	 * Get a Durable Object stub for a namespace
	 */
	private getStub(namespace: string): DurableObjectStub {
		const id = this.getId(namespace);
		return this.doNamespace.get(id);
	}

	async get<T = unknown>(key: string, namespace = 'default'): Promise<StorageResult<T>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch(`http://do/storage/${encodeURIComponent(key)}`, {
			method: 'GET',
		});

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		return await response.json<StorageResult<T>>();
	}

	async set<T = unknown>(
		key: string,
		value: T,
		ttlMs?: number,
		namespace = 'default',
	): Promise<StorageResult<void>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch(`http://do/storage/${encodeURIComponent(key)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ value, ttlMs }),
		});

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		return await response.json<StorageResult<void>>();
	}

	async delete(key: string, namespace = 'default'): Promise<StorageResult<void>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch(`http://do/storage/${encodeURIComponent(key)}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		return await response.json<StorageResult<void>>();
	}

	async has(key: string, namespace = 'default'): Promise<boolean> {
		const result = await this.get(key, namespace);
		return result.success;
	}

	async getMany<T = unknown>(
		keys: string[],
		namespace = 'default',
	): Promise<Map<string, T>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch('http://do/storage/batch/get', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});

		if (!response.ok) {
			return new Map();
		}

		const result = await response.json<{ success: boolean; data: Record<string, T> }>();
		if (!result.success || !result.data) {
			return new Map();
		}

		return new Map(Object.entries(result.data));
	}

	async setMany<T = unknown>(
		entries: Map<string, T>,
		ttlMs?: number,
		namespace = 'default',
	): Promise<StorageResult<void>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch('http://do/storage/batch/set', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				entries: Object.fromEntries(entries),
				ttlMs,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		return await response.json<StorageResult<void>>();
	}

	async deleteMany(keys: string[], namespace = 'default'): Promise<StorageResult<void>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch('http://do/storage/batch/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		return await response.json<StorageResult<void>>();
	}

	async listKeys(prefix?: string, namespace = 'default'): Promise<string[]> {
		const stub = this.getStub(namespace);
		const url = new URL('http://do/storage/list');
		if (prefix) {
			url.searchParams.set('prefix', prefix);
		}

		const response = await stub.fetch(url.toString(), {
			method: 'GET',
		});

		if (!response.ok) {
			return [];
		}

		const result = await response.json<{ success: boolean; data: string[] }>();
		return result.success && result.data ? result.data : [];
	}

	async clear(namespace = 'default'): Promise<StorageResult<void>> {
		const stub = this.getStub(namespace);
		const response = await stub.fetch('http://do/storage/clear', {
			method: 'POST',
		});

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		return await response.json<StorageResult<void>>();
	}
}

/**
 * Create a storage client instance
 * @param doNamespace - Durable Object namespace for storage
 * @returns Storage client instance
 */
export function createStorageClient(doNamespace: DurableObjectNamespace): StorageClient {
	return new DurableObjectStorageClient(doNamespace);
}

/**
 * Helper functions for common storage operations
 */
export class StorageHelpers {
	constructor(private client: StorageClient) {}

	/**
	 * Rate limiting helpers
	 */
	async getRateLimit(userId: string): Promise<{
		tokens: number;
		lastRefill: number;
	} | null> {
		const result = await this.client.get<{ tokens: number; lastRefill: number }>(
			`rate_limit:${userId}`,
			'rate_limiting',
		);
		return result.success && result.data ? result.data : null;
	}

	async setRateLimit(
		userId: string,
		tokens: number,
		lastRefill: number,
	): Promise<boolean> {
		const result = await this.client.set(
			`rate_limit:${userId}`,
			{ tokens, lastRefill },
			undefined, // No TTL, managed manually
			'rate_limiting',
		);
		return result.success;
	}

	/**
	 * Session helpers (for future auth)
	 */
	async getSession(sessionId: string, namespace = 'sessions'): Promise<unknown | null> {
		const result = await this.client.get(`session:${sessionId}`, namespace);
		return result.success && result.data ? result.data : null;
	}

	async setSession(sessionId: string, data: unknown, ttlMs: number, namespace = 'sessions'): Promise<boolean> {
		const result = await this.client.set(`session:${sessionId}`, data, ttlMs, namespace);
		return result.success;
	}

	async deleteSession(sessionId: string, namespace = 'sessions'): Promise<boolean> {
		const result = await this.client.delete(`session:${sessionId}`, namespace);
		return result.success;
	}
}

