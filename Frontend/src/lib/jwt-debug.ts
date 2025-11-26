/**
 * JWT Debugging Utilities
 * 
 * These utilities help decode and inspect JWTs on the client-side for debugging.
 * NOTE: These functions do NOT verify the JWT signature - they only decode the payload.
 * Never use these for security-critical operations.
 */

/**
 * Decode a JWT without verification (for debugging only)
 * Returns the header and payload as objects
 */
export function decodeJWT(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		// Decode header (base64url)
		const headerJson = base64UrlDecode(parts[0]);
		const header = JSON.parse(headerJson);

		// Decode payload (base64url)
		const payloadJson = base64UrlDecode(parts[1]);
		const payload = JSON.parse(payloadJson);

		return { header, payload };
	} catch (error) {
		console.error('[JWT Debug] Failed to decode JWT:', error);
		return null;
	}
}

/**
 * Decode base64url string to regular string
 */
function base64UrlDecode(str: string): string {
	// Convert base64url to base64
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	
	// Add padding if needed
	while (base64.length % 4) {
		base64 += '=';
	}
	
	// Decode
	try {
		return decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);
	} catch {
		// Fallback for older browsers
		return atob(base64);
	}
}

/**
 * Check if a JWT is expired
 */
export function isJWTExpired(token: string): boolean {
	const decoded = decodeJWT(token);
	if (!decoded) return true;
	
	const exp = decoded.payload.exp as number | undefined;
	if (!exp) return false; // No expiration claim
	
	return Date.now() >= exp * 1000;
}

/**
 * Get time until JWT expires (in seconds)
 */
export function getJWTTimeUntilExpiry(token: string): number | null {
	const decoded = decodeJWT(token);
	if (!decoded) return null;
	
	const exp = decoded.payload.exp as number | undefined;
	if (!exp) return null;
	
	const expiryMs = exp * 1000;
	const now = Date.now();
	return Math.max(0, Math.floor((expiryMs - now) / 1000));
}

/**
 * Format JWT claims for display
 */
export function formatJWTClaims(token: string): string {
	const decoded = decodeJWT(token);
	if (!decoded) return 'Failed to decode JWT';
	
	const { header, payload } = decoded;
	
	const lines: string[] = [];
	lines.push('=== JWT Header ===');
	lines.push(JSON.stringify(header, null, 2));
	lines.push('');
	lines.push('=== JWT Payload ===');
	
	// Format common claims
	if (payload.iss) lines.push(`Issuer (iss): ${payload.iss}`);
	if (payload.sub) lines.push(`Subject (sub): ${payload.sub}`);
	if (payload.exp) {
		const expDate = new Date((payload.exp as number) * 1000);
		const isExpired = Date.now() >= expDate.getTime();
		lines.push(`Expires (exp): ${expDate.toISOString()} ${isExpired ? '(EXPIRED)' : ''}`);
	}
	if (payload.iat) {
		const iatDate = new Date((payload.iat as number) * 1000);
		lines.push(`Issued At (iat): ${iatDate.toISOString()}`);
	}
	if (payload.nbf) {
		const nbfDate = new Date((payload.nbf as number) * 1000);
		lines.push(`Not Before (nbf): ${nbfDate.toISOString()}`);
	}
	
	lines.push('');
	lines.push('=== Full Payload ===');
	lines.push(JSON.stringify(payload, null, 2));
	
	return lines.join('\n');
}

/**
 * Check if cookies are accessible (for debugging)
 */
export function checkCookieAccess(): {
	cookiesEnabled: boolean;
	canReadCookies: boolean;
	documentCookies: string;
} {
	const cookiesEnabled = navigator.cookieEnabled;
	const documentCookies = document.cookie;
	const canReadCookies = documentCookies.length > 0 || cookiesEnabled;
	
	return {
		cookiesEnabled,
		canReadCookies,
		documentCookies,
	};
}

/**
 * Debug helper: Log cookie information and JWT details
 * Call this in the browser console after login to debug cookie issues
 */
export function debugAuthCookies(): void {
	console.group('🔍 Auth Cookie Debug Info');
	
	// Check cookie access
	const cookieInfo = checkCookieAccess();
	console.log('Cookie Access:', cookieInfo);
	
	// Try to read cookies (note: httpOnly cookies won't be visible)
	const allCookies = document.cookie;
	console.log('Visible Cookies:', allCookies || '(none - httpOnly cookies are not visible to JavaScript)');
	
	// Check for specific auth cookies
	const authCookies = ['_auth.jti', '_auth.t'];
	authCookies.forEach((cookieName) => {
		const cookie = document.cookie
			.split('; ')
			.find((row) => row.startsWith(`${cookieName}=`));
		
		if (cookie) {
			const value = cookie.split('=')[1];
			console.log(`✅ ${cookieName}: Found (value hidden - httpOnly)`);
			
			// If it's a JWT token, try to decode it
			if (cookieName === '_auth.t' && value) {
				const decoded = decodeJWT(value);
				if (decoded) {
					console.log(`   JWT Claims:`, decoded.payload);
					const timeLeft = getJWTTimeUntilExpiry(value);
					if (timeLeft !== null) {
						console.log(`   Time until expiry: ${timeLeft}s (${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s)`);
					}
				}
			}
		} else {
			console.log(`❌ ${cookieName}: Not found`);
		}
	});
	
	console.log('\n💡 Note: httpOnly cookies are not accessible via document.cookie.');
	console.log('   If cookies are set but not visible here, they are working correctly!');
	console.log('   Check Network tab → Response Headers → Set-Cookie to verify.');
	
	console.groupEnd();
}

