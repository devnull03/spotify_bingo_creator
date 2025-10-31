<script lang="ts">
	import { toggleCell, hasWon, getCompletedLines } from '$lib/utils/bingo';
	import type { BingoBoard, BingoCell } from '$lib/utils/bingo';

	interface Props {
		board: BingoBoard;
	}

	const { board }: Props = $props();

	let completedLines = $derived(getCompletedLines(board));
	let won = $derived(hasWon(board));

	function handleCellClick(row: number, col: number) {
		toggleCell(board, row, col);
	}

	function isInCompletedLine(row: number, col: number): boolean {
		// Check if this cell is in a completed row
		if (completedLines.includes(`row-${row}`)) return true;

		// Check if this cell is in a completed column
		if (completedLines.includes(`col-${col}`)) return true;

		// Check if this cell is in a completed diagonal
		if (row === col && completedLines.includes('diag-0')) return true;
		if (row + col === board.size - 1 && completedLines.includes('diag-1')) return true;

		return false;
	}

	function isCenter(row: number, col: number): boolean {
		return board.size === 5 && row === 2 && col === 2;
	}
</script>

<div class="bingo-board-container">
	{#if won}
		<div class="win-banner">
			<div class="win-content">
				<span class="win-emoji">🎉</span>
				<h2>BINGO! You won! 🎶</h2>
				<span class="win-emoji">🎉</span>
			</div>
		</div>
	{/if}

	<div
		class="grid grid-cols-5 gap-1 p-4 bg-gray-900 rounded-lg"
		style="max-width: 500px; margin: 0 auto;"
	>
		{#each board.cells as row, rowIndex}
			{#each row as cell, colIndex}
				<button
					onclick={() => handleCellClick(rowIndex, colIndex)}
					class="cell"
					class:marked={cell.marked}
					class:center={isCenter(rowIndex, colIndex)}
					class:completed={isInCompletedLine(rowIndex, colIndex)}
					title={`${cell.song.name} - ${cell.song.artist}`}
				>
					<div class="cell-inner">
						<div class="song-name">{cell.song.name}</div>
						<div class="song-artist">{cell.song.artist}</div>
						{#if cell.marked && !isCenter(rowIndex, colIndex)}
							<div class="checkmark">✓</div>
						{/if}
						{#if isCenter(rowIndex, colIndex)}
							<div class="free-space">FREE</div>
						{/if}
					</div>
				</button>
			{/each}
		{/each}
	</div>

	<div class="board-stats mt-6 text-center text-sm text-gray-400">
		<p>Click cells to mark them. Complete any row, column, or diagonal to win!</p>
		{#if completedLines.length > 0}
			<p class="text-green-400 font-semibold mt-2">
				{completedLines.length} line{completedLines.length === 1 ? '' : 's'} completed!
			</p>
		{/if}
	</div>
</div>

<style>
	.bingo-board-container {
		width: 100%;
	}

	.win-banner {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		padding: 20px;
		border-radius: 12px;
		margin-bottom: 20px;
		animation: slideDown 0.5s ease-out;
	}

	.win-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15px;
		color: white;
	}

	.win-emoji {
		font-size: 2.5rem;
		animation: bounce 0.6s ease-in-out infinite;
	}

	.win-content h2 {
		margin: 0;
		font-size: 1.875rem;
		font-weight: 700;
	}

	.win-emoji:nth-child(3) {
		animation-delay: 0.1s;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.cell {
		aspect-ratio: 1;
		background-color: #1f2937;
		border: 2px solid #374151;
		border-radius: 8px;
		padding: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		color: white;
		font-size: 0.75rem;
		overflow: hidden;
		font-weight: 500;
	}

	.cell:hover {
		background-color: #374151;
		border-color: #4b5563;
		transform: scale(1.05);
	}

	.cell.marked {
		background-color: #10b981;
		border-color: #059669;
		color: white;
	}

	.cell.marked:hover {
		background-color: #059669;
		transform: scale(1.08);
	}

	.cell.center {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		border-color: #b45309;
		font-weight: 700;
	}

	.cell.center:hover {
		transform: scale(1.05);
		filter: brightness(1.1);
	}

	.cell.completed {
		box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
	}

	.cell-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		width: 100%;
		height: 100%;
		text-align: center;
		position: relative;
	}

	.song-name {
		line-height: 1.2;
		font-weight: 600;
		font-size: 0.7rem;
	}

	.song-artist {
		line-height: 1;
		font-size: 0.6rem;
		opacity: 0.8;
	}

	.checkmark {
		position: absolute;
		top: 2px;
		right: 2px;
		font-size: 1.2rem;
		font-weight: bold;
	}

	.free-space {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.board-stats {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
