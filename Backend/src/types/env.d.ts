/**
 * Extended Env type to include secrets and configuration
 * 
 * Secrets set via Wrangler (encrypted) or .dev.vars are available
 * at runtime but not in the auto-generated worker-configuration.d.ts.
 * This file extends the Env interface to include them for TypeScript.
 * 
 * Note: This extends the global Env interface which is declared in
 * worker-configuration.d.ts. TypeScript will merge these declarations.
 */

// Extend the global Env interface (declared in worker-configuration.d.ts)
declare global {
	interface Env {
		// Required: Set in wrangler.jsonc vars
		ENVIRONMENT: 'development' | 'production';
		
		// Secrets: Set via Wrangler secret put or .dev.vars
		// These are optional in the type because they might not be set during development
		// but are validated at runtime in getConfig()
		DEEPSEEK_KEY?: string;
		JWT_SECRET?: string;
		RESEND_API_KEY?: string;
		EMAIL_FROM?: string;
		
		// Optional configuration: Can be secret, vars, or .dev.vars
		FRONTEND_URL?: string;
		COOKIE_DOMAIN?: string;
		
		// Durable Object binding (auto-provided by Cloudflare)
		STORAGE_DO: DurableObjectNamespace;
	}
}

export {};

