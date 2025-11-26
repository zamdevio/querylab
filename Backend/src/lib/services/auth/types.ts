/**
 * Authentication types
 */

/**
 * User session data
 */
export interface UserSession {
	userId: string;
	email: string;
	university?: string;
	createdAt: number;
	expiresAt: number;
	[key: string]: unknown;
}

/**
 * Pending verification data stored in DO
 */
export interface PendingVerification {
	email: string;
	token: string; // JWT token
	jti: string; // JWT ID
	pending: boolean;
	code: string; // 6-digit verification code
	createdAt: number;
	attempts: number; // Number of failed verification attempts (max 6)
}

/**
 * Login credentials
 */
export interface LoginCredentials {
	email: string;
	name?: string; // Optional name, defaults to "Student"
}

/**
 * Auth result
 */
export interface AuthResult {
	success: boolean;
	sessionId?: string;
	session?: UserSession;
	error?: string;
}

/**
 * Auth context from validated token
 */
export interface AuthContext {
	userId: string;
	email: string;
	name?: string;
	token: string;
}
