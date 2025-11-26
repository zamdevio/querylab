'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { config } from '@/lib/config';

interface CodeVerificationModalProps {
	isOpen: boolean;
	onClose: () => void;
	email: string;
	onVerified: () => void;
}

export function CodeVerificationModal({
	isOpen,
	onClose,
	email,
	onVerified,
}: CodeVerificationModalProps) {
	const [code, setCode] = useState(['', '', '', '', '', '']);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionNotFound, setSessionNotFound] = useState(false);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		if (isOpen) {
			inputRefs.current[0]?.focus();
		} else {
			// Reset form state when modal closes (defer to avoid cascading renders)
			setTimeout(() => {
				setCode(['', '', '', '', '', '']);
				setLoading(false);
				setError(null);
				setSessionNotFound(false);
			}, 0);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleCodeChange = (index: number, value: string) => {
		// Block input if SESSION_NOT_FOUND occurred
		if (sessionNotFound) return;
		
		// Only allow digits
		if (value && !/^\d$/.test(value)) return;

		const newCode = [...code];
		newCode[index] = value;
		setCode(newCode);
		setError(null);

		// Auto-focus next input
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}

		// Auto-submit when all 6 digits are entered
		if (newCode.every((digit) => digit !== '') && index === 5) {
			handleVerify(newCode.join(''));
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !code[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData('text').trim();
		if (/^\d{6}$/.test(pastedData)) {
			const digits = pastedData.split('');
			setCode(digits);
			setError(null);
			inputRefs.current[5]?.focus();
			// Auto-submit
			setTimeout(() => handleVerify(pastedData), 100);
		}
	};

	const handleVerify = async (verificationCode?: string) => {
		const codeToVerify = verificationCode || code.join('');
		
		if (codeToVerify.length !== 6) {
			setError('Please enter a 6-digit code');
			return;
		}

		setError(null);
		setLoading(true);

		try {
			const apiUrl = config.API_URL;
			const response = await fetch(`${apiUrl}/auth/login/verify`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ code: codeToVerify }),
			});

			const data = await response.json();

			if (!data.success) {
				const errorCode = data.error?.code;
				const errorMessage = data.error?.message || 'Invalid verification code';
				
				// Handle SESSION_NOT_FOUND - show API error message and block input
				if (errorCode === 'SESSION_NOT_FOUND') {
					setSessionNotFound(true);
					setError(errorMessage); // Use API error message
					setLoading(false);
					// Clear code on error
					setCode(['', '', '', '', '', '']);
					// Don't close modal - let user see the message and click to login again
					return;
				}
				
				// Handle other auth errors that require showing auth error modal
				const authErrorCodes = ['SESSION_ALREADY_VERIFIED', 'VERIFICATION_ERROR', 'AUTH_MISSING'];
				if (errorCode && authErrorCodes.includes(errorCode)) {
					// Close this modal and let parent handle the error
					onClose();
					// Trigger error modal in parent
					if (typeof window !== 'undefined') {
						window.dispatchEvent(new CustomEvent('auth-error', {
							detail: { code: errorCode, message: errorMessage },
						}));
					}
					return;
				}
				
				// For other errors (like INVALID_CODE), show error in modal
				setError(errorMessage);
				setLoading(false);
				// Don't clear code on invalid code - let user try again
				// Only clear if it's a different type of error
				if (errorCode !== 'INVALID_CODE') {
					setCode(['', '', '', '', '', '']);
					inputRefs.current[0]?.focus();
				}
				return;
			}

			// Success - reload page to refresh auth state
			onVerified();
			window.location.reload();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Network error');
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
					aria-label="Close"
				>
					<X size={20} />
				</button>

				<h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
				<p className="text-muted-foreground mb-2">
					We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
				</p>
				<p className="text-sm text-muted-foreground mb-6">
					Please check your email and enter the code below
				</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleVerify();
					}}
					className="space-y-4"
				>
					<div className="flex gap-2 justify-center">
						{code.map((digit, index) => (
							<input
								key={index}
								ref={(el) => {
									inputRefs.current[index] = el;
								}}
								type="text"
								inputMode="numeric"
								maxLength={1}
								value={digit}
								onChange={(e) => handleCodeChange(index, e.target.value)}
								onKeyDown={(e) => handleKeyDown(index, e)}
								onPaste={index === 0 ? handlePaste : undefined}
								disabled={loading || sessionNotFound}
								className="w-12 h-14 text-center text-2xl font-bold border-2 border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
							/>
						))}
					</div>

					{error && (
						<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
							<p className="whitespace-pre-line text-center">{error}</p>
							{sessionNotFound && (
								<button
									type="button"
									onClick={() => {
										onClose();
										// Trigger login modal open
										if (typeof window !== 'undefined') {
											window.dispatchEvent(new CustomEvent('open-login'));
										}
									}}
									className="mt-3 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
								>
									Request New Code
								</button>
							)}
						</div>
					)}

					<button
						type="submit"
						disabled={loading || code.some((digit) => !digit) || sessionNotFound}
						className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
					>
						{loading ? 'Verifying...' : 'Verify Code'}
					</button>

					<button
						type="button"
						onClick={onClose}
						className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
					>
						Cancel
					</button>
				</form>
			</div>
		</div>
	);
}

