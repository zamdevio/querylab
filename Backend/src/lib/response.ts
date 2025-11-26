/**
 * Standard API response format
 * All endpoints should use this format for consistent frontend handling
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
 * Create a success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
	return {
		success: true,
		data,
		error: null,
	};
}

/**
 * Create an error response
 */
export function errorResponse(
	message: string,
	code?: string,
	details?: unknown,
): ApiResponse<null> {
	return {
		success: false,
		data: null,
		error: {
			message,
			...(code && { code }),
			...(details && { details }),
		},
	};
}

