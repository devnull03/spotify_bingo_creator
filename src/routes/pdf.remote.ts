import * as v from 'valibot';
import { query } from '$app/server';
import { generateBingoBoardsPDF, generateBingoBoardsPDFZip } from '$lib/server/pdf-export';
import { generateMultipleBoards } from '$lib/utils/bingo';
import { getPlaylistFromLink } from '$lib/server/spotify';

interface PDFExportRequest {
	playlistLink: string;
	boardCount: number;
	boardSize: number;
	includeFreeSpace: boolean;
}

/**
 * Export bingo boards as a single PDF
 */
export const exportPDF = query(
	v.pipe(
		v.object({
			playlistLink: v.string(),
			boardCount: v.number(),
			boardSize: v.number(),
			includeFreeSpace: v.boolean()
		})
	),
	async (data: PDFExportRequest): Promise<{ buffer: string; filename: string }> => {
		// Fetch playlist from Spotify
		const playlist = await getPlaylistFromLink(data.playlistLink);

		// Generate boards on server
		const boards = generateMultipleBoards(
			playlist.songs,
			data.boardCount,
			data.boardSize,
			data.includeFreeSpace
		);

		// Generate PDF
		const buffer = await generateBingoBoardsPDF(boards, data.includeFreeSpace);

		// Convert buffer to base64 for transmission
		const base64 = buffer.toString('base64');
		const timestamp = new Date().toISOString().split('T')[0];

		return {
			buffer: base64,
			filename: `bingo_boards_${timestamp}.pdf`
		};
	}
);

/**
 * Export bingo boards as individual PDFs in a ZIP file
 */
export const exportZIP = query(
	v.pipe(
		v.object({
			playlistLink: v.string(),
			boardCount: v.number(),
			boardSize: v.number(),
			includeFreeSpace: v.boolean()
		})
	),
	async (data: PDFExportRequest): Promise<{ buffer: string; filename: string }> => {
		// Fetch playlist from Spotify
		const playlist = await getPlaylistFromLink(data.playlistLink);

		// Generate boards on server
		const boards = generateMultipleBoards(
			playlist.songs,
			data.boardCount,
			data.boardSize,
			data.includeFreeSpace
		);

		// Generate ZIP with individual PDFs
		const buffer = await generateBingoBoardsPDFZip(boards, data.includeFreeSpace);

		// Convert buffer to base64 for transmission
		const base64 = buffer.toString('base64');
		const timestamp = new Date().toISOString().split('T')[0];

		return {
			buffer: base64,
			filename: `bingo_boards_${timestamp}.zip`
		};
	}
);
