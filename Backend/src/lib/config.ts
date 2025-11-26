/**
 * Backend configuration
 * 
 * Centralized configuration that reads all secrets from environment.
 * Only ENVIRONMENT is read from wrangler.jsonc vars (required).
 * All other configuration (including FRONTEND_URL) can be set via 
 * Wrangler secrets or .dev.vars file.
 * 
 * Note: In Cloudflare Workers, secrets set as "Encrypted" in the dashboard
 * (or via `wrangler secret put`) are accessed the same way as vars:
 * through `env.SECRET_NAME`. Both are available on the `Env` object.
 */

export interface Config {
	/**
	 * Environment (development or production)
	 * Read from wrangler.jsonc vars (required)
	 */
	env: 'development' | 'production';
	
	/**
	 * Frontend URL for CORS
	 * Can be set via Wrangler secret, .dev.vars, or wrangler.jsonc vars
	 * Falls back to http://localhost:3000 if not set
	 */
	frontendUrl: string;
	
	/**
	 * Cookie domain
	 * Required in production when using cross-origin cookies (secure=true, sameSite=None)
	 * Can be set via Wrangler secret, .dev.vars, or wrangler.jsonc vars
	 * Example: ".zamdev.dev" (with leading dot for subdomain sharing)
	 */
	cookieDomain?: string;
	
	/**
	 * DeepSeek API key (secret)
	 * Must be set via Wrangler secret or .dev.vars
	 */
	deepseekKey: string;
	
	/**
	 * JWT secret for token signing (secret)
	 * Must be set via Wrangler secret or .dev.vars
	 */
	jwtSecret: string;
	
	/**
	 * Resend API key for emails (secret)
	 * Must be set via Wrangler secret or .dev.vars
	 */
	resendApiKey: string;
	
	/**
	 * Email sender address (secret)
	 * Must be set via Wrangler secret or .dev.vars
	 */
	emailFrom: string;
	
	/**
	 * Storage Durable Object binding
	 * Automatically provided by Cloudflare Workers
	 */
	storageDo: DurableObjectNamespace;
}

/**
 * Get complete configuration from environment
 * Validates that all required secrets are present
 */
export function getConfig(env: Env): Config {
	// ENVIRONMENT must be set in wrangler.jsonc vars (required)
	const environment = env.ENVIRONMENT as string | undefined;
	if (!environment) {
		throw new Error('ENVIRONMENT is required. Set it in wrangler.jsonc vars as "development" or "production"');
	}
	
	// Validate ENVIRONMENT value
	if (environment !== 'development' && environment !== 'production') {
		throw new Error(`ENVIRONMENT must be "development" or "production", got: ${environment}`);
	}
	
	const isDev = environment === 'development';
	const envValue: 'development' | 'production' = environment as 'development' | 'production';
	
	// Validate required secrets
	if (!env.DEEPSEEK_KEY) {
		throw new Error('DEEPSEEK_KEY secret is required. Set it via Wrangler secret or .dev.vars');
	}
	if (!env.JWT_SECRET) {
		throw new Error('JWT_SECRET secret is required. Set it via Wrangler secret or .dev.vars');
	}
	if (!env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY secret is required. Set it via Wrangler secret or .dev.vars');
	}
	if (!env.EMAIL_FROM) {
		throw new Error('EMAIL_FROM secret is required. Set it via Wrangler secret or .dev.vars');
	}
	if (!env.STORAGE_DO) {
		throw new Error('STORAGE_DO binding is required. Check wrangler.jsonc durable_objects configuration');
	}
	
	// FRONTEND_URL can be from secret, .dev.vars, or wrangler.jsonc vars
	// Default to localhost for development, but require explicit setting for production
	let frontendUrl = env.FRONTEND_URL || (isDev ? 'http://localhost:3000' : undefined);
	if (!frontendUrl) {
		throw new Error('FRONTEND_URL is required for production. Set it via Wrangler secret, .dev.vars, or wrangler.jsonc vars');
	}
	
	// Normalize FRONTEND_URL to ensure it has a protocol
	// If it doesn't start with http:// or https://, assume https:// for production
	if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
		frontendUrl = isDev ? `http://${frontendUrl}` : `https://${frontendUrl}`;
	}
	
	// COOKIE_DOMAIN is required in production when using cross-origin cookies
	// (secure=true, sameSite=None) to enable cookie sharing across subdomains
	const cookieDomain = env.COOKIE_DOMAIN;
	if (!isDev && !cookieDomain) {
		throw new Error('COOKIE_DOMAIN is required for production when using secure cross-origin cookies. Set it via Wrangler secret, .dev.vars, or wrangler.jsonc vars (e.g., ".zamdev.dev")');
	}
	
	return {
		env: envValue,
		frontendUrl,
		cookieDomain,
		deepseekKey: env.DEEPSEEK_KEY,
		jwtSecret: env.JWT_SECRET,
		resendApiKey: env.RESEND_API_KEY,
		emailFrom: env.EMAIL_FROM,
		storageDo: env.STORAGE_DO,
	};
}

/**
 * Get allowed origins for CORS
 */
export function getAllowedOrigins(config: Config): string[] {
	if (config.env === 'development') {
		return ['http://localhost:3000', 'http://127.0.0.1:3000'];
	}
	
	return [config.frontendUrl];
}

/**
 * Check if running in production
 */
export function isProduction(config: Config): boolean {
	return config.env === 'production';
}

