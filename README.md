# Spotify Bingo Creator

A SvelteKit application that fetches Spotify playlists and extracts song information for generating bingo cards.

## Features

- 🎵 Fetch complete Spotify playlists using just a link
- 📊 Extract all song names, artists, and metadata
- 🎯 Backend API for playlist data retrieval
- ⚡ Built with SvelteKit and TypeScript
- 🎨 Clean, dark-themed UI

## Prerequisites

Before you begin, you'll need:

1. **Node.js** (v18 or higher)
2. **pnpm** (or npm/yarn)
3. **Spotify Developer Account** with API credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository>
cd spotify_bingo_creator
pnpm install
```

### 2. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Accept the terms and create the app
4. You'll get:
   - **Client ID**
   - **Client Secret**
5. Set the Redirect URI to `https://dvnl.work` (or your own if different)

### 3. Generate Refresh Token

Use the Python script from your portfolio repository or follow this process:

#### Option A: Using cURL/Postman

1. Create an authorization URL:
```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://dvnl.work&scope=playlist-read-private%20playlist-read-collaborative
```

2. Visit the URL and authorize the application
3. You'll be redirected and the authorization code will be in the URL
4. Exchange the code for tokens:

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=YOUR_AUTH_CODE&redirect_uri=https://dvnl.work&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

5. Extract the `refresh_token` from the response

#### Option B: Using the Portfolio Script

If you have the script from your portfolio:
```bash
python3 scripts/get_spotify_token.py
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials:
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:5173` in your browser.

## Usage

### Via Web UI

1. Open the application in your browser
2. Paste a Spotify playlist link (e.g., `https://open.spotify.com/playlist/PLAYLIST_ID`)
3. Click "Fetch" to load all songs
4. View the complete song list with artist names and durations

### Via API

**Endpoint:** `POST /api/playlist`

**Request:**
```json
{
  "playlistLink": "https://open.spotify.com/playlist/PLAYLIST_ID"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "PLAYLIST_ID",
    "name": "Playlist Name",
    "description": "Playlist description",
    "ownerName": "Owner Name",
    "totalTracks": 50,
    "playlistLink": "https://open.spotify.com/playlist/...",
    "songs": [
      {
        "id": "TRACK_ID",
        "name": "Song Name",
        "artist": "Artist Name",
        "artists": ["Artist Name"],
        "uri": "spotify:track:TRACK_ID",
        "link": "https://open.spotify.com/track/...",
        "image": "https://...",
        "durationMs": 180000
      }
    ]
  }
}
```

## Project Structure

```
src/
├── lib/
│   ├── interfaces/
│   │   └── spotify.interface.ts    # Spotify API types
│   ├── server/
│   │   └── spotify.ts              # Backend Spotify service
│   └── assets/
├── routes/
│   ├── api/
│   │   └── playlist/
│   │       └── +server.ts          # Playlist API endpoint
│   └── +page.svelte                # Main UI
├── app.css                          # Global styles
└── app.html                         # HTML entry point
```

## API Functions

### `getPlaylistFromLink(playlistLink: string): Promise<PlaylistData>`

Fetches a complete playlist by link and returns all track information.

**Parameters:**
- `playlistLink`: Full Spotify playlist URL or `spotify:playlist:ID` URI

**Returns:** `PlaylistData` object containing playlist info and all tracks

**Example:**
```typescript
import { getPlaylistFromLink } from '$lib/server/spotify';

const playlist = await getPlaylistFromLink('https://open.spotify.com/playlist/PLAYLIST_ID');
console.log(`Loaded ${playlist.songs.length} songs from "${playlist.name}"`);
```

### `extractPlaylistIdFromLink(playlistLink: string): string | null`

Extracts the playlist ID from a Spotify link.

**Supported formats:**
- `https://open.spotify.com/playlist/PLAYLIST_ID`
- `https://open.spotify.com/playlist/PLAYLIST_ID?si=...`
- `spotify:playlist:PLAYLIST_ID`

## Building for Production

```bash
pnpm build
```

The build output will be in the `.svelte-kit/output` directory.

## Supported Playlist Link Formats

The application accepts:
- **Web URLs**: `https://open.spotify.com/playlist/PLAYLIST_ID`
- **Web URLs with parameters**: `https://open.spotify.com/playlist/PLAYLIST_ID?si=xxxxx`
- **Spotify URIs**: `spotify:playlist:PLAYLIST_ID`

## Troubleshooting

### "Module not found: $env/static/private"
- Make sure you have a `.env` file with all required credentials
- Run `pnpm dev` to rebuild the environment types

### "Playlist not found" (404 error)
- Verify the playlist link is correct
- Check if the playlist is set to private (you need playlist-read-private scope)

### "Rate limit exceeded" (429 error)
- You're making too many requests to Spotify API
- Wait a few seconds before trying again

### "Invalid or expired refresh token" (401 error)
- Your refresh token has expired or is invalid
- Re-generate a new token following the Setup Instructions

## Technologies Used

- **SvelteKit** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Spotify Web API** - Playlist and track data
- **Node.js** - Backend runtime

## License

MIT
