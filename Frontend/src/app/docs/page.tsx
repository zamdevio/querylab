'use client';

import Link from 'next/link';
import { Book, Code, Database, Zap, Shield, Bug, Server, Globe, FileText, ArrowRight } from 'lucide-react';
import { MobileHeader } from '@/components/MobileHeader';
import { LoginModal } from '@/components/LoginModal';
import { CodeVerificationModal } from '@/components/CodeVerificationModal';
import { AuthErrorModal } from '@/components/AuthErrorModal';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function DocsPage() {
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showCodeModal, setShowCodeModal] = useState(false);
	const [pendingEmail, setPendingEmail] = useState('');
	const [showAuthError, setShowAuthError] = useState(false);
	const [authError, setAuthError] = useState<{ code?: string; message?: string } | null>(null);

	// Listen for open-login event from CodeVerificationModal
	useEffect(() => {
		const handleOpenLogin = () => {
			setShowCodeModal(false);
			setPendingEmail('');
			setShowLoginModal(true);
		};

		window.addEventListener('open-login', handleOpenLogin);
		return () => {
			window.removeEventListener('open-login', handleOpenLogin);
		};
	}, []);

	// Listen for auth-error events
	useEffect(() => {
		const handleAuthError = (event: Event) => {
			const customEvent = event as CustomEvent<{ code?: string; message?: string }>;
			setAuthError({
				code: customEvent.detail?.code,
				message: customEvent.detail?.message,
			});
			setShowAuthError(true);
		};

		window.addEventListener('auth-error', handleAuthError);
		return () => {
			window.removeEventListener('auth-error', handleAuthError);
		};
	}, []);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<MobileHeader onLogin={() => setShowLoginModal(true)} />
			<div className="container mx-auto px-4 py-12 max-w-4xl flex-1">
				{/* Header */}
				<div className="mb-12">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
						QueryLab Documentation
					</h1>
					<p className="text-lg text-muted-foreground">
						Complete guide to using QueryLab, understanding its architecture, and troubleshooting common issues.
					</p>
				</div>

				{/* Quick Start */}
				<section className="mb-12">
					<div className="flex items-center gap-3 mb-6">
						<Zap className="w-6 h-6 text-primary" />
						<h2 className="text-2xl font-semibold">Quick Start</h2>
					</div>
					<div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
						<h3 className="text-xl font-semibold">Getting Started with QueryLab</h3>
						<p className="text-muted-foreground">
							QueryLab is a zero-install, in-browser PostgreSQL learning application powered by PGlite. No setup required - just open the app and start writing SQL!
						</p>
						
						<div className="space-y-3 mt-4">
							<div className="flex items-start gap-3">
								<span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</span>
								<div>
									<h4 className="font-semibold">Write Your SQL Query</h4>
									<p className="text-sm text-muted-foreground">Type your SQL in the Monaco editor. It features syntax highlighting, autocomplete, and error detection.</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</span>
								<div>
									<h4 className="font-semibold">Run Your Query</h4>
									<p className="text-sm text-muted-foreground">Press <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Cmd/Ctrl + Enter</kbd> or click the &quot;Run Query&quot; button to execute your SQL.</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">3</span>
								<div>
									<h4 className="font-semibold">View Results</h4>
									<p className="text-sm text-muted-foreground">Results appear in a table below the editor. You can sort, scroll, and explore your data.</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">4</span>
								<div>
									<h4 className="font-semibold">Use AI Assistance</h4>
									<p className="text-sm text-muted-foreground">Click &quot;Ask AI&quot; to generate SQL from natural language, or use &quot;Fix With AI&quot; when you encounter errors.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features */}
				<section className="mb-12">
					<div className="flex items-center gap-3 mb-6">
						<Code className="w-6 h-6 text-primary" />
						<h2 className="text-2xl font-semibold">Features</h2>
					</div>
					<div className="grid md:grid-cols-2 gap-4">
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="font-semibold mb-2 flex items-center gap-2">
								<Database className="w-5 h-5 text-primary" />
								Client-Side PostgreSQL
							</h3>
							<p className="text-sm text-muted-foreground">
								All SQL execution happens in your browser using PGlite (PostgreSQL compiled to WebAssembly). Your data never leaves your device. PGlite provides the best engine that matches standard SQL format.
							</p>
						</div>
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="font-semibold mb-2 flex items-center gap-2">
								<Zap className="w-5 h-5 text-primary" />
								AI-Powered SQL Generation
							</h3>
							<p className="text-sm text-muted-foreground">
								Generate SQL queries from natural language using DeepSeek AI. Perfect for learning and prototyping.
							</p>
						</div>
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="font-semibold mb-2 flex items-center gap-2">
								<Shield className="w-5 h-5 text-primary" />
								SQL Error Fixing
							</h3>
							<p className="text-sm text-muted-foreground">
								When you encounter SQL errors, use &quot;Fix With AI&quot; to automatically correct syntax and logic issues.
							</p>
						</div>
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="font-semibold mb-2 flex items-center gap-2">
								<FileText className="w-5 h-5 text-primary" />
								Import/Export
							</h3>
							<p className="text-sm text-muted-foreground">
								Import existing .sql files or export your databases. Perfect for sharing and backing up your work.
							</p>
						</div>
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="font-semibold mb-2 flex items-center gap-2">
								<Globe className="w-5 h-5 text-primary" />
								Schema Explorer
							</h3>
							<p className="text-sm text-muted-foreground">
								Visualize your database schema, explore table structures, and understand relationships at a glance.
							</p>
						</div>
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="font-semibold mb-2 flex items-center gap-2">
								<Database className="w-5 h-5 text-primary" />
								Multiple Databases
							</h3>
							<p className="text-sm text-muted-foreground">
								Create and manage multiple databases. Switch between them easily using the database selector.
							</p>
						</div>
					</div>
				</section>

				{/* Error Handling */}
				<section className="mb-12">
					<div className="flex items-center gap-3 mb-6">
						<Bug className="w-6 h-6 text-primary" />
						<h2 className="text-2xl font-semibold">Error Handling</h2>
					</div>
					<div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
						<h3 className="text-xl font-semibold">How QueryLab Handles Errors</h3>
						
						<div className="space-y-4">
							<div>
								<h4 className="font-semibold mb-2">SQL Execution Errors</h4>
								<p className="text-sm text-muted-foreground mb-2">
									When a SQL query fails, QueryLab displays a clear error message with:
								</p>
								<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
									<li>Error type and description</li>
									<li>The problematic SQL query highlighted</li>
									<li>A &quot;Fix With AI&quot; button for automatic error correction</li>
								</ul>
							</div>

							<div>
								<h4 className="font-semibold mb-2">AI Fix Feature</h4>
								<p className="text-sm text-muted-foreground mb-2">
									When you click &quot;Fix With AI&quot;, QueryLab:
								</p>
								<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
									<li>Analyzes the error message and problematic SQL</li>
									<li>Considers your database schema and data</li>
									<li>Generates a corrected SQL query</li>
									<li>Provides an explanation of what was fixed</li>
								</ul>
							</div>

							<div>
								<h4 className="font-semibold mb-2">Network & API Errors</h4>
								<p className="text-sm text-muted-foreground mb-2">
									For backend API calls (AI features, authentication), errors are handled gracefully:
								</p>
								<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
									<li>Rate limiting errors show retry information</li>
									<li>Authentication errors prompt for login</li>
									<li>Network errors provide clear feedback</li>
									<li>All errors use toast notifications for visibility</li>
								</ul>
							</div>

							<div>
								<h4 className="font-semibold mb-2">Data Persistence Errors</h4>
								<p className="text-sm text-muted-foreground mb-2">
									If IndexedDB operations fail, QueryLab:
								</p>
								<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
									<li>Shows a warning but continues operation</li>
									<li>Attempts to restore default database if needed</li>
									<li>Provides export options to save your work</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* Architecture */}
				<section className="mb-12">
					<div className="flex items-center gap-3 mb-6">
						<Server className="w-6 h-6 text-primary" />
						<h2 className="text-2xl font-semibold">Architecture</h2>
					</div>
					
					<div className="space-y-6">
						{/* Frontend */}
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<Globe className="w-5 h-5 text-primary" />
								Frontend Architecture
							</h3>
							<p className="text-muted-foreground mb-4">
								QueryLab frontend is built with Next.js 16 (App Router) and React 19, providing a modern, performant user experience.
							</p>
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold mb-2">Key Technologies</h4>
									<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
										<li><strong>Next.js 16:</strong> React framework with App Router for optimal performance</li>
										<li><strong>Monaco Editor:</strong> VS Code&apos;s editor for SQL editing with syntax highlighting</li>
										<li><strong>PGlite:</strong> PostgreSQL compiled to WebAssembly for client-side execution with standard SQL format support</li>
										<li><strong>IndexedDB:</strong> Browser storage for persisting databases locally</li>
										<li><strong>Tailwind CSS:</strong> Utility-first CSS for responsive, modern UI</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold mb-2">Data Flow</h4>
									<ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
										<li>User writes SQL in Monaco editor</li>
										<li>SQL is executed via PGlite (PostgreSQL) in the browser</li>
										<li>Results are displayed in a table component</li>
										<li>Database state is saved to IndexedDB</li>
										<li>Schema is extracted and displayed in explorer</li>
									</ol>
								</div>
								<div>
									<h4 className="font-semibold mb-2">State Management</h4>
									<p className="text-sm text-muted-foreground">
										QueryLab uses React hooks for state management. Database state, SQL queries, results, and UI state are all managed with useState and useCallback hooks for optimal performance.
									</p>
								</div>
							</div>
						</div>

						{/* Backend */}
						<div className="bg-muted/50 border border-border rounded-lg p-6">
							<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<Server className="w-5 h-5 text-primary" />
								Backend Architecture
							</h3>
							<p className="text-muted-foreground mb-4">
								The backend is built with Hono and runs on Cloudflare Workers, providing edge-ready, serverless API endpoints.
							</p>
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold mb-2">Key Technologies</h4>
									<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
										<li><strong>Hono:</strong> Fast web framework optimized for edge runtimes</li>
										<li><strong>Cloudflare Workers:</strong> Serverless platform for edge computing</li>
										<li><strong>Durable Objects:</strong> For rate limiting and state management</li>
										<li><strong>DeepSeek API:</strong> AI-powered SQL generation and fixing</li>
										<li><strong>node-sql-parser:</strong> SQL validation and AST parsing</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold mb-2">API Endpoints</h4>
									<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
										<li><code className="bg-background px-1 py-0.5 rounded text-xs">POST /ai/deepseek</code> - Generate SQL from natural language</li>
										<li><code className="bg-background px-1 py-0.5 rounded text-xs">POST /ai/fix-sql</code> - Fix SQL errors with AI</li>
										<li><code className="bg-background px-1 py-0.5 rounded text-xs">POST /ai/suggestions</code> - Get SQL suggestions</li>
										<li><code className="bg-background px-1 py-0.5 rounded text-xs">POST /auth/login</code> - Initiate login</li>
										<li><code className="bg-background px-1 py-0.5 rounded text-xs">POST /auth/login/verify</code> - Verify login code</li>
										<li><code className="bg-background px-1 py-0.5 rounded text-xs">GET /auth/me</code> - Get user info</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold mb-2">Security Features</h4>
									<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
										<li>JWT-based authentication with httpOnly cookies</li>
										<li>Rate limiting via Durable Objects (30 requests/minute)</li>
										<li>CORS protection with origin validation</li>
										<li>SQL validation before AI processing</li>
										<li>Request size limits (1MB max)</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Detailed Documentation Links */}
				<section className="mb-12">
					<div className="flex items-center gap-3 mb-6">
						<Book className="w-6 h-6 text-primary" />
						<h2 className="text-2xl font-semibold">Detailed Documentation</h2>
					</div>
					<div className="bg-muted/50 border border-border rounded-lg p-6">
						<p className="text-muted-foreground mb-6">
							For more in-depth information, check out these detailed guides:
						</p>
						<div className="grid md:grid-cols-2 gap-4">
							{/* Placeholder links - user will replace with actual hosted markdown links */}
							<a
								href="https://mdviewer.zamdev.dev/share?id=E7wEc_9tbz6-Dop81rX4Yw"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">Getting Started Guide</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=kVxxOVKBLBsqeJcqHm7jYg"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Code className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">SQL Editor Guide</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=NRVCHTaXVCg8Q6N36PDK-g"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Zap className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">AI Features Guide</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=2d71Qeu3cKUYxgVmej3e4w"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Database className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">Database Management</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=w2jIk3uSIRwyOnAtE6QQ3Q"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Bug className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">Troubleshooting Guide</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=6wUMqGUNu6tmfAeBEfMSoA"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Server className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">API Reference</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=S27zMOrA6E2grLqU0Ig73Q"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Shield className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">Authentication Guide</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
							<a
								href="https://mdviewer.zamdev.dev/share?id=UYgTmO8N3Y6hvx6KgXQ-bg"
								target="_blank"
								className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
							>
								<div className="flex items-center gap-3">
									<Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
									<span className="font-medium">Deployment Guide</span>
								</div>
								<ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</a>
						</div>
						<p className="text-xs text-muted-foreground mt-4 italic">
							Note: These links will be updated with hosted markdown documentation once available.
						</p>
					</div>
				</section>

				{/* Back to Home */}
				<div className="pt-6 border-t border-border">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-primary hover:underline"
					>
						<ArrowRight className="w-4 h-4 rotate-180" />
						Back to QueryLab
					</Link>
				</div>
			</div>

			{/* Login Modal */}
			<LoginModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
				onCodeSent={(email) => {
					setPendingEmail(email);
					setShowCodeModal(true);
				}}
			/>

			{/* Code Verification Modal */}
			<CodeVerificationModal
				isOpen={showCodeModal}
				onClose={() => {
					setShowCodeModal(false);
					setPendingEmail('');
					// Reset login modal state so user can try again
					setShowLoginModal(false);
				}}
				email={pendingEmail}
				onVerified={() => {
					setShowCodeModal(false);
					setPendingEmail('');
					toast.success('Login successful!');
				}}
			/>

			{/* Auth Error Modal */}
			<AuthErrorModal
				isOpen={showAuthError}
				onClose={() => {
					setShowAuthError(false);
					setAuthError(null);
				}}
				onOpenLogin={() => {
					setShowAuthError(false);
					setAuthError(null);
					setShowLoginModal(true);
				}}
				errorCode={authError?.code}
				message={authError?.message}
			/>
			<Footer />
		</div>
	);
}