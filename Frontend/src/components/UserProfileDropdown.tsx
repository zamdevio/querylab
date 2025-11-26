'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserInfo {
	email: string;
	name?: string;
	university?: string;
}

interface UserProfileDropdownProps {
	user: UserInfo | null;
	onLogin: () => void;
	onLogout: () => void;
}

export function UserProfileDropdown({ user, onLogin, onLogout }: UserProfileDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	if (!user) {
		return (
			<button
				onClick={onLogin}
				className="px-3 py-1.5 text-sm font-medium text-foreground bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-2"
			>
				<User className="w-4 h-4" />
				<span className="hidden sm:inline">Log In</span>
			</button>
		);
	}

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm"
			>
				<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
					<User className="w-4 h-4 text-primary" />
				</div>
				<span className="hidden sm:inline text-sm font-medium text-foreground max-w-[120px] truncate">
					{user.name || user.email.split('@')[0]}
				</span>
				<ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
					<div className="p-4 border-b border-border">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
								<User className="w-5 h-5 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-foreground truncate">{user.name || 'Student'}</p>
								<p className="text-xs text-muted-foreground truncate">{user.email}</p>
								{user.university && (
									<p className="text-xs text-muted-foreground truncate mt-1">{user.university}</p>
								)}
							</div>
						</div>
					</div>
					
					<div className="p-2">
						<button
							onClick={() => {
								setIsOpen(false);
								onLogout();
							}}
							className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
						>
							<LogOut className="w-4 h-4" />
							<span>Log Out</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

