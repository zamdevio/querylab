'use client';

/**
 * Theme provider with FOUC prevention
 * Injects theme class before React hydration
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
	if (typeof window === 'undefined') return 'light';
	
	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored === 'light' || stored === 'dark') {
		return stored;
	}
	
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme) {
	if (typeof document === 'undefined') return;
	
	const root = document.documentElement;
	if (theme === 'dark') {
		root.setAttribute('data-theme', 'dark');
	} else {
		root.removeAttribute('data-theme');
	}
}

/**
 * Inject theme script to prevent FOUC
 */
export function ThemeScript() {
	const script = `
		(function() {
			const theme = localStorage.getItem('theme') || 
				(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
			if (theme === 'dark') {
				document.documentElement.setAttribute('data-theme', 'dark');
			}
		})();
	`;
	
	return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	// Initialize theme from localStorage or system preference
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === 'undefined') return 'light';
		const initialTheme = getInitialTheme();
		applyTheme(initialTheme);
		return initialTheme;
	});
	const [mounted] = useState(() => typeof window !== 'undefined');

	useEffect(() => {
		if (mounted) {
			applyTheme(theme);
			localStorage.setItem('theme', theme);
		}
	}, [theme, mounted]);

	const toggleTheme = () => {
		setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

