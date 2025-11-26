'use client';

import { useTheme } from '@/lib/theme';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { useState, useEffect } from 'react';
import { Api } from '@/lib/api';
import { toast } from 'sonner';
import { Github, Book } from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
	email: string;
	name?: string;
	university?: string;
}

interface MobileHeaderProps {
	onLogin: () => void;
}

export function MobileHeader({ onLogin }: MobileHeaderProps) {
	const { theme, toggleTheme } = useTheme();
	const [user, setUser] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [mounted, setMounted] = useState(false);

	// Track mount to prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Load user info on mount
	useEffect(() => {
		loadUserInfo();
	}, []);

	const loadUserInfo = async () => {
		try {
			const response = await Api.getUserInfo();
			if (response.success && response.data) {
				setUser(response.data);
			} else {
				setUser(null);
			}
		} catch {
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await Api.logout();
			setUser(null);
			window.location.reload(); // Reload to refresh auth state
		} catch {
			toast.error('Logout failed');
		}
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center justify-between px-4 relative">
				{/* Left side: QueryLab Logo */}
				<Link href="/" className="flex items-center gap-2">
					<h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
						QueryLab
					</h1>
				</Link>
				
				{/* Right side: Profile, Theme, GitHub, and Docs - always on the right for all screen sizes */}
				<div className="flex items-center gap-2">
					{/* Documentation Link */}
					<Link
						href="/docs"
						className="p-2 rounded-md hover:bg-accent transition-all duration-300 flex items-center gap-2 group"
						aria-label="Documentation"
					>
						<Book className="w-5 h-5" />
						<span className="hidden sm:inline text-sm font-medium group-hover:text-primary transition-colors">
							Docs
						</span>
					</Link>
					
					{/* GitHub Link - Icon only on small screens, text + icon on larger */}
					<a
						href="https://github.com/zamdevio/querylab"
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 rounded-md hover:bg-accent transition-all duration-300 flex items-center gap-2 group"
						aria-label="View on GitHub"
					>
						<Github className="w-5 h-5" />
						<span className="hidden sm:inline text-sm font-medium group-hover:text-primary transition-colors">
							GitHub
						</span>
					</a>
					
					{/* Theme Toggle with Animation */}
					<button
						onClick={toggleTheme}
						className="p-2 rounded-md hover:bg-accent transition-all duration-300 relative overflow-hidden group"
						aria-label="Toggle theme"
					>
						<div className="relative w-5 h-5">
							{/* Sun Icon - Only show theme-dependent classes after mount to prevent hydration mismatch */}
							<svg
								className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${
									!mounted
										? 'opacity-0'
										: theme === 'dark'
											? 'opacity-100 rotate-0 scale-100'
											: 'opacity-0 rotate-90 scale-0'
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							{/* Moon Icon - Only show theme-dependent classes after mount to prevent hydration mismatch */}
							<svg
								className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${
									!mounted
										? 'opacity-0'
										: theme === 'light'
											? 'opacity-100 rotate-0 scale-100'
											: 'opacity-0 -rotate-90 scale-0'
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
								/>
							</svg>
						</div>
					</button>
					
					{/* User Profile Dropdown */}
					{!loading && (
						<UserProfileDropdown
							user={user}
							onLogin={onLogin}
							onLogout={handleLogout}
						/>
					)}
				</div>
			</div>
		</header>
	);
}
