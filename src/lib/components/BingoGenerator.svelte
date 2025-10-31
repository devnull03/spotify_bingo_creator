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
    <div class="generator-controls p-6 mb-8">
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
            <div class="board-info mt-4 p-4 border border-black">
                <p class="text-sm">
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
        border: 1px solid #000;
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
        color: #000;
    }

    .board-size-select {
        padding: 8px 12px;
        background-color: #fff;
        color: #000;
        border: 1px solid #000;
        border-radius: 0;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .board-size-select:hover {}

    .board-size-select:focus {
        outline: none;
        border-color: #000;
    }

    .btn {
        padding: 10px 16px;
        border: 1px solid #000;
        border-radius: 0;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        background: #fff;
        color: #000;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {}

    .btn-primary:hover:not(:disabled) {}

    .btn-secondary {}

    .btn-secondary:hover:not(:disabled) {}

    .alert {
        padding: 12px 16px;
        border: 1px solid #000;
        border-radius: 0;
        background: #fff;
        color: #000;
    }

    .alert-error {}

    .board-container {
        background-color: #fff;
        padding: 24px;
        border: 1px solid #000;
        border-radius: 0;
        box-shadow: none;
    }

	.board-actions {
		padding: 0 8px;
	}
</style>
