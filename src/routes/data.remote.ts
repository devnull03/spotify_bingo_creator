import * as v from 'valibot';
import { query } from '$app/server';
import { getPlaylistFromLink } from '$lib/server/spotify';
import type { PlaylistData } from '$lib/interfaces/spotify.interface';

/**
 * Fetch playlist data from a Spotify playlist link
 * Validates the input is a non-empty string (the playlist link)
 */
export const fetchPlaylist = query(
	v.pipe(
		v.string(),
		v.minLength(1, 'Playlist link cannot be empty')
	),
	async (playlistLink: string): Promise<PlaylistData> => {
		return getPlaylistFromLink(playlistLink);
	}
);
