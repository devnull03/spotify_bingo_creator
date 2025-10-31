<script lang="ts">
	import SimpleBingoBoard from './SimpleBingoBoard.svelte';
	import { generateMultipleBoards } from '$lib/utils/bingo';
	import { exportPDF, exportZIP } from '../../routes/pdf.remote.js';
	import type { BingoBoard } from '$lib/utils/bingo';
	import type { PlaylistData } from '$lib/interfaces/spotify.interface';

	interface Props {
		playlist: PlaylistData;
	}

	const { playlist }: Props = $props();

	let boards: BingoBoard[] = $state([]);
	let boardCount: number = $state(1);
	let boardSize: number = $state(5);
	let includeFreeSpace: boolean = $state(true);
	let error: string | null = $state(null);
	let isExporting: boolean = $state(false);

	function generateBoards() {
		error = null;
		try {
			boards = generateMultipleBoards(playlist.songs, boardCount, boardSize, includeFreeSpace);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate boards';
			boards = [];
		}
	}

	/**
	 * Download a base64 encoded blob with the given filename
	 */
	function downloadBase64Blob(base64: string, filename: string) {
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		const blob = new Blob([bytes]);
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	async function handleExportPDF() {
		if (boards.length === 0) return;

		isExporting = true;
		try {
			const result = await exportPDF({
				playlistLink: playlist.playlistLink,
				boardCount,
				boardSize,
				includeFreeSpace
			});
			downloadBase64Blob(result.buffer, result.filename);
		} catch (err) {
			error = `Failed to export PDF: ${err instanceof Error ? err.message : 'Unknown error'}`;
		} finally {
			isExporting = false;
		}
	}

	async function handleExportZip() {
		if (boards.length === 0) return;

		isExporting = true;
		try {
			const result = await exportZIP({
				playlistLink: playlist.playlistLink,
				boardCount,
				boardSize,
				includeFreeSpace
			});
			downloadBase64Blob(result.buffer, result.filename);
		} catch (err) {
			error = `Failed to export ZIP: ${err instanceof Error ? err.message : 'Unknown error'}`;
		} finally {
			isExporting = false;
		}
	}

	function handlePrint() {
		window.print();
	}

	function handleReset() {
		boards = [];
		error = null;
	}
</script>

<div class="bingo-printer">
	<div class="printer-controls bg-gray-800 rounded-lg p-6 mb-8">
		<h2 class="text-2xl font-bold mb-4">Print Bingo Boards</h2>

		<div class="controls-grid">
			<div class="control-group">
				<label for="count" class="block text-sm font-semibold mb-2">How many boards?</label>
				<input
					type="number"
					id="count"
					bind:value={boardCount}
					min="1"
					max="50"
					class="input-field"
				/>
			</div>

			<div class="control-group">
				<label for="size" class="block text-sm font-semibold mb-2">Board Size:</label>
				<select bind:value={boardSize} id="size" class="input-field">
					<option value={3}>3×3</option>
					<option value={4}>4×4</option>
					<option value={5}>5×5</option>
				</select>
			</div>

			<div class="control-group flex items-end">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={includeFreeSpace}
						disabled={boardSize !== 5}
						class="w-5 h-5"
					/>
					<span class="text-sm font-semibold">Free Space in Middle (5×5 only)</span>
				</label>
			</div>
		</div>

		<div class="mt-6 flex gap-3 flex-wrap">
			<button onclick={generateBoards} class="btn btn-primary">
				Generate {boardCount} Board{boardCount !== 1 ? 's' : ''}
			</button>
			{#if boards.length > 0}
				<button onclick={handleExportPDF} disabled={isExporting} class="btn btn-success">
					{isExporting ? '📥 Exporting...' : '📄 Export PDF (All Languages)'}
				</button>
				{#if boardCount > 1}
					<button onclick={handleExportZip} disabled={isExporting} class="btn btn-success">
						{isExporting ? '📥 Exporting...' : '📦 Export ZIP (PNG)'}
					</button>
				{/if}
				<button onclick={handlePrint} class="btn btn-secondary"> 🖨️ Print Boards </button>
				<button onclick={handleReset} class="btn btn-secondary"> Clear </button>
			{/if}
		</div>

		{#if error}
			<div class="alert alert-error mt-4">
				{error}
			</div>
		{/if}

		{#if boards.length > 0}
			<div class="alert alert-info mt-4">
				Generated {boards.length} board{boards.length !== 1 ? 's' : ''} with {boardSize}×{boardSize}
				grid
				{#if includeFreeSpace && boardSize === 5}
					(with free space in center)
				{/if}
			</div>
		{/if}
	</div>

	{#if boards.length > 0}
		<div class="boards-container">
			<div class="print-instruction">
				<p class="text-xs text-gray-500 mb-4">
					💡 Tip: Use Ctrl+P (or Cmd+P) to print to PDF or paper
				</p>
			</div>

			{#each boards as board, index (board.id)}
				<div class="board-page">
					<div class="page-header text-center mb-4 no-print">
						<p class="text-sm font-semibold">Board {index + 1} of {boards.length}</p>
					</div>
					<SimpleBingoBoard {board} showFreeSpace={includeFreeSpace} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bingo-printer {
		width: 100%;
	}

	.printer-controls {
		border-left: 4px solid #10b981;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 16px;
		margin-bottom: 16px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
	}

	.control-group label {
		color: #e5e7eb;
	}

	.input-field {
		padding: 8px 12px;
		background-color: #1f2937;
		color: white;
		border: 2px solid #374151;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.input-field:hover {
		border-color: #4b5563;
	}

	.input-field:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.input-field:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn {
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.9rem;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: #10b981;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.btn-success {
		background-color: #3b82f6;
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		background-color: #2563eb;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.btn-secondary {
		background-color: #6b7280;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #4b5563;
		transform: translateY(-2px);
	}

	.alert {
		padding: 12px 16px;
		border-radius: 6px;
	}

	.alert-error {
		background-color: #7f1d1d;
		color: #fca5a5;
		border-left: 4px solid #dc2626;
	}

	.alert-info {
		background-color: #1e3a5f;
		color: #bfdbfe;
		border-left: 4px solid #3b82f6;
	}

	.boards-container {
		background: white;
		padding: 20px;
		border-radius: 8px;
		margin-top: 20px;
	}

	.print-instruction {
		text-align: center;
		margin-bottom: 20px;
	}

	.board-page {
		page-break-inside: avoid;
		margin-bottom: 40px;
	}

	.page-header {
		page-break-inside: avoid;
	}

	.no-print {
		display: none !important;
	}

	@media print {
		.bingo-printer {
			background: white;
		}

		.printer-controls {
			display: none;
		}

		.print-instruction {
			display: none;
		}

		.no-print {
			display: none !important;
		}

		.boards-container {
			background: white;
			padding: 0;
		}

		.board-page {
			page-break-inside: avoid;
			margin-bottom: 0.5in;
			page-break-after: always;
		}

		.board-page:last-child {
			page-break-after: auto;
		}
	}
</style>
