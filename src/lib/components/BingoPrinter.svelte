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
    <div class="printer-controls p-6 mb-8">
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
                <button onclick={handleExportPDF} disabled={isExporting} class="btn btn-primary">
					{isExporting ? '📥 Exporting...' : '📄 Export PDF (All Languages)'}
				</button>
				{#if boardCount > 1}
                    <button onclick={handleExportZip} disabled={isExporting} class="btn btn-primary">
						{isExporting ? '📥 Exporting...' : '📦 Export ZIP (PNG)'}
					</button>
				{/if}
				<button onclick={handlePrint} class="btn btn-secondary"> 🖨️ Print Boards </button>
				<button onclick={handleReset} class="btn btn-secondary"> Clear </button>
			{/if}
		</div>

        {#if error}
            <div class="alert mt-4">
				{error}
			</div>
		{/if}

        {#if boards.length > 0}
            <div class="alert mt-4">
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
                <p class="text-xs mb-4">
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
        border: 1px solid black;
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
        color: #000;
    }

    .input-field {
        padding: 8px 12px;
        background-color: #fff;
        color: #000;
        border: 1px solid #000;
        border-radius: 0;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .input-field:hover {}

    .input-field:focus {
        outline: none;
        border-color: #000;
    }

	.input-field:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

    .btn-success {}

    .btn-success:hover:not(:disabled) {}

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

    .alert-info {}

    .boards-container {
        background: white;
        padding: 20px;
        border: 1px solid #000;
        border-radius: 0;
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
