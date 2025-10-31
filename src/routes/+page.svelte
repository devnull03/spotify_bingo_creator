<script lang="ts">
	import { fetchPlaylist } from './data.remote';

	let playlistLink = $state('');
	let error: string | null = $state(null);
	let playlistData = $state<Awaited<ReturnType<typeof fetchPlaylist>> | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		playlistData = null;

		if (!playlistLink.trim()) {
			error = 'Please enter a Spotify playlist link';
			return;
		}

		try {
			playlistData = await fetchPlaylist(playlistLink.trim());
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<div class="min-h-screen bg-slate-950 text-white p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold mb-2">Spotify Bingo Creator</h1>
		<p class="text-gray-400 mb-8">Paste a Spotify playlist link to generate bingo cards</p>

		<!-- Input Form -->
		<form onsubmit={handleSubmit} class="mb-8">
			<div class="flex gap-4">
				<input
					type="text"
					bind:value={playlistLink}
					placeholder="Paste Spotify playlist link (e.g., https://open.spotify.com/playlist/...)"
					class="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<button
					type="submit"
					class="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
				>
					Fetch
				</button>
			</div>
		</form>

		<!-- Error Message -->
		{#if error}
			<div class="mb-8 p-4 bg-red-900 text-red-100 rounded-lg">
				{error}
			</div>
		{/if}

		<!-- Playlist Info -->
		{#if playlistData}
			<div class="mb-8">
				<div class="bg-gray-800 rounded-lg p-6 mb-6">
					<h2 class="text-2xl font-bold mb-2">{playlistData.name}</h2>
					<p class="text-gray-400 mb-4">{playlistData.description}</p>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-gray-500">Owner:</span>
							<p class="font-semibold">{playlistData.ownerName}</p>
						</div>
						<div>
							<span class="text-gray-500">Total Tracks:</span>
							<p class="font-semibold">{playlistData.totalTracks}</p>
						</div>
					</div>
				</div>

				<!-- Songs List -->
				<div class="bg-gray-800 rounded-lg overflow-hidden">
					<div class="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-700">
						<h3 class="text-xl font-bold">Songs ({playlistData.songs.length})</h3>
					</div>

					<div class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
						{#each playlistData.songs as song, index}
							<div class="px-6 py-4 hover:bg-gray-700 transition-colors">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="font-semibold">{index + 1}. {song.name}</div>
										<div class="text-sm text-gray-400">{song.artist}</div>
										<div class="text-xs text-gray-500 mt-1">
											Duration: {Math.floor(song.durationMs / 60000)}:{String(
												Math.floor((song.durationMs % 60000) / 1000)
											).padStart(2, '0')}
										</div>
									</div>
									<button
										onclick={() => copyToClipboard(song.name)}
										class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
										title="Copy song name"
									>
										Copy
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Instructions -->
		{#if !playlistData && !error}
			<div class="bg-gray-800 rounded-lg p-6 text-gray-300">
				<h3 class="text-lg font-semibold mb-4">How to use:</h3>
				<ol class="list-decimal list-inside space-y-2">
					<li>Open a Spotify playlist in your browser</li>
					<li>Copy the link from the address bar</li>
					<li>Paste it in the input field above</li>
					<li>Click "Fetch" to load all songs</li>
					<li>Use the songs to generate bingo cards!</li>
				</ol>
			</div>
		{/if}
	</div>
</div>

<!-- <style>
	:global(body) {
		@apply bg-slate-950;
	}
</style> -->
