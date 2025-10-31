import type { PlaylistSongInfo } from '$lib/interfaces/spotify.interface';

export interface BingoCell {
	id: string;
	song: PlaylistSongInfo;
	marked: boolean;
}

export interface BingoBoard {
	id: string;
	cells: BingoCell[][];
	size: number;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Generate a Spotify bingo board (5x5 by default)
 * @param songs Array of songs to use for bingo
 * @param size Board size (default: 5 for 5x5 board)
 * @param includeFreeSpace Whether to include a free space in the center (5x5 only)
 * @returns BingoBoard object with cells
 */
export function generateSpotifyBingo(
	songs: PlaylistSongInfo[],
	size: number = 5,
	includeFreeSpace: boolean = true
): BingoBoard {
	const cellCount = size * size - (includeFreeSpace && size === 5 ? 1 : 0);

	if (songs.length < cellCount) {
		throw new Error(
			`Need at least ${cellCount} songs to generate a ${size}x${size} bingo board. Got ${songs.length}.`
		);
	}

	// Shuffle and select random songs
	const shuffled = shuffleArray(songs);
	const selectedSongs = shuffled.slice(0, cellCount);

	// Create 2D grid
	const cells: BingoCell[][] = [];
	let songIndex = 0;

	for (let row = 0; row < size; row++) {
		cells[row] = [];
		for (let col = 0; col < size; col++) {
			// Skip center cell if it's a 5x5 and free space is included
			if (size === 5 && includeFreeSpace && row === 2 && col === 2) {
				cells[row][col] = {
					id: `${row}-${col}`,
					song: { id: 'free', name: 'FREE', artist: 'SPACE', artists: [], uri: '', link: '', image: null, durationMs: 0 } as PlaylistSongInfo,
					marked: true
				};
			} else {
				cells[row][col] = {
					id: `${row}-${col}`,
					song: selectedSongs[songIndex++],
					marked: false
				};
			}
		}
	}

	return {
		id: generateBoardId(),
		cells,
		size
	};
}

/**
 * Generate multiple unique bingo boards
 * @param songs Array of songs to use
 * @param count Number of boards to generate
 * @param size Board size
 * @param includeFreeSpace Whether to include free space
 * @returns Array of BingoBoard objects
 */
export function generateMultipleBoards(
	songs: PlaylistSongInfo[],
	count: number,
	size: number = 5,
	includeFreeSpace: boolean = true
): BingoBoard[] {
	const boards: BingoBoard[] = [];

	for (let i = 0; i < count; i++) {
		boards.push(generateSpotifyBingo(songs, size, includeFreeSpace));
	}

	return boards;
}

/**
 * Generate a unique board ID
 */
export function generateBoardId(): string {
	return `bingo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Toggle a cell as marked/unmarked
 */
export function toggleCell(board: BingoBoard, row: number, col: number): void {
	if (row < 0 || row >= board.size || col < 0 || col >= board.size) {
		throw new Error(`Invalid cell position: (${row}, ${col})`);
	}
	board.cells[row][col].marked = !board.cells[row][col].marked;
}

/**
 * Check if a row is complete (all cells marked)
 */
export function isRowComplete(board: BingoBoard, row: number): boolean {
	return board.cells[row].every((cell) => cell.marked);
}

/**
 * Check if a column is complete (all cells marked)
 */
export function isColumnComplete(board: BingoBoard, col: number): boolean {
	return board.cells.every((row) => row[col].marked);
}

/**
 * Check if a diagonal is complete
 * @param board The bingo board
 * @param diagonal 0 for top-left to bottom-right, 1 for top-right to bottom-left
 */
export function isDiagonalComplete(board: BingoBoard, diagonal: number): boolean {
	if (diagonal === 0) {
		// Top-left to bottom-right
		return board.cells.every((row, i) => row[i].marked);
	} else if (diagonal === 1) {
		// Top-right to bottom-left
		return board.cells.every((row, i) => row[board.size - 1 - i].marked);
	}
	return false;
}

/**
 * Check if the entire board is marked (blackout bingo)
 */
export function isBlackout(board: BingoBoard): boolean {
	return board.cells.every((row) => row.every((cell) => cell.marked));
}

/**
 * Check if the player has won
 * Winning conditions: row, column, diagonal, or X pattern
 */
export function hasWon(board: BingoBoard): boolean {
	// Check rows
	for (let i = 0; i < board.size; i++) {
		if (isRowComplete(board, i)) return true;
	}

	// Check columns
	for (let i = 0; i < board.size; i++) {
		if (isColumnComplete(board, i)) return true;
	}

	// Check diagonals
	if (isDiagonalComplete(board, 0)) return true;
	if (isDiagonalComplete(board, 1)) return true;

	return false;
}

/**
 * Get all completed lines (for displaying winning pattern)
 */
export function getCompletedLines(board: BingoBoard): string[] {
	const lines: string[] = [];

	// Check rows
	for (let i = 0; i < board.size; i++) {
		if (isRowComplete(board, i)) {
			lines.push(`row-${i}`);
		}
	}

	// Check columns
	for (let i = 0; i < board.size; i++) {
		if (isColumnComplete(board, i)) {
			lines.push(`col-${i}`);
		}
	}

	// Check diagonals
	if (isDiagonalComplete(board, 0)) lines.push('diag-0');
	if (isDiagonalComplete(board, 1)) lines.push('diag-1');

	return lines;
}

/**
 * Export board as CSV
 */
export function exportBingoAsCSV(board: BingoBoard): string {
	const rows = board.cells.map((row) =>
		row.map((cell) => `"${cell.song.name} - ${cell.song.artist}"`).join(',')
	);
	return rows.join('\n');
}

/**
 * Export board as JSON
 */
export function exportBingoAsJSON(board: BingoBoard): string {
	return JSON.stringify(board, null, 2);
}

/**
 * Reset all marks on the board (except free space on 5x5)
 */
export function resetBoard(board: BingoBoard): void {
	for (let row = 0; row < board.size; row++) {
		for (let col = 0; col < board.size; col++) {
			// Keep the center free space marked on 5x5 boards
			if (board.size === 5 && row === 2 && col === 2) {
				board.cells[row][col].marked = true;
			} else {
				board.cells[row][col].marked = false;
			}
		}
	}
}
