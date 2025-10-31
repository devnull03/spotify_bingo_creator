import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';
import type {
	SpotifyTokenResponse,
	SpotifyPlaylist,
	PlaylistData,
	PlaylistSongInfo
} from '$lib/interfaces/spotify.interface';

// Types for Spotify API responses
class SpotifyError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = 'SpotifyError';
	}
}

/**
 * Get access token using Client Credentials flow
 * This allows fetching public playlists without user authentication
 */
async function getAccessToken(): Promise<string> {
	const clientId = SPOTIFY_CLIENT_ID;
	const clientSecret = SPOTIFY_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new SpotifyError('Spotify credentials not configured. Need SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
	}

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
		},
		body: 'grant_type=client_credentials'
	});

	if (!response.ok) {
		throw new SpotifyError('Failed to get Spotify access token', response.status);
	}

	const data: SpotifyTokenResponse = await response.json();
	return data.access_token;
}

/**
 * Extract playlist ID from a Spotify playlist link
 * Supports formats:
 * - https://open.spotify.com/playlist/PLAYLIST_ID
 * - https://open.spotify.com/playlist/PLAYLIST_ID?si=...
 * - spotify:playlist:PLAYLIST_ID
 */
export function extractPlaylistIdFromLink(playlistLink: string): string | null {
	try {
		// Handle spotify: URI format
		if (playlistLink.startsWith('spotify:playlist:')) {
			return playlistLink.replace('spotify:playlist:', '');
		}

		// Handle https:// format
		if (playlistLink.includes('open.spotify.com/playlist/')) {
			const match = playlistLink.match(/playlist\/([a-zA-Z0-9]+)/);
			if (match && match[1]) {
				return match[1];
			}
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Fetch a single page of playlist tracks from Spotify API
 */
async function getPlaylistTracksPage(
	playlistId: string,
	offset: number = 0,
	limit: number = 50
): Promise<any> {
	const accessToken = await getAccessToken();

	const response = await fetch(
		`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
		{
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		}
	);

	if (!response.ok) {
		if (response.status === 404) {
			throw new SpotifyError('Playlist not found', 404);
		}
		if (response.status === 401) {
			throw new SpotifyError('Authentication failed', 401);
		}
		if (response.status === 429) {
			throw new SpotifyError('Rate limit exceeded. Please try again later', 429);
		}
		throw new SpotifyError(`Spotify API error: ${response.status}`, response.status);
	}

	return response.json();
}

/**
 * Fetch complete playlist data from Spotify using a playlist link
 * Automatically paginates through all tracks
 * Works with public playlists only
 */
export async function getPlaylistFromLink(playlistLink: string): Promise<PlaylistData> {
	try {
		// Extract playlist ID from link
		const playlistId = extractPlaylistIdFromLink(playlistLink);
		if (!playlistId) {
			throw new SpotifyError('Invalid Spotify playlist link format', 400);
		}

		const accessToken = await getAccessToken();

		// Fetch basic playlist info
		const playlistResponse = await fetch(
			`https://api.spotify.com/v1/playlists/${playlistId}`,
			{
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (!playlistResponse.ok) {
			if (playlistResponse.status === 404) {
				throw new SpotifyError('Playlist not found', 404);
			}
			if (playlistResponse.status === 401) {
				throw new SpotifyError('Authentication failed', 401);
			}
			throw new SpotifyError(`Failed to fetch playlist: ${playlistResponse.status}`, playlistResponse.status);
		}

		const playlist: SpotifyPlaylist = await playlistResponse.json();

		// Fetch all tracks (with pagination)
		const allSongs: PlaylistSongInfo[] = [];
		let offset = 0;
		const limit = 50; // Spotify API limit

		while (offset < playlist.tracks.total) {
			const tracksPage = await getPlaylistTracksPage(playlistId, offset, limit);

			for (const item of tracksPage.items) {
				// Skip if track is null (can happen in some playlists)
				if (!item.track) {
					continue;
				}

				const track = item.track;
				const artistNames = track.artists.map((artist: any) => artist.name);

				allSongs.push({
					id: track.id,
					name: track.name,
					artist: artistNames[0] || 'Unknown Artist',
					artists: artistNames,
					uri: track.uri,
					link: track.external_urls.spotify,
					image: track.album.images.length > 0 ? track.album.images[0].url : null,
					durationMs: track.duration_ms
				});
			}

			offset += limit;
		}

		return {
			id: playlist.id,
			name: playlist.name,
			description: playlist.description,
			ownerName: playlist.owner.display_name,
			totalTracks: playlist.tracks.total,
			playlistLink: playlist.external_urls.spotify,
			songs: allSongs
		};
	} catch (error) {
		if (error instanceof SpotifyError) {
			throw error;
		}
		throw new SpotifyError(`Failed to get playlist: ${error}`);
	}
}

/**
 * Format track duration from milliseconds to MM:SS
 */
export function formatDuration(durationMs: number | null): string {
	if (!durationMs) return '0:00';

	const totalSeconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
