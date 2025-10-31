import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import JSZip from 'jszip';
import type { BingoBoard } from '$lib/utils/bingo';

// Register fonts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
pdfMake.vfs = (pdfFonts as any).vfs;

interface PDFTable {
	body: object[][];
	widths: string[];
	heights: string[];
}

/**
 * Convert a BingoBoard to a PDF table structure
 */
function boardToPDFTable(board: BingoBoard, showFreeSpace: boolean = true): PDFTable {
	const tableBody: object[][] = [];

	for (let i = 0; i < board.cells.length; i++) {
		const row: object[] = [];

		for (let j = 0; j < board.cells[i].length; j++) {
			const cell = board.cells[i][j];

			// Check if it's the free space (center cell for 5x5)
			const isFreeSpace =
				showFreeSpace &&
				board.cells.length === 5 &&
				i === 2 &&
				j === 2;

			if (isFreeSpace) {
				row.push({
					text: 'FREE',
					bold: true,
					fontSize: 14,
					alignment: 'center',
					verticalAlignment: 'middle'
				});
			} else {
				row.push({
					text: cell.song.name,
					fontSize: 10,
					alignment: 'center',
					verticalAlignment: 'middle',
					margin: [2, 2, 2, 2]
				});
			}
		}

		tableBody.push(row);
	}

	const cellWidth = 100 / board.cells[0].length;
	const cellHeight = 100 / board.cells.length;

	return {
		body: tableBody,
		widths: Array(board.cells[0].length).fill(`${cellWidth}%`),
		heights: Array(board.cells.length).fill(`${cellHeight}mm`)
	};
}

/**
 * Generate a single PDF for a bingo board
 */
function generateSingleBoardPDF(board: BingoBoard, boardNumber: number, showFreeSpace: boolean = true) {
	const table = boardToPDFTable(board, showFreeSpace);

	return {
		content: [
			{
				text: `Bingo Board #${boardNumber}`,
				fontSize: 16,
				bold: true,
				margin: [0, 0, 0, 10]
			},
			{
				table: {
					body: table.body,
					widths: table.widths,
					heights: table.heights
				},
				layout: 'noBorders'
			}
		],
		pageSize: 'A4',
		pageOrientation: 'portrait',
		margin: [10, 10, 10, 10]
	};
}

/**
 * Generate a single PDF blob for a bingo board
 */
export function generateBoardPDFBlob(
	board: BingoBoard,
	boardNumber: number,
	showFreeSpace: boolean = true
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		try {
			const docDefinition = generateSingleBoardPDF(board, boardNumber, showFreeSpace);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(pdfMake as any).createPdf(docDefinition).getBuffer((buffer: Buffer) => {
				resolve(buffer);
			});
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Generate all bingo boards as a single PDF
 */
export function generateBingoBoardsPDF(
	boards: BingoBoard[],
	showFreeSpace: boolean = true
): Promise<Buffer> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const content: any[] = [];

	boards.forEach((board, index) => {
		const table = boardToPDFTable(board, showFreeSpace);

		// Add title
		content.push({
			text: `Bingo Board #${index + 1}`,
			fontSize: 16,
			bold: true,
			margin: [0, 0, 0, 10],
			pageBreak: index === 0 ? undefined : 'before'
		});

		// Add table
		content.push({
			table: {
				body: table.body,
				widths: table.widths,
				heights: table.heights
			},
			layout: 'noBorders',
			margin: [0, 0, 0, 20]
		});
	});

	return new Promise((resolve, reject) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const docDefinition: any = {
				content,
				pageSize: 'A4',
				pageOrientation: 'portrait',
				margin: [10, 10, 10, 10]
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(pdfMake as any).createPdf(docDefinition).getBuffer((buffer: Buffer) => {
				resolve(buffer);
			});
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Generate individual PDFs for each board and zip them
 */
export async function generateBingoBoardsPDFZip(
	boards: BingoBoard[],
	showFreeSpace: boolean = true
): Promise<Buffer> {
	const zip = new JSZip();

	// Generate individual PDFs for each board
	for (let i = 0; i < boards.length; i++) {
		const board = boards[i];
		const pdfBuffer = await generateBoardPDFBlob(board, i + 1, showFreeSpace);

		// Add PDF to zip with numbered filename
		zip.file(`bingo_board_${String(i + 1).padStart(3, '0')}.pdf`, pdfBuffer);
	}

	// Generate the zip file
	return zip.generateAsync({ type: 'nodebuffer' });
}
