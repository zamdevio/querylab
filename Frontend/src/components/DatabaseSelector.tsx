'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, Pencil, HardDrive } from 'lucide-react';
import { listAllDatabases, createNamedDb, deleteDatabase, loadDbFromStorage, type Database as DbType } from '@/lib/sqlClient';
import { setDbMetadata } from '@/lib/indexedDb';
import { toast } from 'sonner';

interface DatabaseSelectorProps {
	currentDbKey: string;
	onDatabaseChange: (db: DbType, key: string) => void;
	onDatabaseCreated?: (key: string) => void;
}

export function DatabaseSelector({ currentDbKey, onDatabaseChange, onDatabaseCreated }: DatabaseSelectorProps) {
	const [databases, setDatabases] = useState<Array<{ key: string; name: string; updatedAt: number }>>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [renaming, setRenaming] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showRenameModal, setShowRenameModal] = useState(false);
	const [showDbList, setShowDbList] = useState(false);
	const [newDbName, setNewDbName] = useState('');
	const [renameDbKey, setRenameDbKey] = useState<string | null>(null);
	const [renameDbName, setRenameDbName] = useState('');

	// Load databases list
	const loadDatabases = async () => {
		try {
			setLoading(true);
			const fsDbs = await listAllDatabases();
			setDatabases(fsDbs);
		} catch {
			toast.error('Failed to load databases');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDatabases();
	}, []);

	// Handle database selection
	const handleSelect = async (key: string) => {
		if (key === currentDbKey) return;
		
		try {
			const db = await loadDbFromStorage(key);
			if (db) {
				onDatabaseChange(db, key);
				toast.success('Database switched');
			} else {
				toast.error('Failed to load database');
			}
		} catch {
			toast.error('Failed to load database');
		}
	};

	// Handle database creation
	const handleCreate = async () => {
		if (!newDbName.trim()) {
			toast.error('Please enter a database name');
			return;
		}

		try {
			setCreating(true);
			const { db, key } = await createNamedDb(newDbName.trim());
			onDatabaseChange(db, key);
			onDatabaseCreated?.(key);
			setShowCreateModal(false);
			setNewDbName('');
			await loadDatabases();
			// Show the database list after creating
			setShowDbList(true);
			toast.success('Database created');
		} catch {
			toast.error('Failed to create database');
		} finally {
			setCreating(false);
		}
	};

	// Handle database deletion
	const handleDelete = async (key: string, e: React.MouseEvent) => {
		e.stopPropagation();
		
		if (!confirm('Are you sure you want to delete this database? This action cannot be undone.')) {
			return;
		}

		try {
			setDeleting(key);
			await deleteDatabase(key);
			
			// If deleted database was current, switch to first available
			if (key === currentDbKey) {
				const remainingDbs = await listAllDatabases();
				if (remainingDbs.length > 0) {
					const firstDb = await loadDbFromStorage(remainingDbs[0].key);
					if (firstDb) {
						onDatabaseChange(firstDb, remainingDbs[0].key);
					}
				} else {
					// No databases left - create a new empty one
					const { db: newDb, key: newKey } = await createNamedDb('My Database');
					onDatabaseChange(newDb, newKey);
					onDatabaseCreated?.(newKey);
				}
			}
			
			await loadDatabases();
			toast.success('Database deleted');
		} catch {
			toast.error('Failed to delete database');
		} finally {
			setDeleting(null);
		}
	};

	// Handle database rename
	const handleRename = (key: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const db = databases.find(d => d.key === key);
		if (db) {
			setRenameDbKey(key);
			setRenameDbName(db.name);
			setShowRenameModal(true);
		}
	};

	const handleConfirmRename = async () => {
		if (!renameDbName.trim()) {
			toast.error('Please enter a database name');
			return;
		}

		try {
			if (renameDbKey) {
				setRenaming(renameDbKey);
				await setDbMetadata(renameDbKey, {
					name: renameDbName.trim(),
					updatedAt: Date.now(),
				});
			}
			
			await loadDatabases();
			setShowRenameModal(false);
			setRenameDbKey(null);
			setRenameDbName('');
			toast.success('Database renamed');
		} catch {
			toast.error('Failed to rename database');
		} finally {
			setRenaming(null);
		}
	};

	// Get current database display name
	const currentDb = databases.find(db => db.key === currentDbKey);
	const displayName = currentDb?.name || 'Loading...';

	if (loading) {
		return (
			<div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-border rounded-lg">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span>Loading databases...</span>
			</div>
		);
	}

	const hasOtherDatabases = databases.length > 1;

	return (
		<div className="relative">
			{/* Current Database Display */}
			<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
				<button
					onClick={() => setShowDbList(!showDbList)}
					className="flex items-center gap-2 flex-1 min-w-0 text-left"
					disabled={databases.length === 0}
				>
					<HardDrive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					<div className="flex-1 min-w-0">
						<span className="text-sm font-medium truncate block">{displayName}</span>
					</div>
					{hasOtherDatabases && (
						showDbList ? (
							<ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto" />
						) : (
							<ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto" />
						)
					)}
				</button>
				<div className="flex items-center gap-1 ml-2">
					<button
						onClick={(e) => handleRename(currentDbKey, e)}
						className="p-1 hover:bg-primary/20 rounded transition-colors"
						title="Rename database"
					>
						<Pencil className="w-4 h-4" />
					</button>
					<button
						onClick={() => setShowCreateModal(true)}
						className="p-1 hover:bg-primary/20 rounded transition-colors"
						title="Create new database"
					>
						<Plus className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Create Database Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">Create New Database</h3>
						<input
							type="text"
							value={newDbName}
							onChange={(e) => setNewDbName(e.target.value)}
							placeholder="Database name"
							className="w-full px-3 py-2 bg-background border border-border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleCreate();
								if (e.key === 'Escape') {
									setShowCreateModal(false);
									setNewDbName('');
								}
							}}
						/>
						<div className="flex gap-2 justify-end">
							<button
								onClick={() => {
									setShowCreateModal(false);
									setNewDbName('');
								}}
								className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleCreate}
								disabled={creating || !newDbName.trim()}
								className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{creating ? (
									<>
										<Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
										Creating...
									</>
								) : (
									'Create'
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Rename Database Modal */}
			{showRenameModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">Rename Database</h3>
						<input
							type="text"
							value={renameDbName}
							onChange={(e) => setRenameDbName(e.target.value)}
							placeholder="Database name"
							className="w-full px-3 py-2 bg-background border border-border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleConfirmRename();
								if (e.key === 'Escape') {
									setShowRenameModal(false);
									setRenameDbKey(null);
									setRenameDbName('');
								}
							}}
						/>
						<div className="flex gap-2 justify-end">
							<button
								onClick={() => {
									setShowRenameModal(false);
									setRenameDbKey(null);
									setRenameDbName('');
								}}
								className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmRename}
								disabled={renaming !== null || !renameDbName.trim()}
								className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{renaming ? (
									<>
										<Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
										Renaming...
									</>
								) : (
									'Rename'
								)}
							</button>
						</div>
					</div>
				</div>
			)}


			{/* Other Databases List (always show if there are other databases) */}
			{showDbList && hasOtherDatabases && (
				<div className="mt-2 space-y-1 max-h-60 overflow-y-auto border border-border rounded-lg p-2 bg-background">
					{databases
						.filter(db => db.key !== currentDbKey)
						.map((db) => (
							<div
								key={db.key}
								className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted border border-transparent"
								onClick={() => {
									handleSelect(db.key);
									setShowDbList(false);
								}}
							>
								<div className="flex items-center gap-2 flex-1 min-w-0">
									<HardDrive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<span className="text-sm truncate">{db.name}</span>
								</div>
								<div className="flex items-center gap-1">
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleRename(db.key, e);
										}}
										disabled={renaming === db.key}
										className="p-1 hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
										title="Rename database"
									>
										{renaming === db.key ? (
											<Loader2 className="w-4 h-4 animate-spin text-primary" />
										) : (
											<Pencil className="w-4 h-4 text-muted-foreground" />
										)}
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDelete(db.key, e);
										}}
										disabled={deleting === db.key}
										className="p-1 hover:bg-destructive/20 rounded transition-colors disabled:opacity-50"
										title="Delete database"
									>
										{deleting === db.key ? (
											<Loader2 className="w-4 h-4 animate-spin text-destructive" />
										) : (
											<Trash2 className="w-4 h-4 text-destructive" />
										)}
									</button>
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}

