'use client';

import { Github, Book } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
	return (
		<footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
			<div className="container mx-auto px-4 py-6">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<p>© {new Date().getFullYear()} <Link href="/" className="hover:text-foreground transition-colors font-semibold">QueryLab</Link>. Built with ❤️ for learning SQL.</p>
					</div>
					
					<div className="flex items-center gap-4">
						<Link
							href="/docs"
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<Book className="w-4 h-4" />
							<span>Documentation</span>
						</Link>
						<a
							href="https://github.com/zamdevio/querylab"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<Github className="w-4 h-4" />
							<span>View on GitHub</span>
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

