/**
 * Utility functions for working with Spotify playlist data
 */

import type { PlaylistData, PlaylistSongInfo } from '$lib/interfaces/spotify.interface';

/**
 * Format duration from milliseconds to MM:SS format
 */
export function formatDuration(durationMs: number): string {
	const totalSeconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Extract just song names from a playlist
 */
export function getSongNames(playlist: PlaylistData): string[] {
	return playlist.songs.map(song => song.name);
}

/**
 * Get songs grouped by artist
 */
export function getSongsByArtist(
	playlist: PlaylistData
): Record<string, PlaylistSongInfo[]> {
	const grouped: Record<string, PlaylistSongInfo[]> = {};

	for (const song of playlist.songs) {
		if (!grouped[song.artist]) {
			grouped[song.artist] = [];
		}
		grouped[song.artist].push(song);
	}

	return grouped;
}

/**
 * Sort songs by duration (shortest first or longest first)
 */
export function sortByDuration(
	songs: PlaylistSongInfo[],
	direction: 'asc' | 'desc' = 'asc'
): PlaylistSongInfo[] {
	const sorted = [...songs];
	sorted.sort((a, b) => {
		const diff = a.durationMs - b.durationMs;
		return direction === 'asc' ? diff : -diff;
	});
	return sorted;
}

/**
 * Filter songs by duration range (in seconds)
 */
export function filterByDurationRange(
	songs: PlaylistSongInfo[],
	minSeconds: number,
	maxSeconds: number
): PlaylistSongInfo[] {
	const minMs = minSeconds * 1000;
	const maxMs = maxSeconds * 1000;
	return songs.filter(song => song.durationMs >= minMs && song.durationMs <= maxMs);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Generate a random sample of songs from a playlist
 */
export function randomSample(
	songs: PlaylistSongInfo[],
	sampleSize: number
): PlaylistSongInfo[] {
	if (sampleSize >= songs.length) {
		return shuffle(songs);
	}
	return shuffle(songs).slice(0, sampleSize);
}

/**
 * Export songs as CSV
 */
export function exportAsCSV(playlist: PlaylistData): string {
	const headers = ['#', 'Song Name', 'Artist', 'Duration'];
	const rows = playlist.songs.map((song, index) => [
		index + 1,
		`"${song.name.replace(/"/g, '""')}"`, // Escape quotes
		`"${song.artist.replace(/"/g, '""')}"`,
		formatDuration(song.durationMs)
	]);

	const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
	return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(playlist: PlaylistData, filename?: string): void {
	const csv = exportAsCSV(playlist);
	const element = document.createElement('a');
	element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
	element.setAttribute('download', filename || `${playlist.name}.csv`);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

/**
 * Search songs by name or artist
 */
export function searchSongs(
	songs: PlaylistSongInfo[],
	query: string
): PlaylistSongInfo[] {
	const lowerQuery = query.toLowerCase();
	return songs.filter(
		song =>
			song.name.toLowerCase().includes(lowerQuery) ||
			song.artist.toLowerCase().includes(lowerQuery) ||
			song.artists.some(artist => artist.toLowerCase().includes(lowerQuery))
	);
}

/**
 * Get unique artists from playlist
 */
export function getUniqueArtists(playlist: PlaylistData): string[] {
	const artists = new Set<string>();
	for (const song of playlist.songs) {
		artists.add(song.artist);
	}
	return Array.from(artists).sort();
}

/**
 * Calculate total playlist duration
 */
export function getTotalDuration(playlist: PlaylistData): {
	ms: number;
	formatted: string;
} {
	const totalMs = playlist.songs.reduce((sum, song) => sum + song.durationMs, 0);
	const hours = Math.floor(totalMs / (1000 * 60 * 60));
	const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
	const formatted = `${hours}h ${minutes}m`;

	return {
		ms: totalMs,
		formatted
	};
}
