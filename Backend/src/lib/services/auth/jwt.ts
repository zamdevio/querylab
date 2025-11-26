/**
 * JWT Service for token generation and validation
 * Uses Web Crypto API (available in Cloudflare Workers)
 */

export interface JWTPayload {
	email: string;
	name: string;
	jti: string; // JWT ID - unique identifier for this toke
	iat: number; // Issued at
	exp: number; // Expiration
	iss?: string; // Issuer
}

export interface JWTConfig {
	secret: string; // Secret key for signing JWTs
	issuer?: string; // JWT issuer
	expirationDays?: number; // Token expiration in days (default: 7)
}

/**
 * JWT Service class
 */
export class JWTService {
	private secret: string;
	private issuer: string;
	private expirationDays: number;

	constructor(config: JWTConfig) {
		this.secret = config.secret;
		this.issuer = config.issuer || 'querylab';
		this.expirationDays = config.expirationDays || 7;
	}

	/**
	 * Generate a random JWT ID (jti)
	 */
	private generateJTI(): string {
		const randomBytes = new Uint8Array(16);
		crypto.getRandomValues(randomBytes);
		return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Base64 URL encode (JWT-safe base64)
	 */
	private base64UrlEncode(data: string): string {
		return btoa(data)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * Base64 URL decode
	 */
	private base64UrlDecode(data: string): string {
		// Add padding if needed
		const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
		return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
	}

	/**
	 * Create HMAC signature
	 */
	private async createSignature(header: string, payload: string): Promise<string> {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(this.secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign'],
		);

		const data = encoder.encode(`${header}.${payload}`);
		const signature = await crypto.subtle.sign('HMAC', key, data);
		const signatureArray = new Uint8Array(signature);
		return this.base64UrlEncode(String.fromCharCode(...signatureArray));
	}

	/**
	 * Verify HMAC signature
	 */
	private async verifySignature(header: string, payload: string, signature: string): Promise<boolean> {
		const expectedSignature = await this.createSignature(header, payload);
		return expectedSignature === signature;
	}

	/**
	 * Generate JWT token
	 * @param email - User email
	 * @param name - User name (defaults to "Student")
	 * @returns JWT token string
	 */
	async generateToken(email: string, name: string = 'Student'): Promise<{ token: string; jti: string }> {
		const jti = this.generateJTI();
		const now = Math.floor(Date.now() / 1000);
		const exp = now + this.expirationDays * 24 * 60 * 60; // Expiration in seconds

		const payload: JWTPayload = {
			email,
			name,
			jti,
			iat: now,
			exp,
			iss: this.issuer, // Add issuer claim
		};

		const header = {
			alg: 'HS256',
			typ: 'JWT',
		};

		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

		const signature = await this.createSignature(encodedHeader, encodedPayload);
		const token = `${encodedHeader}.${encodedPayload}.${signature}`;

		return { token, jti };
	}

	/**
	 * Verify and decode JWT token
	 * @param token - JWT token string
	 * @returns Decoded payload if valid, null otherwise
	 */
	async verifyToken(token: string): Promise<JWTPayload | null> {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				return null;
			}

			const [header, payload, signature] = parts;

			// Verify signature
			const isValid = await this.verifySignature(header, payload, signature);
			if (!isValid) {
				return null;
			}

			// Decode payload
			const decodedPayload = JSON.parse(this.base64UrlDecode(payload)) as JWTPayload;

			// Check expiration
			const now = Math.floor(Date.now() / 1000);
			if (decodedPayload.exp && decodedPayload.exp < now) {
				return null; // Token expired
			}

			// Verify issuer (if present in token)
			if (decodedPayload.iss && decodedPayload.iss !== this.issuer) {
				return null; // Invalid issuer
			}

			return decodedPayload;
		} catch (error) {
			console.error('[JWT] Token verification error:', error);
			return null;
		}
	}

	/**
	 * Extract jti from token without full verification (for quick lookup)
	 * Note: This doesn't verify signature, use verifyToken for full validation
	 */
	extractJTI(token: string): string | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				return null;
			}

			const payload = JSON.parse(this.base64UrlDecode(parts[1])) as JWTPayload;
			return payload.jti || null;
		} catch {
			return null;
		}
	}
}

/**
 * Create a JWT service instance
 * @param config - JWT configuration
 * @returns JWT service instance
 */
export function createJWTService(config: JWTConfig): JWTService {
	return new JWTService(config);
}

