<script lang="ts">
import { onMount } from 'svelte';
import { collectionApi, gamesApi, healthApi, playsApi, statsApi } from '$lib/api';
import { defaultCollectionCSV } from '$lib/data/collection';
import type { Game, Play } from '$lib/db';

let loading = $state(true);
let online = $state(navigator.onLine);
let apiConnected = $state(false);
let games = $state<Game[]>([]);
let recentPlays = $state<(Play & { game_name: string })[]>([]);
let stats = $state<{
	total_plays: number;
	total_games_played: number;
	total_wins: number;
	total_losses: number;
} | null>(null);
let error = $state<string | null>(null);

async function checkApiConnection() {
	try {
		await healthApi.check();
		apiConnected = true;
	} catch {
		apiConnected = false;
	}
}

async function loadData() {
	if (!apiConnected) return;

	try {
		const [gamesData, playsData, statsData] = await Promise.all([
			gamesApi.getAll(),
			playsApi.getAll(),
			statsApi.get(),
		]);
		games = gamesData;
		recentPlays = playsData.slice(0, 5);
		stats = statsData;
		error = null;
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to load data';
	}
}

async function seedCollection() {
	try {
		await collectionApi.importCSV(defaultCollectionCSV);
		await loadData();
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to load collection';
	}
}

onMount(async () => {
	const handleOnline = () => {
		online = true;
	};
	const handleOffline = () => {
		online = false;
	};

	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);

	await checkApiConnection();
	if (apiConnected) {
		await loadData();
		if (games.length === 0) {
			await seedCollection();
		}
	}
	loading = false;

	return () => {
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	};
});

const standaloneGames = $derived(games.filter((g) => g.item_type !== 'expansion'));
const expansions = $derived(games.filter((g) => g.item_type === 'expansion'));
</script>

<div class="dashboard">
	<div class="status-bar">
		<div class="status-indicator" class:offline={!online}>
			{online ? 'Online' : 'Offline'}
		</div>
		<div class="status-indicator" class:disconnected={!apiConnected}>
			API: {apiConnected ? 'Connected' : 'Disconnected'}
		</div>
	</div>

	<h2>Welcome to Board Game Tracker</h2>

	{#if error}
		<div class="error-banner">
			{error}
		</div>
	{/if}


	{#if loading}
		<div class="loading">Loading...</div>
	{:else}
		<div class="cards">
			<div class="card">
				<h3>Recent Plays</h3>
				{#if recentPlays.length === 0}
					<p>No plays recorded yet</p>
				{:else}
					<ul class="play-list">
						{#each recentPlays as play}
							<li>
								<span class="game-name">{play.game_name}</span>
								<span class="play-date">{new Date(play.played_at).toLocaleDateString()}</span>
								{#if play.won !== undefined}
									<span class="result" class:won={play.won}>{play.won ? 'Won' : 'Lost'}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="card">
				<h3>Your Collection</h3>
				{#if games.length === 0}
					<p>Loading collection...</p>
				{:else}
					<p>{standaloneGames.length} games, {expansions.length} expansions</p>
				{/if}
			</div>

			<div class="card">
				<h3>Quick Stats</h3>
				{#if stats && stats.total_plays > 0}
					<ul class="stats-list">
						<li><strong>{stats.total_plays}</strong> total plays</li>
						<li><strong>{stats.total_games_played}</strong> different games</li>
						<li><strong>{stats.total_wins}</strong> wins</li>
						<li><strong>{stats.total_losses}</strong> losses</li>
					</ul>
				{:else}
					<p>Start tracking your plays to see stats</p>
				{/if}
			</div>
		</div>

		{#if games.length > 0}
			<div class="collection-section">
				<h3>Collection</h3>
				<div class="game-grid">
					{#each standaloneGames.slice(0, 12) as game}
						<div class="game-card">
							{#if game.thumbnail_url}
								<img src={game.thumbnail_url} alt={game.name} />
							{:else}
								<div class="no-image">No Image</div>
							{/if}
							<div class="game-info">
								<span class="game-title">{game.name}</span>
								{#if game.user_rating}
									<span class="rating">{game.user_rating}/10</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				{#if standaloneGames.length > 12}
					<p class="more-games">and {standaloneGames.length - 12} more...</p>
				{/if}
			</div>
		{/if}

		<div class="actions">
			<button class="primary" disabled={games.length === 0}>Record a Play</button>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 900px;
		margin: 0 auto;
	}

	.status-bar {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.status-indicator {
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		background: #4caf50;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status-indicator.offline,
	.status-indicator.disconnected {
		background: #ff9800;
	}

	.error-banner {
		background: #ffebee;
		color: #c62828;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	h2 {
		margin-bottom: 2rem;
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #1a1a1a;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.card p {
		color: #666;
		margin-bottom: 1rem;
	}

	.play-list,
	.stats-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.play-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
	}

	.play-list li:last-child {
		border-bottom: none;
	}

	.game-name {
		flex: 1;
		font-weight: 500;
	}

	.play-date {
		color: #666;
		font-size: 0.875rem;
	}

	.result {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		background: #ffebee;
		color: #c62828;
	}

	.result.won {
		background: #e8f5e9;
		color: #2e7d32;
	}

	.stats-list li {
		padding: 0.25rem 0;
	}

	.collection-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.game-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 1rem;
	}

	.game-card {
		text-align: center;
	}

	.game-card img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 4px;
		background: #f5f5f5;
	}

	.no-image {
		width: 100%;
		aspect-ratio: 1;
		background: #f5f5f5;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 0.75rem;
	}

	.game-info {
		margin-top: 0.5rem;
	}

	.game-title {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rating {
		font-size: 0.75rem;
		color: #666;
	}

	.more-games {
		text-align: center;
		color: #666;
		margin-top: 1rem;
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		color: #333;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #ccc;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.primary {
		background: #1a1a1a;
		color: white;
		border-color: #1a1a1a;
	}

	button.primary:hover:not(:disabled) {
		background: #333;
		border-color: #333;
	}
</style>
