<script lang="ts">
	import type { BingoBoard } from '$lib/utils/bingo';

	interface Props {
		board: BingoBoard;
		showFreeSpace?: boolean;
	}

	const { board, showFreeSpace = true }: Props = $props();

	function isCenter(row: number, col: number): boolean {
		return board.size === 5 && row === 2 && col === 2;
	}
</script>

<div class="simple-board">
	<table class="bingo-table">
		<tbody>
			{#each board.cells as row, rowIndex}
				<tr>
					{#each row as cell, colIndex}
						<td class="bingo-cell">
							<div class="cell-content">
								{#if isCenter(rowIndex, colIndex) && showFreeSpace}
									<div class="free-space">FREE</div>
								{:else}
									<div class="song-text">{cell.song.name}</div>
									<div class="artist-text">{cell.song.artist}</div>
								{/if}
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.simple-board {
		display: flex;
		justify-content: center;
		overflow-x: auto;
		width: 100%;
	}

	.bingo-table {
		border-collapse: collapse;
		page-break-inside: avoid;
	}

	.bingo-cell {
		border: 2px solid black;
		padding: 12px;
		width: 100px;
		height: 100px;
		text-align: center;
		vertical-align: middle;
		background: white;
		color: black;
		font-size: 11px;
		font-weight: 500;
		line-height: 1.2;
		word-break: break-word;
	}

	.cell-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		gap: 4px;
	}

	.song-text {
		font-weight: 600;
		font-size: 12px;
	}

	.artist-text {
		font-size: 10px;
		color: #333;
	}

	.free-space {
		font-weight: 700;
		font-size: 16px;
		color: #000;
		letter-spacing: 2px;
	}

	@media print {
		.simple-board {
			page-break-inside: avoid;
		}

		.bingo-table {
			width: 100%;
			margin: 20px 0;
		}

		.bingo-cell {
			border: 1px solid black;
			padding: 10px;
		}
	}
</style>
