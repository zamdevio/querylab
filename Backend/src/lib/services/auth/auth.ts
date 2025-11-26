/**
 * Shared authentication functions for AI endpoints
 * Provides centralized auth validation
 */

import { createStorageClient, StorageHelpers } from '../do/storageClient';
import { createJWTService } from './jwt';
import type { AuthContext, PendingVerification } from './types';

/**
 * Auth service for validating tokens and getting user context
 */
export class AuthService {
	private helpers: StorageHelpers;
	private jwtService: ReturnType<typeof createJWTService>;

	constructor(storageNamespace: DurableObjectNamespace, jwtSecret: string) {
		const client = createStorageClient(storageNamespace);
		this.helpers = new StorageHelpers(client);
		this.jwtService = createJWTService({ secret: jwtSecret, expirationDays: 7 });
	}

	/**
	 * Validate JWT token and get user context
	 * @param token - JWT token from cookie
	 * @returns Auth context if valid, null otherwise
	 */
	async validateToken(token: string): Promise<AuthContext | null> {
		if (!token || typeof token !== 'string') {
			return null;
		}

		try {
			// Verify JWT token
			const payload = await this.jwtService.verifyToken(token);
			if (!payload) {
				return null; // Invalid or expired token
			}

			// Check jti in storage (ensures token is still valid and not revoked)
			const jtiData = await this.helpers.getSession(`jti:${payload.jti}`, 'auth');
			if (!jtiData) {
				return null; // jti not found (token revoked or expired)
			}

			const jtiInfo = jtiData as { email: string; pending: boolean };
			
			// Check if verification is still pending (not verified)
			if (jtiInfo.pending) {
				return null; // Token not verified yet
			}

			// Verify email matches
			if (jtiInfo.email !== payload.email) {
				return null; // Email mismatch
			}

			// Return auth context
			return {
				userId: payload.email, // Use email as userId
				email: payload.email,
				name: payload.name,
				token,
			};
		} catch (error) {
			console.error('[AUTH] Token validation error:', error);
			return null;
		}
	}

	/**
	 * Get user from request (extracts token from cookie)
	 * @param request - Request object
	 * @returns Auth context if valid, null otherwise
	 */
	async getUserFromRequest(request: Request): Promise<AuthContext | null> {
		// Extract token from cookie
		const cookieHeader = request.headers.get('Cookie');
		if (!cookieHeader) {
			return null;
		}

		const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split('=');
			if (key && value) {
				acc[key] = decodeURIComponent(value);
			}
			return acc;
		}, {} as Record<string, string>);

		const token = cookies['_auth.t'];
		if (!token) {
			return null;
		}

		return await this.validateToken(token);
	}

	/**
	 * Get user ID from request (for rate limiting)
	 * @param request - Request object
	 * @returns User ID (email) or 'anonymous' if not authenticated
	 */
	async getUserId(request: Request): Promise<string> {
		const user = await this.getUserFromRequest(request);
		return user?.email || 'anonymous';
	}

	/**
	 * Logout user by deleting session
	 * @param token - JWT token to invalidate
	 * @returns true if logout successful
	 */
	async logout(token: string): Promise<boolean> {
		try {
			// Verify token to get jti
			const payload = await this.jwtService.verifyToken(token);
			if (!payload) {
				return false; // Invalid token
			}

			// Delete jti from storage (invalidates the session)
			// The storage uses 'session:jti:...' format
			await this.helpers.deleteSession(`jti:${payload.jti}`, 'auth');

			// Also delete auth entry by email if it exists
			await this.helpers.deleteSession(`auth:${payload.email}`, 'auth');

			return true;
		} catch (error) {
			console.error('[AUTH] Logout error:', error);
			return false;
		}
	}
}

/**
 * Create an auth service instance
 * @param storageNamespace - Durable Object namespace for storage
 * @param jwtSecret - Secret key for JWT signing
 * @returns Auth service instance
 */
export function createAuthService(storageNamespace: DurableObjectNamespace, jwtSecret: string): AuthService {
	return new AuthService(storageNamespace, jwtSecret);
}

/**
 * Shared auth middleware for Hono
 * Validates token and adds user to context
 */
export function createAuthMiddleware(storageNamespace: DurableObjectNamespace, jwtSecret: string) {
	const authService = createAuthService(storageNamespace, jwtSecret);

	return async (c: any, next: () => Promise<void>) => {
		const user = await authService.getUserFromRequest(c.req.raw);
		
		if (!user) {
			return c.json(
				{
					success: false,
					data: null,
					error: {
						message: 'Authentication required',
						code: 'UNAUTHORIZED',
					},
				},
				401,
			);
		}

		// Add user to context
		c.set('user', user);
		await next();
	};
}

