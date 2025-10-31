import PdfPrinter from 'pdfmake';
import path from 'node:path';
import JSZip from 'jszip';
import type { BingoBoard } from '$lib/utils/bingo';

// Resolve absolute path to the Noto Sans JP font bundled in the repo root
const NOTO_SANS_JP_PATH = path.join(process.cwd(), 'NotoSansJP-VariableFont_wght.ttf');

// Configure pdfmake for server-side rendering with custom font
const printer = new PdfPrinter({
	NotoSansJP: {
		normal: NOTO_SANS_JP_PATH,
		bold: NOTO_SANS_JP_PATH,
		italics: NOTO_SANS_JP_PATH,
		bolditalics: NOTO_SANS_JP_PATH
	}
});

/**
 * Sanitize text for PDF generation - handles characters that might not render
 * For now, we'll keep the original text but this could be extended to transliterate
 */
function sanitizeText(text: string): string {
	// Keep original text - pdfmake will show boxes for unsupported characters
	// but the layout will still work correctly
	return text;
}

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
	const gridSize = board.cells.length;

	for (let i = 0; i < gridSize; i++) {
		const row: object[] = [];

		for (let j = 0; j < board.cells[i].length; j++) {
			const cell = board.cells[i][j];

			// Check if it's the free space (center cell for 5x5)
			const isFreeSpace =
				showFreeSpace &&
				gridSize === 5 &&
				i === 2 &&
				j === 2;

			if (isFreeSpace) {
				row.push({
					text: 'FREE',
					bold: true,
					fontSize: 16,
					alignment: 'center',
					margin: [8, 12, 8, 12]
				});
			} else {
				row.push({
					text: cell.song.name,
					fontSize: gridSize === 3 ? 11 : gridSize === 4 ? 10 : 9,
					alignment: 'center',
					margin: [6, 8, 6, 8]
				});
			}
		}

		tableBody.push(row);
	}

	// Calculate cell dimensions to make them square
	// A4 page is 595.28 x 841.89 points
	// With margins, we have ~515 points width available
	const availableWidth = 515;
	const cellWidth = availableWidth / gridSize;

	return {
		body: tableBody,
		widths: Array(gridSize).fill(cellWidth),
		heights: Array(gridSize).fill(cellWidth) // Same as width to make squares
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
				table: {
					body: table.body,
					widths: table.widths,
					heights: table.heights
				},
				layout: {
					hLineWidth: () => 2,
					vLineWidth: () => 2,
					hLineColor: () => '#000000',
					vLineColor: () => '#000000',
					paddingLeft: () => 8,
					paddingRight: () => 8,
					paddingTop: () => 10,
					paddingBottom: () => 10
				},
				alignment: 'center'
			}
		],
		pageSize: 'A4',
		pageOrientation: 'portrait',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: { font: 'NotoSansJP' }
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
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
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

        // Add table (new page before every board except first)
        content.push({
            pageBreak: index === 0 ? undefined : 'before',
			table: {
				body: table.body,
				widths: table.widths,
				heights: table.heights
			},
			layout: {
				hLineWidth: () => 2,
				vLineWidth: () => 2,
				hLineColor: () => '#000000',
				vLineColor: () => '#000000',
				paddingLeft: () => 8,
				paddingRight: () => 8,
				paddingTop: () => 10,
				paddingBottom: () => 10
			},
			alignment: 'center',
			margin: [0, 0, 0, 30]
		});
	});

    return new Promise((resolve, reject) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const docDefinition: any = {
                content,
                pageSize: 'A4',
                pageOrientation: 'portrait',
                pageMargins: [40, 40, 40, 40],
                defaultStyle: { font: 'NotoSansJP' }
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
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
