'use client';

import { useState, useEffect, useRef } from 'react';

interface AiModalProps {
	isOpen: boolean;
	onClose: () => void;
	prompt: string;
	onPromptChange: (prompt: string) => void;
	onGenerate: () => void;
	loading: boolean;
	onCancel: () => void;
	suggestions?: string[];
	loadingSuggestions?: boolean;
}

export function AiModal({
	isOpen,
	onClose,
	prompt,
	onPromptChange,
	onGenerate,
	loading,
	onCancel,
	suggestions = [],
	loadingSuggestions = false,
}: AiModalProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
	
	// Update previous suggestions when new ones arrive
	useEffect(() => {
		if (suggestions.length > 0 && !loadingSuggestions) {
			// Use setTimeout to avoid synchronous setState in effect
			setTimeout(() => {
				setPreviousSuggestions(suggestions);
			}, 0);
		}
	}, [suggestions, loadingSuggestions]);

	// Auto-focus textarea when modal opens
	useEffect(() => {
		if (isOpen && textareaRef.current) {
			setTimeout(() => {
				textareaRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !loading) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, loading, onClose]);

	// Auto-resize textarea with max height limit
	useEffect(() => {
		if (textareaRef.current) {
			const textarea = textareaRef.current;
			// Reset height to auto to get accurate scrollHeight
			textarea.style.height = 'auto';
			const scrollHeight = textarea.scrollHeight;
			// Set max height to allow ~2-3 more rows (approximately 120px for 4 rows, so max ~180px)
			const maxHeight = 180; // ~6-7 rows
			const minHeight = 100; // ~4 rows default
			
			// If content exceeds max height, set to max and enable scroll
			if (scrollHeight > maxHeight) {
				textarea.style.height = `${maxHeight}px`;
				textarea.style.overflowY = 'auto';
			} else {
				// Otherwise, resize to content but not less than min
				textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
				textarea.style.overflowY = scrollHeight > minHeight ? 'auto' : 'hidden';
			}
		}
	}, [prompt]);

	if (!isOpen) return null;

	const handleExampleClick = (example: string) => {
		onPromptChange(example);
		textareaRef.current?.focus();
		// Scroll textarea into view
		setTimeout(() => {
			textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget && !loading) {
					onClose();
				}
			}}
		>
			{/* Backdrop with blur */}
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
			
			{/* Modal */}
			<div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all modal-enter">
				{/* Header with gradient */}
				<div className="relative px-6 py-5 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
							<svg
								className="w-6 h-6 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
								/>
							</svg>
						</div>
						<div className="flex-1">
							<h3 className="text-xl font-semibold text-foreground">AI SQL Assistant</h3>
							<p className="text-sm text-muted-foreground mt-0.5">
								Describe what you want to query and I&apos;ll generate the SQL
							</p>
						</div>
						{!loading && (
							<button
								onClick={onClose}
								className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
								aria-label="Close"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						)}
					</div>
				</div>

				{/* Content - Flex layout with fixed input and scrollable examples */}
				<div className="p-6 flex flex-col flex-1 min-h-0">
					{/* Input Section - Always visible at top */}
					<div className="space-y-2 flex-shrink-0 mb-4">
						<label htmlFor="ai-prompt" className="text-sm font-medium text-foreground">
							Your request
						</label>
						<div className="relative">
							<textarea
								ref={textareaRef}
								id="ai-prompt"
								value={prompt}
								onChange={(e) => {
									onPromptChange(e.target.value);
								}}
								placeholder="Describe what you want to query... (e.g., Show me all students older than 20)"
								disabled={loading}
								rows={4}
								className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[100px] max-h-[180px]"
								style={{ overflowY: 'auto' }}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading && prompt.trim()) {
										e.preventDefault();
										onGenerate();
									}
								}}
							/>
							{loading && (
								<div className="absolute right-4 top-1/2 -translate-y-1/2">
									<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</div>
						<p className="text-xs text-muted-foreground flex items-center gap-1">
							<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">⌘</kbd> +{' '}
							<kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Enter</kbd> to generate
						</p>
					</div>

					{/* Loading State */}
					{loading && (
						<div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0 mb-4">
							<div className="flex-shrink-0">
								<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">Generating SQL...</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									Analyzing your request and database schema
								</p>
							</div>
						</div>
					)}

					{/* Examples Section - Always visible, scrollable */}
					{!loading && (
						<div className="space-y-2 flex-1 min-h-0 flex flex-col">
							<div className="flex items-center justify-between flex-shrink-0">
								<p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
								{loadingSuggestions && (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
										<span className="text-xs text-muted-foreground">Loading suggestions...</span>
									</div>
								)}
							</div>
							<div className="grid grid-cols-1 gap-2 overflow-y-auto flex-1 pr-2 min-h-[100px]">
								{loadingSuggestions ? (
									<>
										{/* Show old suggestions while loading */}
										{(suggestions.length > 0 ? suggestions : previousSuggestions).map((suggestion: string, idx: number) => (
											<button
												key={`old-${idx}`}
												disabled
												className="text-left px-4 py-2.5 rounded-lg border border-border bg-muted/20 opacity-60 cursor-not-allowed text-sm text-foreground"
											>
												<div className="flex items-center gap-2">
													<svg
														className="w-4 h-4 text-muted-foreground"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M13 10V3L4 14h7v7l9-11h-7z"
														/>
													</svg>
													<span>{suggestion}</span>
												</div>
											</button>
										))}
										{/* Loading indicator */}
										<div className="flex flex-col items-center justify-center py-4 space-y-2 border-t border-border mt-2 pt-4">
											<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
											<p className="text-xs text-muted-foreground">Updating suggestions...</p>
										</div>
									</>
								) : suggestions.length > 0 ? (
									suggestions.map((suggestion, idx) => (
										<button
											key={idx}
											onClick={() => handleExampleClick(suggestion)}
											className="text-left px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all text-sm text-foreground group"
										>
											<div className="flex items-center gap-2">
												<svg
													className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M13 10V3L4 14h7v7l9-11h-7z"
													/>
												</svg>
												<span className="flex-1">{suggestion}</span>
											</div>
										</button>
									))
								) : (
									<div className="flex flex-col items-center justify-center py-8">
										<svg
											className="w-8 h-8 text-muted-foreground/50 mb-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
											/>
										</svg>
										<p className="text-xs text-muted-foreground text-center px-4">
											No suggestions available. Start typing to generate SQL!
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						<span>Your data stays private and secure</span>
					</div>
					<div className="flex items-center gap-2">
						{loading ? (
							<button
								onClick={onCancel}
								className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium text-sm"
							>
								Cancel
							</button>
						) : (
							<>
								<button
									onClick={onClose}
									className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium text-sm"
								>
									Cancel
								</button>
								<button
									onClick={onGenerate}
									disabled={!prompt.trim()}
									className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
									Generate SQL
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

