// Token response from Spotify OAuth
export interface SpotifyTokenResponse {
	access_token: string;
	token_type: string;
	scope: string;
	expires_in: number;
	refresh_token?: string;
}

// Basic types from Spotify API
export interface SpotifyImage {
	url: string;
	height: number | null;
	width: number | null;
}

export interface SpotifyArtist {
	id: string;
	name: string;
	external_urls: {
		spotify: string;
	};
}

export interface SpotifyAlbum {
	id: string;
	name: string;
	images: SpotifyImage[];
	external_urls: {
		spotify: string;
	};
}

export interface SpotifyTrack {
	id: string;
	name: string;
	artists: SpotifyArtist[];
	album: SpotifyAlbum;
	external_urls: {
		spotify: string;
	};
	duration_ms: number;
	popularity: number;
	uri: string;
}

// Playlist related types
export interface SpotifyPlaylistOwner {
	display_name: string;
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	type: string;
	uri: string;
}

export interface SpotifyPlaylistTrack {
	track: SpotifyTrack | null;
	added_at: string;
	added_by: {
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		type: string;
		uri: string;
	};
}

export interface SpotifyPlaylist {
	id: string;
	name: string;
	description: string | null;
	owner: SpotifyPlaylistOwner;
	public: boolean;
	collaborative: boolean;
	external_urls: {
		spotify: string;
	};
	href: string;
	images: SpotifyImage[];
	tracks: {
		href: string;
		limit: number;
		next: string | null;
		offset: number;
		previous: string | null;
		total: number;
		items: SpotifyPlaylistTrack[];
	};
	uri: string;
}

// Currently playing track types (from portfolio)
export interface CurrentlyPlayingTrack {
	name: string;
	artists: string[];
	image: string | null;
	link: string;
	isPlaying: boolean;
	progress: number | null;
	duration: number | null;
}

export interface CurrentTrackData extends CurrentlyPlayingTrack {
	display: string;
	isActive: boolean;
	durationFmt: string;
}

export interface SpotifyCurrentlyPlayingResponse {
	device?: {
		id: string;
		is_active: boolean;
		name: string;
		type: string;
		volume_percent: number | null;
	};
	repeat_state: 'off' | 'track' | 'context';
	shuffle_state: boolean;
	context?: {
		type: string;
		href: string;
		external_urls: {
			spotify: string;
		};
		uri: string;
	};
	timestamp: number;
	progress_ms: number | null;
	is_playing: boolean;
	item: SpotifyTrack | null;
	currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface SpotifyPlayHistoryObject {
	track: SpotifyTrack;
	played_at: string; // ISO 8601 date-time
	context?: {
		type: string;
		href: string;
		external_urls: {
			spotify: string;
		};
		uri: string;
	};
}

export interface SpotifyRecentlyPlayedResponse {
	href: string;
	limit: number;
	next: string | null;
	cursors: {
		after: string;
		before: string;
	};
	total: number;
	items: SpotifyPlayHistoryObject[];
}

export interface RecentlyPlayedTrack {
	name: string;
	artists: string[];
	image: string | null;
	link: string;
	playedAt: string;
	playedAtMs: number;
	duration: number;
}

// Playlist song extraction result
export interface PlaylistSongInfo {
	id: string;
	name: string;
	artist: string;
	artists: string[];
	uri: string;
	link: string;
	image: string | null;
	durationMs: number;
}

export interface PlaylistData {
	id: string;
	name: string;
	description: string | null;
	ownerName: string;
	totalTracks: number;
	playlistLink: string;
	songs: PlaylistSongInfo[];
}
