'use client';

import { useState } from 'react';

interface TableInfo {
	name: string;
	columns: Array<{
		cid: number;
		name: string;
		type: string;
		notnull: number;
		dflt_value: unknown;
		pk: number;
	}>;
}

interface SchemaExplorerProps {
	tables: TableInfo[];
	loading?: boolean;
	onTableSelect?: (tableName: string) => void;
}

export function SchemaExplorer({ tables, loading = false, onTableSelect }: SchemaExplorerProps) {
	const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

	const toggleTable = (tableName: string) => {
		const newExpanded = new Set(expandedTables);
		if (newExpanded.has(tableName)) {
			newExpanded.delete(tableName);
		} else {
			newExpanded.add(tableName);
		}
		setExpandedTables(newExpanded);
	};

	// Show loading skeleton
	if (loading) {
		return (
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-foreground mb-3">Database Schema</h3>
				<div className="max-h-96 overflow-y-auto space-y-2 pr-2">
					{[1, 2, 3, 5, 6, 7, 8, 9, 10].map((i) => (
						<div key={i} className="border border-border rounded-lg overflow-hidden animate-pulse">
							<div className="w-full px-3 py-2 flex items-center justify-between">
								<div className="h-4 bg-muted rounded w-32"></div>
								<div className="w-4 h-4 bg-muted rounded"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (tables.length === 0) {
		return (
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-foreground mb-3">Database Schema</h3>
				<div className="text-center py-8 text-muted-foreground text-sm">
					No tables found
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-semibold text-foreground mb-3">Database Schema</h3>
			<div className="max-h-96 overflow-y-auto space-y-2 pr-2">
				{tables.map((table) => (
				<div
					key={table.name}
					className="border border-border rounded-lg overflow-hidden"
				>
					<button
						onClick={() => {
							toggleTable(table.name);
							onTableSelect?.(table.name);
						}}
						className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-muted transition-colors"
					>
						<span className="font-medium text-foreground">{table.name}</span>
						<svg
							className={`w-4 h-4 transition-transform ${
								expandedTables.has(table.name) ? 'rotate-180' : ''
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{expandedTables.has(table.name) && (
						<div className="px-3 py-2 bg-muted/30 border-t border-border">
							<div className="space-y-1">
								{table.columns.map((col, colIdx) => (
									<div
										key={`${table.name}-${col.name}-${colIdx}`}
										className="text-xs flex items-center gap-2 text-muted-foreground"
									>
										<span className="font-mono font-medium">{col.name}</span>
										<span className="text-muted-foreground/70">{col.type}</span>
										{col.pk === 1 && (
											<span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
												PK
											</span>
										)}
										{col.notnull === 1 && (
											<span className="text-muted-foreground/50">NOT NULL</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			))}
			</div>
		</div>
	);
}

