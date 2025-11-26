import type { Metadata } from 'next';
import { ThemeProvider, ThemeScript } from '@/lib/theme';
import { Toaster } from '@/components/Toaster';
import '@/styles/globals.css';

export const metadata: Metadata = {
	title: 'QueryLab - Learn SQL in Your Browser',
	description: 'Zero-install, in-browser PostgreSQL learning app with AI assistance',
	icons: {
		icon: '/favicon.svg',
		apple: '/favicon.svg',
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<ThemeScript />
			</head>
			<body>
				<ThemeProvider>
					{children}
					<Toaster/>
				</ThemeProvider>
			</body>
		</html>
	);
}

