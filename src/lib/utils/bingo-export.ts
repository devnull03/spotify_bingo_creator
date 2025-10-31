import type { BingoBoard } from './bingo';

/**
 * Generate a PNG image of the bingo board
 * Requires HTML2Canvas library (optional enhancement)
 */
export async function downloadBingoAsImage(board: BingoBoard, filename: string = 'spotify-bingo.png') {
	try {
		// This would require html2canvas: https://html2canvas.hertzen.com/
		// For now, we'll provide a simple implementation using canvas

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) throw new Error('Could not get canvas context');

		const cellSize = 100;
		const padding = 20;
		const size = board.size;

		canvas.width = size * cellSize + padding * 2;
		canvas.height = size * cellSize + padding * 2;

		// Background
		ctx.fillStyle = '#0f172a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw cells
		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				const cell = board.cells[row][col];
				const x = padding + col * cellSize;
				const y = padding + row * cellSize;

				// Cell background
				ctx.fillStyle = cell.marked ? '#10b981' : '#1f2937';
				ctx.fillRect(x, y, cellSize, cellSize);

				// Cell border
				ctx.strokeStyle = '#374151';
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, cellSize, cellSize);

				// Text
				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 12px Arial';
				ctx.textAlign = 'center';

				const song = cell.song;
				const textY = y + cellSize / 2;

				ctx.fillText(song.name.substring(0, 12), x + cellSize / 2, textY - 10);
				ctx.font = '10px Arial';
				ctx.fillText(song.artist.substring(0, 15), x + cellSize / 2, textY + 10);

				// Checkmark
				if (cell.marked) {
					ctx.fillStyle = '#ffffff';
					ctx.font = 'bold 20px Arial';
					ctx.fillText('✓', x + cellSize / 2, y + cellSize / 2 + 5);
				}
			}
		}

		// Download
		canvas.toBlob((blob) => {
			if (!blob) throw new Error('Could not create blob');
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		});
	} catch (error) {
		console.error('Error downloading bingo image:', error);
		throw error;
	}
}

/**
 * Share bingo board data as text (for social media, messages, etc.)
 */
export function generateShareableText(board: BingoBoard): string {
	const boardText = board.cells
		.map((row) => row.map((cell) => (cell.marked ? '✓' : '□')).join(' '))
		.join('\n');

	return `🎵 Spotify Bingo Board 🎵\n\n${boardText}\n\nGenerated with Spotify Bingo Creator`;
}

/**
 * Generate a printable HTML version of the bingo board
 */
export function generatePrintableHTML(board: BingoBoard): string {
	const rows = board.cells
		.map((row) =>
			`<tr>${row.map((cell) => `<td class="bingo-cell">${cell.song.name}<br>${cell.song.artist}</td>`).join('')}</tr>`
		)
		.join('');

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Spotify Bingo Board</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			background: #0f172a;
			color: white;
			padding: 20px;
		}
		table {
			border-collapse: collapse;
			margin: 20px auto;
		}
		.bingo-cell {
			width: 100px;
			height: 100px;
			border: 2px solid #374151;
			padding: 8px;
			text-align: center;
			vertical-align: middle;
			background: #1f2937;
			font-size: 12px;
			font-weight: bold;
			word-wrap: break-word;
		}
		h1 {
			text-align: center;
		}
		@media print {
			body {
				background: white;
			}
			.bingo-cell {
				background: white;
				color: black;
				border: 2px solid black;
			}
		}
	</style>
</head>
<body>
	<h1>🎵 Spotify Bingo Board 🎵</h1>
	<table>
		${rows}
	</table>
</body>
</html>
	`;
}

/**
 * Open printable version in new window
 */
export function openPrintableVersion(board: BingoBoard): void {
	const html = generatePrintableHTML(board);
	const newWindow = window.open();
	if (newWindow) {
		newWindow.document.write(html);
		newWindow.document.close();
	}
}
