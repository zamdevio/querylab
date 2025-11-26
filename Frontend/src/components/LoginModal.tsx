'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { config } from '@/lib/config';

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCodeSent: (email: string) => void;
}

export function LoginModal({ isOpen, onClose, onCodeSent }: LoginModalProps) {
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset form state when modal closes
	useEffect(() => {
		if (!isOpen) {
			// Reset form state when modal closes (defer to avoid cascading renders)
			setTimeout(() => {
				setEmail('');
				setName('');
				setLoading(false);
				setError(null);
			}, 0);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const apiUrl = config.API_URL;
			const response = await fetch(`${apiUrl}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					name: name.trim() || undefined,
				}),
			});

			const data = await response.json();

			if (!data.success) {
				setError(data.error?.message || 'Login failed');
				setLoading(false);
				return;
			}

			// Check if code was sent (AUTH_PENDING status)
			if (data.data?.status === 'AUTH_PENDING') {
				onCodeSent(email.trim().toLowerCase());
				onClose();
			} else {
				// Direct success (shouldn't happen with new flow, but handle it)
				onClose();
				window.location.reload(); // Reload to refresh auth state
			}
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

				<h2 className="text-2xl font-bold mb-2">Login to QueryLab</h2>
				<p className="text-muted-foreground mb-6">
					Enter your @ucsiuniversity.edu.my email to receive a verification code. No account creation needed - just enter your email!
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-medium mb-2">
							Email <span className="text-muted-foreground">(@ucsiuniversity.edu.my)</span>
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="your.email@ucsiuniversity.edu.my"
							className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							disabled={loading}
						/>
					</div>

					<div>
						<label htmlFor="name" className="block text-sm font-medium mb-2">
							Name <span className="text-muted-foreground">(optional)</span>
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name (defaults to 'Student')"
							className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							disabled={loading}
						/>
					</div>

					{error && (
						<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
					>
						{loading ? 'Sending code...' : 'Send Verification Code'}
					</button>
				</form>
			</div>
		</div>
	);
}

