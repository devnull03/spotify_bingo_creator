import { createCanvas } from '@napi-rs/canvas';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import type { BingoBoard } from '$lib/utils/bingo';

/**
 * Generate a PDF-like image for a bingo board using Canvas
 * This properly supports international characters including Japanese
 */
export async function generateBoardImage(
	board: BingoBoard,
	boardNumber: number,
	showFreeSpace: boolean = true
): Promise<Buffer> {
	const gridSize = board.cells.length;

	// A4 dimensions at 150 DPI: 1240 x 1754 pixels
	const width = 1240;
	const height = 1754;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	// White background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);

	// Draw title
	ctx.fillStyle = '#000000';
	ctx.font = 'bold 48px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(`Bingo Board #${boardNumber}`, width / 2, 100);

	// Calculate grid dimensions
	const gridMargin = 120;
	const availableWidth = width - (gridMargin * 2);
	const cellSize = availableWidth / gridSize;
	const gridHeight = cellSize * gridSize;
	const gridTop = (height - gridHeight) / 2 + 60;

	// Draw grid
	ctx.strokeStyle = '#000000';
	ctx.lineWidth = 3;

	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			const x = gridMargin + (j * cellSize);
			const y = gridTop + (i * cellSize);
			const cell = board.cells[i][j];

			// Draw cell border
			ctx.strokeRect(x, y, cellSize, cellSize);

			// Check if it's the free space
			const isFreeSpace = showFreeSpace && gridSize === 5 && i === 2 && j === 2;

			// Draw text
			ctx.fillStyle = '#000000';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			if (isFreeSpace) {
				ctx.font = `bold ${cellSize * 0.2}px sans-serif`;
				ctx.fillText('FREE', x + cellSize / 2, y + cellSize / 2);
			} else {
				// Dynamically size font based on text length and cell size
				const text = cell.song.name;
				let fontSize = cellSize * 0.12;

				// Reduce font size for longer text
				if (text.length > 30) fontSize = cellSize * 0.09;
				if (text.length > 50) fontSize = cellSize * 0.07;

				ctx.font = `${fontSize}px sans-serif`;

				// Word wrap for long text
				const words = text.split(' ');
				const lines: string[] = [];
				let currentLine = '';
				const maxWidth = cellSize * 0.85;

				for (const word of words) {
					const testLine = currentLine + (currentLine ? ' ' : '') + word;
					const metrics = ctx.measureText(testLine);

					if (metrics.width > maxWidth && currentLine) {
						lines.push(currentLine);
						currentLine = word;
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine) lines.push(currentLine);

				// Limit to 4 lines
				const displayLines = lines.slice(0, 4);
				const lineHeight = fontSize * 1.2;
				const totalHeight = displayLines.length * lineHeight;
				let textY = y + cellSize / 2 - totalHeight / 2 + lineHeight / 2;

				for (const line of displayLines) {
					ctx.fillText(line, x + cellSize / 2, textY);
					textY += lineHeight;
				}

				// Add ellipsis if text was truncated
				if (lines.length > 4) {
					ctx.fillText('...', x + cellSize / 2, textY - lineHeight);
				}
			}
		}
	}

	// Convert to PNG buffer
	return canvas.toBuffer('image/png');
}

/**
 * Generate all bingo boards as a ZIP of PNG images
 */
export async function generateBingoBoardsImagesZip(
	boards: BingoBoard[],
	showFreeSpace: boolean = true
): Promise<Buffer> {
	const zip = new JSZip();

	// Generate individual images for each board
	for (let i = 0; i < boards.length; i++) {
		const board = boards[i];
		const imageBuffer = await generateBoardImage(board, i + 1, showFreeSpace);

		// Add image to zip with numbered filename
		zip.file(`bingo_board_${String(i + 1).padStart(3, '0')}.png`, imageBuffer);
	}

	// Generate the zip file
	return zip.generateAsync({ type: 'nodebuffer' });
}

/**
 * Generate all bingo boards as a single PDF with proper Unicode support
 * Uses Canvas for rendering, then embeds images into PDF
 */
export async function generateBingoBoardsCanvasPDF(
	boards: BingoBoard[],
	showFreeSpace: boolean = true
): Promise<Buffer> {
	// Create a new PDF document
	const pdfDoc = await PDFDocument.create();

	// Generate and add each board as a page
	for (let i = 0; i < boards.length; i++) {
		const board = boards[i];
		const imageBuffer = await generateBoardImage(board, i + 1, showFreeSpace);

		// Embed the PNG image
		const image = await pdfDoc.embedPng(imageBuffer);

		// A4 size in points (595.28 x 841.89)
		const page = pdfDoc.addPage([595.28, 841.89]);

		// Get the dimensions
		const { width, height } = page.getSize();

		// Draw the image to fill the page
		page.drawImage(image, {
			x: 0,
			y: 0,
			width: width,
			height: height
		});
	}

	// Serialize the PDF to bytes
	const pdfBytes = await pdfDoc.save();
	return Buffer.from(pdfBytes);
}
