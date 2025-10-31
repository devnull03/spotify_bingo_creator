import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'node:path';
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
    // Ensure Noto Sans JP is available to the canvas text renderer
    // Safe to call multiple times; duplicate registrations are ignored
    try {
        GlobalFonts.registerFromPath(
            path.join(process.cwd(), 'NotoSansJP-VariableFont_wght.ttf'),
            'NotoSansJP'
        );
    } catch {
        // Ignore if registration fails; canvas may fallback to system fonts
    }
	const gridSize = board.cells.length;

	// A4 dimensions at 150 DPI: 1240 x 1754 pixels
	const width = 1240;
	const height = 1754;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	// White background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);

	// Title removed per request

	// Calculate grid dimensions
	const gridMargin = 60;
	const availableWidth = width - (gridMargin * 2);
	const cellSize = availableWidth / gridSize;
	const gridHeight = cellSize * gridSize;
	const gridTop = (height - gridHeight) / 2;

	// Helpers for wrapping and fitting text within a box
	function measureWrappedLines(text: string, fontSize: number, maxWidth: number): string[] {
		const hasSpaces = /\s/.test(text);
		const tokens = hasSpaces ? text.split(/\s+/) : Array.from(text);
		const lines: string[] = [];
		let current = '';
		ctx.font = `${fontSize}px "NotoSansJP", sans-serif`;
		for (const token of tokens) {
			const test = current ? (hasSpaces ? `${current} ${token}` : `${current}${token}`) : token;
			if (ctx.measureText(test).width <= maxWidth) {
				current = test;
			} else {
				if (current) lines.push(current);
				current = token;
			}
		}
		if (current) lines.push(current);
		return lines;
	}

	function fitTextToBox(
		text: string,
		boxWidth: number,
		boxHeight: number,
		maxLines: number,
		baseFontSize: number
	): { lines: string[]; fontSize: number; lineHeight: number } {
		let fontSize = baseFontSize;
		const minFont = Math.max(10, baseFontSize * 0.5);
		for (; fontSize >= minFont; fontSize -= 1) {
			const lineHeight = fontSize * 1.2;
			const lines = measureWrappedLines(text, fontSize, boxWidth);
			const clipped = lines.slice(0, maxLines);
			const totalHeight = clipped.length * lineHeight;
			if (totalHeight <= boxHeight) {
				return { lines: clipped, fontSize, lineHeight };
			}
		}
		const finalFont = minFont;
		const finalLineHeight = finalFont * 1.2;
		return {
			lines: measureWrappedLines(text, finalFont, boxWidth).slice(0, maxLines),
			fontSize: finalFont,
			lineHeight: finalLineHeight
		};
	}

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
				ctx.font = `900 ${cellSize * 0.2}px "NotoSansJP", sans-serif`;
				ctx.fillText('FREE', x + cellSize / 2, y + cellSize / 2);
			} else {
				const padding = Math.max(8, cellSize * 0.04);
				const innerX = x + padding;
				const innerY = y + padding;
				const innerW = cellSize - padding * 2;
				const innerH = cellSize - padding * 2;

				// Album art area (top portion) if available
				const hasImage = !!cell.song.image;
				const artAreaHeight = hasImage ? innerH * 0.45 : 0;
				const textAreaY = innerY + artAreaHeight + (hasImage ? padding * 0.5 : 0);
				const textAreaHeight = innerY + innerH - textAreaY;

				if (hasImage) {
					try {
						const img = await loadImage(cell.song.image as string);
						const targetSize = Math.min(innerW, artAreaHeight);
						const artX = innerX + (innerW - targetSize) / 2;
						const artY = innerY + (artAreaHeight - targetSize) / 2;
						ctx.save();
						const radius = Math.max(4, targetSize * 0.04);
						ctx.beginPath();
						ctx.moveTo(artX + radius, artY);
						ctx.arcTo(artX + targetSize, artY, artX + targetSize, artY + targetSize, radius);
						ctx.arcTo(artX + targetSize, artY + targetSize, artX, artY + targetSize, radius);
						ctx.arcTo(artX, artY + targetSize, artX, artY, radius);
						ctx.arcTo(artX, artY, artX + targetSize, artY, radius);
						ctx.closePath();
						ctx.clip();
						const scale = Math.max(targetSize / img.width, targetSize / img.height);
						const dw = img.width * scale;
						const dh = img.height * scale;
						const dx = artX + (targetSize - dw) / 2;
						const dy = artY + (targetSize - dh) / 2;
						ctx.drawImage(img, dx, dy, dw, dh);
						ctx.restore();
					} catch {
						// ignore
					}
				}

				// Fit text within bounds
				const baseFontSize = cellSize * 0.12;
				const maxLines = 4;
				const { lines, fontSize, lineHeight } = fitTextToBox(cell.song.name, innerW * 0.95, textAreaHeight, maxLines, baseFontSize);
				ctx.save();
				ctx.beginPath();
				ctx.rect(innerX, textAreaY, innerW, textAreaHeight);
				ctx.clip();
				ctx.font = `${fontSize}px "NotoSansJP", sans-serif`;
				ctx.lineWidth = Math.max(0.8, fontSize * 0.05);
				ctx.strokeStyle = '#000000';
				ctx.fillStyle = '#000000';
				const totalHeight = lines.length * lineHeight;
				let textY = textAreaY + (textAreaHeight - totalHeight) / 2 + lineHeight / 2;
				for (const line of lines) {
					ctx.strokeText(line, x + cellSize / 2, textY);
					ctx.fillText(line, x + cellSize / 2, textY);
					textY += lineHeight;
				}
				ctx.restore();
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

	// A4 landscape size in points (841.89 x 595.28)
	const PAGE_WIDTH = 841.89;
	const PAGE_HEIGHT = 595.28;
	const MARGIN = 12; // page margin (reduced to enlarge boards)
	const GUTTER = 12; // space between the two boards (slightly reduced)
	const AVAILABLE_WIDTH = PAGE_WIDTH - MARGIN * 2 - GUTTER;
	const HALF_WIDTH = AVAILABLE_WIDTH / 2;
	const AVAILABLE_HEIGHT = PAGE_HEIGHT - MARGIN * 2;

	// Process two boards per page
	for (let i = 0; i < boards.length; i += 2) {
		const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

		// Left slot (board i)
		const leftBoard = boards[i];
		const leftBuffer = await generateBoardImage(leftBoard, i + 1, showFreeSpace);
		const leftImage = await pdfDoc.embedPng(leftBuffer);
		const leftDims = leftImage.scale(1);
		// Fit preserving aspect ratio
		const leftScale = Math.min(HALF_WIDTH / leftDims.width, AVAILABLE_HEIGHT / leftDims.height);
		const leftDrawW = leftDims.width * leftScale;
		const leftDrawH = leftDims.height * leftScale;
		const leftX = MARGIN + (HALF_WIDTH - leftDrawW) / 2;
		const leftY = MARGIN + (AVAILABLE_HEIGHT - leftDrawH) / 2;
		page.drawImage(leftImage, { x: leftX, y: leftY, width: leftDrawW, height: leftDrawH });

		// Right slot (board i+1) if exists
		if (i + 1 < boards.length) {
			const rightBoard = boards[i + 1];
			const rightBuffer = await generateBoardImage(rightBoard, i + 2, showFreeSpace);
			const rightImage = await pdfDoc.embedPng(rightBuffer);
			const rightDims = rightImage.scale(1);
			const rightScale = Math.min(HALF_WIDTH / rightDims.width, AVAILABLE_HEIGHT / rightDims.height);
			const rightDrawW = rightDims.width * rightScale;
			const rightDrawH = rightDims.height * rightScale;
			const rightSlotX = MARGIN + HALF_WIDTH + GUTTER;
			const rightX = rightSlotX + (HALF_WIDTH - rightDrawW) / 2;
			const rightY = MARGIN + (AVAILABLE_HEIGHT - rightDrawH) / 2;
			page.drawImage(rightImage, { x: rightX, y: rightY, width: rightDrawW, height: rightDrawH });
		}
	}

	// Serialize the PDF to bytes
	const pdfBytes = await pdfDoc.save();
	return Buffer.from(pdfBytes);
}
