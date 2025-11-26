/**
 * Session management using general storage
 * Ready for future auth implementation
 */

import { createStorageClient, StorageHelpers } from '../do/storageClient';
import type { UserSession } from './types';

/**
 * Session manager
 */
export class SessionManager {
	private helpers: StorageHelpers;

	constructor(storageNamespace: DurableObjectNamespace) {
		const client = createStorageClient(storageNamespace);
		this.helpers = new StorageHelpers(client);
	}

	/**
	 * Create a new session
	 * @param sessionId - Unique session identifier
	 * @param sessionData - Session data to store
	 * @param ttlMs - Time to live in milliseconds (default: 7 days)
	 * @returns true if session was created successfully
	 */
	async createSession(
		sessionId: string,
		sessionData: UserSession,
		ttlMs = 7 * 24 * 60 * 60 * 1000, // 7 days default
	): Promise<boolean> {
		return await this.helpers.setSession(sessionId, sessionData, ttlMs);
	}

	/**
	 * Get session by ID
	 * @param sessionId - Session identifier
	 * @returns Session data or null if not found/expired
	 */
	async getSession(sessionId: string): Promise<UserSession | null> {
		const data = await this.helpers.getSession(sessionId);
		return data as UserSession | null;
	}

	/**
	 * Delete session
	 * @param sessionId - Session identifier
	 * @returns true if session was deleted
	 */
	async deleteSession(sessionId: string): Promise<boolean> {
		return await this.helpers.deleteSession(sessionId);
	}

	/**
	 * Refresh session expiration
	 * @param sessionId - Session identifier
	 * @param ttlMs - New time to live in milliseconds
	 * @returns true if session was refreshed
	 */
	async refreshSession(sessionId: string, ttlMs: number): Promise<boolean> {
		const session = await this.getSession(sessionId);
		if (!session) {
			return false;
		}

		// Update expiration
		session.expiresAt = Date.now() + ttlMs;
		return await this.helpers.setSession(sessionId, session, ttlMs);
	}

	/**
	 * Check if session is valid
	 * @param sessionId - Session identifier
	 * @returns true if session exists and is not expired
	 */
	async isValidSession(sessionId: string): Promise<boolean> {
		const session = await this.getSession(sessionId);
		if (!session) {
			return false;
		}

		// Check expiration
		if (session.expiresAt && session.expiresAt < Date.now()) {
			await this.deleteSession(sessionId);
			return false;
		}

		return true;
	}
}

/**
 * Create a session manager instance
 * @param storageNamespace - Durable Object namespace for storage
 * @returns Session manager instance
 */
export function createSessionManager(storageNamespace: DurableObjectNamespace): SessionManager {
	return new SessionManager(storageNamespace);
}

