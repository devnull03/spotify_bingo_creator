<script lang="ts">
	import BingoBoard from './BingoBoard.svelte';
	import {
		generateSpotifyBingo,
		resetBoard,
		exportBingoAsCSV,
		exportBingoAsJSON
	} from '$lib/utils/bingo';
	import { downloadBingoAsImage, openPrintableVersion } from '$lib/utils/bingo-export';
	import type { BingoBoard as BingoBoardType } from '$lib/utils/bingo';
	import type { PlaylistData } from '$lib/interfaces/spotify.interface';

	interface Props {
		playlist: PlaylistData;
	}

	const { playlist }: Props = $props();

	let board: BingoBoardType | null = $state(null);
	let boardSize: number = $state(5);
	let error: string | null = $state(null);
	let exporting = $state(false);

	function generateBoard() {
		error = null;
		try {
			board = generateSpotifyBingo(playlist.songs, boardSize);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate board';
		}
	}

	function handleReset() {
		if (board) {
			resetBoard(board);
			// Trigger reactivity
			board = board;
		}
	}

	function handleExportCSV() {
		if (!board) return;
		const csv = exportBingoAsCSV(board);
		downloadFile(csv, 'spotify-bingo.csv', 'text/csv');
	}

	function handleExportJSON() {
		if (!board) return;
		const json = exportBingoAsJSON(board);
		downloadFile(json, 'spotify-bingo.json', 'application/json');
	}

	async function handleExportImage() {
		if (!board) return;
		exporting = true;
		try {
			await downloadBingoAsImage(board, 'spotify-bingo.png');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to export image';
		} finally {
			exporting = false;
		}
	}

	function handlePrint() {
		if (!board) return;
		openPrintableVersion(board);
	}

	function downloadFile(content: string, filename: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="bingo-generator">
	<div class="generator-controls bg-gray-800 rounded-lg p-6 mb-8">
		<h2 class="text-2xl font-bold mb-4">Bingo Board Generator</h2>

		<div class="controls-grid">
			<div class="control-group">
				<label for="size" class="block text-sm font-semibold mb-2">Board Size:</label>
				<select bind:value={boardSize} id="size" class="board-size-select">
					<option value={3}>3×3 (9 songs)</option>
					<option value={4}>4×4 (16 songs)</option>
					<option value={5}>5×5 (25 songs)</option>
				</select>
			</div>

			<div class="control-group">
				<button onclick={generateBoard} disabled={board !== null} class="btn btn-primary">
					Generate Board
				</button>
			</div>
		</div>

		{#if error}
			<div class="alert alert-error mt-4">
				{error}
			</div>
		{/if}

		{#if board}
			<div class="board-info mt-4 p-4 bg-gray-900 rounded">
				<p class="text-sm text-gray-300">
					Board ID: <code class="text-xs">{board.id}</code>
				</p>
			</div>
		{/if}
	</div>

	{#if board}
		<div class="board-container">
			<BingoBoard {board} />
		</div>

		<div class="board-actions mt-8 flex flex-wrap gap-3 justify-center">
			<button onclick={handleReset} class="btn btn-secondary"> ↻ Reset Board </button>
			<button onclick={generateBoard} class="btn btn-secondary"> ⚡ Generate New </button>
			<button onclick={handlePrint} class="btn btn-secondary"> 🖨️ Print </button>
			<button onclick={handleExportImage} disabled={exporting} class="btn btn-secondary">
				{exporting ? 'Exporting...' : '🖼️ Download PNG'}
			</button>
			<button onclick={handleExportCSV} class="btn btn-secondary"> 📊 Export CSV </button>
			<button onclick={handleExportJSON} class="btn btn-secondary"> 📄 Export JSON </button>
		</div>
	{/if}
</div>

<style>
	.bingo-generator {
		width: 100%;
	}

	.generator-controls {
		border-left: 4px solid #10b981;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
	}

	.control-group label {
		color: #e5e7eb;
	}

	.board-size-select {
		padding: 8px 12px;
		background-color: #1f2937;
		color: white;
		border: 2px solid #374151;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.board-size-select:hover {
		border-color: #4b5563;
	}

	.board-size-select:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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

	.btn-secondary {
		background-color: #6b7280;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #4b5563;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
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

	.board-container {
		background-color: #1a1a1a;
		padding: 24px;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	}

	.board-actions {
		padding: 0 8px;
	}
</style>
