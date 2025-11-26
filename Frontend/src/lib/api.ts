/**
 * General API client with type safety
 * All API calls include credentials for CORS
 */

import { config } from './config';

const API_BASE_URL = config.API_URL;

/**
 * Standard API response format
 */
export type ApiResponse<T = unknown> =
	| {
			success: true;
			data: T;
			error: null;
	  }
	| {
			success: false;
			data: null;
			error: {
				message: string;
				code?: string;
				details?: unknown;
			};
	  };

/**
 * API client class with abort support
 */
class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE_URL) {
		this.baseUrl = baseUrl;
	}

	/**
	 * Make a request with type safety and abort support
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit & { signal?: AbortSignal } = {},
	): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${endpoint}`;
		const { signal, ...fetchOptions } = options;

		try {
			const response = await fetch(url, {
				...fetchOptions,
				signal,
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					...fetchOptions.headers,
				},
			});

			// Check if request was aborted
			if (signal?.aborted) {
				return {
					success: false,
					data: null,
					error: {
						message: 'Request cancelled',
						code: 'CANCELLED',
					},
				};
			}

			const data = await response.json();

			if (!response.ok) {
				const errorCode = data.error?.code || 'UNKNOWN_ERROR';
				
				// Handle auth errors - these will trigger login popup in the UI
				if (errorCode === 'AUTH_MISSING' || response.status === 401) {
					return {
						success: false,
						data: null,
						error: {
							message: data.error?.message || 'Authentication required',
							code: 'AUTH_MISSING',
							details: data.error?.details,
						},
					};
				}

				return {
					success: false,
					data: null,
					error: {
						message: data.error?.message || 'Request failed',
						code: errorCode,
						details: data.error?.details,
					},
				};
			}

			return data as ApiResponse<T>;
		} catch (error) {
			// Handle abort
			if (error instanceof Error && error.name === 'AbortError') {
				return {
					success: false,
					data: null,
					error: {
						message: 'Request cancelled',
						code: 'CANCELLED',
					},
				};
			}

			const err = error instanceof Error ? error : new Error(String(error));
			return {
				success: false,
				data: null,
				error: {
					message: err.message || 'Network error',
					code: 'NETWORK_ERROR',
				},
			};
		}
	}

	/**
	 * GET request
	 */
	async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	/**
	 * POST request with abort signal support
	 */
	async post<T = unknown>(
		endpoint: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});
	}

	/**
	 * PUT request
	 */
	async put<T = unknown>(
		endpoint: string,
		body?: unknown,
	): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	/**
	 * DELETE request
	 */
	async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}
}

/**
 * Database schema for AI
 */
export interface DatabaseSchema {
	tables: Array<{
		name: string;
		columns: Array<{
			name: string;
			type: string;
			notNull?: boolean;
			pk?: boolean;
		}>;
	}>;
}

/**
 * DeepSeek API request
 */
export interface DeepSeekRequest {
	prompt: string;
	runSql?: boolean;
	allowedTables?: readonly string[];
	schema?: DatabaseSchema;
}

/**
 * DeepSeek API response
 */
export interface DeepSeekResponse {
	sql?: string;
	text?: string;
	validated?: boolean;
	code?: string;
	message?: string;
	explanation?: string;
	[key: string]: unknown;
}

// Create singleton instance
const apiClient = new ApiClient();

/**
 * API methods
 */
export const Api = {
	/**
	 * Health check
	 */
	health: () => apiClient.get<{ status: string; timestamp: string; service: string }>('/health'),

	/**
	 * Generate SQL using DeepSeek AI
	 */
	generateSql: (request: DeepSeekRequest, signal?: AbortSignal) =>
		apiClient.post<DeepSeekResponse>('/ai/generate', request, signal),

	/**
	 * Fix SQL errors using DeepSeek AI
	 */
	fixSql: (request: {
		errorSql: string;
		errorMessage: string;
		schema: DatabaseSchema;
		tableData?: Array<{
			name: string;
			rows: Array<Record<string, unknown>>;
			rowCount: number;
		}>;
		allowedTables?: readonly string[];
	}, signal?: AbortSignal) => apiClient.post<DeepSeekResponse>('/ai/fix', request, signal),

	/**
	 * Get AI suggestions for SQL queries
	 */
	getSuggestions: (request: {
		prompt?: string;
		schema: DatabaseSchema;
		tableData?: Array<{
			name: string;
			rows: Array<Record<string, unknown>>;
			rowCount: number;
		}>;
		allowedTables?: readonly string[];
	}, signal?: AbortSignal) =>
		apiClient.post<{ suggestions: string[]; duration: number }>('/ai/suggest', request, signal),

	/**
	 * Get current user info
	 */
	getUserInfo: () => apiClient.get<{ email: string; name?: string; university?: string }>('/auth/me'),

	/**
	 * Logout user
	 */
	logout: () => apiClient.post('/auth/logout'),
};

export default Api;

