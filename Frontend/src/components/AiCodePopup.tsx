'use client';

interface AiCodePopupProps {
	code: string;
	message: string;
	explanation?: string;
	onClose: () => void;
}

const CODE_COLORS: Record<string, string> = {
	SUCCESS: 'text-green-500',
	SCHEMA_MISMATCH: 'text-yellow-500',
	INVALID_REQUEST: 'text-orange-500',
	ERROR: 'text-red-500',
	DEFAULT: 'text-destructive',
};

const CODE_ICONS: Record<string, string> = {
	SUCCESS: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
	SCHEMA_MISMATCH: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
	INVALID_REQUEST: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
	ERROR: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export function AiCodePopup({ code, message, explanation, onClose }: AiCodePopupProps) {
	const iconPath = CODE_ICONS[code] || CODE_ICONS.ERROR;
	const colorClass = CODE_COLORS[code] || CODE_COLORS.DEFAULT;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			{/* Backdrop with blur */}
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
			
			{/* Modal */}
			<div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl transform transition-all modal-enter">
				{/* Header */}
				<div className={`px-6 py-5 border-b border-border bg-gradient-to-r ${code === 'SUCCESS' ? 'from-green-500/10 via-green-500/5' : 'from-red-500/10 via-red-500/5'} to-transparent`}>
					<div className="flex items-center gap-3">
						<div className={`flex items-center justify-center w-10 h-10 rounded-lg ${code === 'SUCCESS' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
							<svg
								className={`w-6 h-6 ${colorClass}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d={iconPath}
								/>
							</svg>
						</div>
						<div className="flex-1">
							<h3 className={`text-lg font-semibold ${colorClass}`}>{code}</h3>
							<p className="text-sm text-muted-foreground mt-0.5">AI Response</p>
						</div>
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
					</div>
				</div>

				{/* Content */}
				<div className="p-6 space-y-4">
					{/* Message */}
					<div className="space-y-2">
						<p className="text-sm font-medium text-foreground">Message:</p>
						<p className="text-sm text-foreground leading-relaxed">{message}</p>
					</div>

					{/* Explanation */}
					{explanation && (
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<svg
									className="w-5 h-5 text-primary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="text-base font-semibold text-foreground">AI Explanation</p>
							</div>
							<div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
								<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{explanation}</p>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
					<button
						onClick={onClose}
						className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
					>
						Got it
					</button>
				</div>
			</div>
		</div>
	);
}

