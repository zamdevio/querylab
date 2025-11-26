/**
 * Login service
 * Handles authentication with email verification
 */

import { createStorageClient, StorageHelpers } from '../do/storageClient';
import { createJWTService } from './jwt';
import type { LoginCredentials, PendingVerification } from './types';

/**
 * Allowed email domain
 */
const ALLOWED_DOMAIN = '@ucsiuniversity.edu.my';

/**
 * Generate random verification code (6 digits)
 */
function generateVerificationCode(): string {
	// Generate 6-digit code
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// JWT service will be initialized in constructor

/**
 * Login service class
 */
export class LoginService {
	private helpers: StorageHelpers;
	private jwtService: ReturnType<typeof createJWTService>;

	constructor(storageNamespace: DurableObjectNamespace, jwtSecret: string) {
		const client = createStorageClient(storageNamespace);
		this.helpers = new StorageHelpers(client);
		this.jwtService = createJWTService({ secret: jwtSecret, expirationDays: 7 });
	}

	/**
	 * Validate email domain
	 * @param email - Email address to validate
	 * @returns true if email is from allowed domain
	 */
	validateEmailDomain(email: string): boolean {
		return email.endsWith(ALLOWED_DOMAIN);
	}

	/**
	 * Initiate login - creates pending verification and sends OTP
	 * No account creation needed - just validates email domain and generates OTP
	 * @param credentials - Login credentials (email and optional name)
	 * @returns Result with verification code if successful
	 */
	async initiateLogin(credentials: LoginCredentials): Promise<{
		success: boolean;
		code?: string;
		jti?: string;
		error?: string;
	}> {
		// Validate email domain - must end with @ucsiuniversity.edu.my
		if (!this.validateEmailDomain(credentials.email)) {
			return {
				success: false,
				error: `Only ${ALLOWED_DOMAIN} email addresses are allowed`,
			};
		}

		// No account creation needed - just send OTP if email domain matches

		// Use provided name or default to "Student"
		const name = credentials.name || 'Student';

		// Generate JWT token
		const { token, jti } = await this.jwtService.generateToken(credentials.email, name);

		// Remove old jti if exists (only one session per user)
		const oldAuth = await this.helpers.getSession(`auth:${credentials.email}`, 'auth') as PendingVerification | null;
		if (oldAuth && oldAuth.jti) {
			// Delete old jti from storage
			await this.helpers.deleteSession(`jti:${oldAuth.jti}`, 'auth');
		}
		await this.helpers.deleteSession(`auth:${credentials.email}`, 'auth');

		// Generate verification code (6 digits)
		const verificationCode = generateVerificationCode();

		// Create pending verification
		const verification: PendingVerification = {
			email: credentials.email,
			token, // Store JWT token
			jti, // Store JWT ID
			pending: true,
			code: verificationCode,
			createdAt: Date.now(),
			attempts: 0, // Initialize attempts counter
		};

		// Store verification with 24 hour TTL
		const stored = await this.helpers.setSession(
			`auth:${credentials.email}`,
			verification,
			24 * 60 * 60 * 1000, // 24 hours
			'auth',
		);

		// Store jti mapping for quick lookup
		await this.helpers.setSession(
			`jti:${jti}`,
			{ email: credentials.email, pending: true },
			24 * 60 * 60 * 1000, // 24 hours
			'auth',
		);

		if (!stored) {
			return {
				success: false,
				error: 'Failed to create verification',
			};
		}

		return {
			success: true,
			code: verificationCode,
			jti: jti, // Return jti to set in cookie
		};
	}

	/**
	 * Verify login with verification code and jti
	 * @param code - 6-digit verification code from email
	 * @param jti - JWT ID from cookie
	 * @returns Result with token if successful
	 */
	async verifyLogin(code: string, jti: string): Promise<{
		success: boolean;
		token?: string;
		email?: string;
		error?: string;
		code?: string; // Error code for frontend handling
		remainingAttempts?: number;
	}> {
		const MAX_ATTEMPTS = 6;

		// Get verification data by jti
		const jtiData = await this.helpers.getSession(`jti:${jti}`, 'auth') as { email?: string; pending?: boolean } | null;
		if (!jtiData || !jtiData.email) {
			return {
				success: false,
				error: 'Invalid or expired session. Please request a new verification code.',
				code: 'SESSION_NOT_FOUND',
			};
		}

		const email = jtiData.email;
		
		// Get verification data
		const verification = await this.helpers.getSession(`auth:${email}`, 'auth') as PendingVerification | null;
		
		// Check if session exists
		if (!verification) {
			return {
				success: false,
				error: 'Session not found. Please request a new verification code.',
				code: 'SESSION_NOT_FOUND',
			};
		}

		// Verify jti matches
		if (verification.jti !== jti) {
			return {
				success: false,
				error: 'Session mismatch. Please request a new verification code.',
				code: 'SESSION_NOT_FOUND',
			};
		}

		// Check if session is still pending
		if (!verification.pending) {
			// Session already verified
			return {
				success: false,
				error: 'This verification code has already been used.',
				code: 'SESSION_ALREADY_VERIFIED',
			};
		}

		// Check if code matches
		if (verification.code !== code) {
			// Increment attempts
			const newAttempts = (verification.attempts || 0) + 1;
			
			if (newAttempts >= MAX_ATTEMPTS) {
				// Max attempts reached - delete session
				await this.helpers.deleteSession(`auth:${email}`, 'auth');
				if (verification.jti) {
					await this.helpers.deleteSession(`jti:${verification.jti}`, 'auth');
				}
				
				return {
					success: false,
					error: 'Maximum verification attempts exceeded. Please request a new verification code.',
					code: 'SESSION_NOT_FOUND',
				};
			}

			// Update attempts counter
			verification.attempts = newAttempts;
			await this.helpers.setSession(
				`auth:${email}`,
				verification,
				24 * 60 * 60 * 1000, // Keep 24 hour TTL
				'auth',
			);

			return {
				success: false,
				error: `Invalid verification code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
				code: 'INVALID_CODE',
				remainingAttempts: MAX_ATTEMPTS - newAttempts,
			};
		}

		// Code is correct - mark as verified
		verification.pending = false as any; // Type hack to remove pending
		const updated = await this.helpers.setSession(
			`auth:${email}`,
			verification,
			7 * 24 * 60 * 60 * 1000, // 7 days for verified session
			'auth',
		);

		// Update jti mapping to mark as verified
		if (verification.jti) {
			await this.helpers.setSession(
				`jti:${verification.jti}`,
				{ email, pending: false },
				7 * 24 * 60 * 60 * 1000, // 7 days
				'auth',
			);
		}

		if (!updated) {
			return {
				success: false,
				error: 'Failed to verify login',
				code: 'VERIFICATION_FAILED',
			};
		}

		return {
			success: true,
			token: verification.token, // Return JWT token
			email: verification.email,
		};
	}
}

/**
 * Create a login service instance
 * @param storageNamespace - Durable Object namespace for storage
 * @param jwtSecret - Secret key for JWT signing
 * @returns Login service instance
 */
export function createLoginService(storageNamespace: DurableObjectNamespace, jwtSecret: string): LoginService {
	return new LoginService(storageNamespace, jwtSecret);
}

