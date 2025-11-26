'use client';

interface ResultTableProps {
	results: unknown[];
	columns?: string[];
}

export function ResultTable({ results, columns }: ResultTableProps) {
	if (!results || results.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				No results to display
			</div>
		);
	}

	// Extract columns from first result if not provided
	const resultColumns = columns || (results[0] && typeof results[0] === 'object' 
		? Object.keys(results[0] as Record<string, unknown>)
		: ['Value']);

	// Convert results to array of objects
	const rows = results.map((result) => {
		if (Array.isArray(result)) {
			const obj: Record<string, unknown> = {};
			resultColumns.forEach((col, idx) => {
				obj[col] = result[idx];
			});
			return obj;
		}
		return result as Record<string, unknown>;
	});

	return (
		<div className="border border-border rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							{resultColumns.map((col) => (
								<th
									key={col}
									className="px-4 py-2 text-left font-medium text-foreground border-b border-border"
								>
									{col}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, idx) => (
							<tr
								key={idx}
								className="border-b border-border hover:bg-muted/50 transition-colors"
							>
								{resultColumns.map((col) => (
									<td key={col} className="px-4 py-2 text-muted-foreground">
										{row[col] !== null && row[col] !== undefined
											? String(row[col])
											: <span className="text-muted-foreground/50">NULL</span>}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="px-4 py-2 text-xs text-muted-foreground bg-muted border-t border-border">
				{rows.length} row{rows.length !== 1 ? 's' : ''}
			</div>
		</div>
	);
}

