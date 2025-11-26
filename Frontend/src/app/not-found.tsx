import Link from 'next/link';
import { Home, Database } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: '404 - Page Not Found',
	description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4">
			<div className="text-center space-y-6 max-w-md">
				<div className="space-y-2">
					<h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
						404
					</h1>
					<h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
					<p className="text-muted-foreground">
						The page you are looking for does not exist or has been moved.
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
					<Link
						href="/"
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Home className="w-4 h-4" />
						Go Home
					</Link>
					<Link
						href="/docs"
						className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
					>
						<Database className="w-4 h-4" />
						Documentation
					</Link>
				</div>

				<div className="pt-6 border-t border-border">
					<p className="text-sm text-muted-foreground">
						If you believe this is an error, please check the URL or return to the homepage.
					</p>
				</div>
			</div>
		</div>
	);
}

