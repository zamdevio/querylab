'use client';

import { AlertCircle } from 'lucide-react';

interface AuthErrorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenLogin: () => void;
	errorCode?: string;
	message?: string;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
	SESSION_NOT_FOUND: {
		title: 'Session Expired or Not Found',
		description: 'Your verification session has expired or was not found. This can happen if you exceeded the maximum number of verification attempts (6 attempts) or if the session expired. Please request a new verification code to continue.',
	},
	AUTH_MISSING: {
		title: 'Authentication Required',
		description: 'You need to be logged in to use this feature. Please log in to continue.',
	},
	SESSION_ALREADY_VERIFIED: {
		title: 'Code Already Used',
		description: 'This verification code has already been used. Please request a new verification code if you need to log in again.',
	},
	INVALID_CODE: {
		title: 'Invalid Verification Code',
		description: 'The verification code you entered is incorrect. Please check your email and try again.',
	},
	VERIFICATION_ERROR: {
		title: 'Verification Failed',
		description: 'An error occurred during verification. Please try again or request a new verification code.',
	},
};

export function AuthErrorModal({
	isOpen,
	onClose,
	onOpenLogin,
	errorCode,
	message,
}: AuthErrorModalProps) {
	if (!isOpen) return null;

	const errorInfo = errorCode && ERROR_MESSAGES[errorCode]
		? ERROR_MESSAGES[errorCode]
		: {
				title: 'Authentication Error',
				description: message || 'An authentication error occurred. Please try logging in again.',
		  };

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
				<div className="flex items-start gap-4">
					<div className="flex-shrink-0">
						<div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
							<AlertCircle className="w-6 h-6 text-destructive" />
						</div>
					</div>
					<div className="flex-1">
						<h2 className="text-xl font-bold mb-2 text-foreground">{errorInfo.title}</h2>
						<p className="text-muted-foreground mb-6">{errorInfo.description}</p>
						
						<div className="flex gap-3">
							<button
								onClick={onOpenLogin}
								className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
							>
								Log In
							</button>
							<button
								onClick={onClose}
								className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

