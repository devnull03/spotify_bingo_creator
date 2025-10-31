<script lang="ts">
	import { fetchPlaylist } from './data.remote';
	import BingoPrinter from '$lib/components/BingoPrinter.svelte';

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

<div class="min-h-screen bg-white text-black p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold mb-2">Spotify Bingo Creator</h1>
		<p class="mb-8">Paste a Spotify playlist link to generate bingo cards</p>

		<!-- Input Form -->
		<form onsubmit={handleSubmit} class="mb-8">
			<div class="flex gap-4">
				<input
					type="text"
					bind:value={playlistLink}
					placeholder="Paste Spotify playlist link (e.g., https://open.spotify.com/playlist/...)"
					class="flex-1 px-2 py-2 border border-black bg-white"
				/>
				<button
					type="submit"
					class="px-4 py-2 border border-black bg-white"
				>
					Fetch
				</button>
			</div>
		</form>

		<!-- Error Message -->
		{#if error}
			<div class="mb-8 p-4 border border-black">
				{error}
			</div>
		{/if}

		<!-- Playlist Info -->
		{#if playlistData}
			<div class="mb-8">
				<div class="p-6 mb-6 border border-black">
					<h2 class="text-2xl font-bold mb-2">{playlistData.name}</h2>
					<p class="mb-4">{playlistData.description}</p>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
						<span>Owner:</span>
							<p class="font-semibold">{playlistData.ownerName}</p>
						</div>
						<div>
						<span>Total Tracks:</span>
							<p class="font-semibold">{playlistData.totalTracks}</p>
						</div>
					</div>
				</div>

				<!-- Songs List -->
				<div class="border border-black overflow-hidden">
					<div class="sticky top-0 px-6 py-4 border-b border-black bg-white">
						<h3 class="text-xl font-bold">Songs ({playlistData.songs.length})</h3>
					</div>

					<div class="max-h-96 overflow-y-auto">
						{#each playlistData.songs as song, index}
							<div class="px-6 py-4 border-b border-black">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="font-semibold">{index + 1}. {song.name}</div>
										<div class="text-sm">{song.artist}</div>
										<div class="text-xs mt-1">
											Duration: {Math.floor(song.durationMs / 60000)}:{String(
												Math.floor((song.durationMs % 60000) / 1000)
											).padStart(2, '0')}
										</div>
									</div>
									<button
										onclick={() => copyToClipboard(song.name)}
										class="px-3 py-1 border border-black text-xs bg-white"
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

		<!-- Bingo Board Generator -->
		{#if playlistData}
			<div class="mt-12 pt-8 border-t border-black">
				<h2 class="text-3xl font-bold mb-2">Generate Printable Bingo Boards</h2>
				<p class="mb-8">
					Create and print bingo boards using songs from your playlist
				</p>
				<BingoPrinter playlist={playlistData} />
			</div>
		{/if}

		<!-- Instructions -->
		{#if !playlistData && !error}
			<div class="p-6 border border-black">
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
