/**
 * Rate limiter using general storage Durable Object
 * Provides consistent rate limiting across all worker instances
 */

import { createStorageClient, StorageHelpers } from './services/do/storageClient';

export interface RateLimiter {
	/**
	 * Check if a request should be allowed
	 * @param userId - User identifier (from header, IP, etc.)
	 * @returns Object with allowed status and remaining requests
	 */
	checkLimit(userId: string): Promise<{ allowed: boolean; remaining: number }>;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
	maxTokens: number;
	windowMs: number;
	refillRate: number;
}

/**
 * Token bucket entry
 */
interface TokenBucket {
	tokens: number;
	lastRefill: number;
}

/**
 * Rate limiter implementation using general storage
 */
export class StorageRateLimiter implements RateLimiter {
	private helpers: StorageHelpers;
	private config: RateLimitConfig;

	constructor(
		storageNamespace: DurableObjectNamespace,
		config: RateLimitConfig = {
			maxTokens: 30,
			windowMs: 60 * 1000, // 1 minute
			refillRate: 30, // 30 tokens per window
		},
	) {
		const client = createStorageClient(storageNamespace);
		this.helpers = new StorageHelpers(client);
		this.config = config;
	}

	/**
	 * Refill tokens for a bucket based on elapsed time
	 */
	private refillBucket(bucket: TokenBucket, now: number): void {
		const elapsed = now - bucket.lastRefill;
		const windowsElapsed = Math.floor(elapsed / this.config.windowMs);

		if (windowsElapsed > 0) {
			// Refill tokens
			bucket.tokens = Math.min(
				this.config.maxTokens,
				bucket.tokens + windowsElapsed * this.config.refillRate,
			);
			bucket.lastRefill = now;
		}
	}

	async checkLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
		const now = Date.now();

		// Get current bucket state
		let bucket = await this.helpers.getRateLimit(userId);

		if (!bucket) {
			// Create new bucket with full tokens
			bucket = {
				tokens: this.config.maxTokens,
				lastRefill: now,
			};
		} else {
			// Refill if needed
			this.refillBucket(bucket, now);
		}

		// Check if tokens available
		const allowed = bucket.tokens > 0;
		if (allowed) {
			bucket.tokens--;
		}

		// Save updated bucket
		await this.helpers.setRateLimit(userId, bucket.tokens, bucket.lastRefill);

		return {
			allowed,
			remaining: Math.max(0, bucket.tokens),
		};
	}
}

/**
 * Create a rate limiter instance
 * @param storageNamespace - Durable Object namespace for storage
 * @param config - Optional rate limit configuration
 * @returns Rate limiter instance
 */
export function createRateLimiter(
	storageNamespace: DurableObjectNamespace,
	config?: RateLimitConfig,
): RateLimiter {
	return new StorageRateLimiter(storageNamespace, config);
}

/**
 * Default rate limit config: 30 requests per minute
 */
export const DEFAULT_RATE_LIMIT_CONFIG = {
	maxTokens: 30,
	windowMs: 60 * 1000,
	refillRate: 30,
} as const;
