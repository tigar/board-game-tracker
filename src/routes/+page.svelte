<script lang="ts">
import { onMount } from 'svelte';
import { gamesApi, playsApi, statsApi } from '$lib/api';
import type { Game, Play } from '$lib/types';

let loading = $state(true);
let games = $state<Game[]>([]);
let plays = $state<(Play & { game_name: string })[]>([]);
let stats = $state({
	total_plays: 0,
	total_games_played: 0,
	total_wins: 0,
	total_losses: 0,
});

// UI state
let showAddPlay = $state(false);
let searchQuery = $state('');
let newGameName = $state('');
let selectedGameId = $state<number | null>(null);
let playDate = $state('');
let playResult = $state<'won' | 'lost' | 'none'>('none');
let playerCount = $state(2);

// Filtered plays based on search
const filteredPlays = $derived(
	searchQuery.trim()
		? plays.filter(p => p.game_name.toLowerCase().includes(searchQuery.toLowerCase()))
		: plays
);

async function loadData() {
	try {
		const [gamesData, playsData, statsData] = await Promise.all([
			gamesApi.getAll(),
			playsApi.getAll(),
			statsApi.get(),
		]);
		games = gamesData;
		plays = playsData;
		stats = statsData;
	} catch (err) {
		console.error('Failed to load data:', err);
	}
}

async function handleAddPlay() {
	if (!selectedGameId && !newGameName.trim()) return;
	
	try {
		let gameId = selectedGameId;
		
		// Create game if new game name provided
		if (!gameId && newGameName.trim()) {
			const result = await gamesApi.create(newGameName.trim());
			gameId = result.id;
		}
		
		if (!gameId) return;
		
		await playsApi.create({
			game_id: gameId,
			played_at: playDate || new Date().toISOString().split('T')[0],
			won: playResult === 'won' ? true : playResult === 'lost' ? false : undefined,
			player_count: playerCount,
		});
		
		// Reset form
		selectedGameId = null;
		newGameName = '';
		playDate = new Date().toISOString().split('T')[0];
		playResult = 'none';
		playerCount = 2;
		showAddPlay = false;
		
		await loadData();
	} catch (err) {
		console.error('Failed to add play:', err);
		alert('Failed to add play. Please try again.');
	}
}

async function handleDeletePlay(id: number) {
	if (!confirm('Delete this play?')) return;
	
	try {
		await playsApi.delete(id);
		await loadData();
	} catch (err) {
		console.error('Failed to delete play:', err);
		alert('Failed to delete play. Please try again.');
	}
}

function formatDate(isoDate: string): string {
	const date = new Date(isoDate);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	
	if (date.toDateString() === today.toDateString()) return 'Today';
	if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
	
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

onMount(async () => {
	await loadData();
	playDate = new Date().toISOString().split('T')[0];
	loading = false;
});
</script>

{#if loading}
	<div class="loading">Loading...</div>
{:else}
	<!-- Stats Overview -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{stats.total_plays}</div>
			<div class="stat-label">Plays</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.total_games_played}</div>
			<div class="stat-label">Games</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.total_wins}</div>
			<div class="stat-label">Wins</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.total_losses}</div>
			<div class="stat-label">Losses</div>
		</div>
	</div>

	<!-- Primary Action -->
	<button class="btn-add-play" onclick={() => showAddPlay = true}>
		<span class="plus">+</span> Log Play
	</button>

	<!-- Search -->
	<div class="search-container">
		<input 
			type="text" 
			class="search-input" 
			placeholder="Search plays..." 
			bind:value={searchQuery}
		/>
		{#if searchQuery}
			<button class="search-clear" onclick={() => searchQuery = ''}>×</button>
		{/if}
	</div>

	<!-- Recent Plays -->
	{#if filteredPlays.length === 0}
		<div class="empty-state">
			{#if searchQuery}
				<p>No plays found matching "{searchQuery}"</p>
			{:else}
				<p>No plays yet. Tap "Log Play" to get started!</p>
			{/if}
		</div>
	{:else}
		<div class="plays-list">
			{#each filteredPlays as play (play.id)}
				<div class="play-item">
					<div class="play-content">
						<div class="play-game">{play.game_name}</div>
						<div class="play-meta">
							<span>{formatDate(play.played_at)}</span>
							<span>•</span>
							<span>{play.player_count}p</span>
							{#if play.won !== undefined}
								<span>•</span>
								<span class="play-result" class:won={play.won} class:lost={!play.won}>
									{play.won ? 'W' : 'L'}
								</span>
							{/if}
						</div>
					</div>
					<button class="btn-delete" onclick={() => handleDeletePlay(play.id!)}>
						Delete
					</button>
				</div>
			{/each}
		</div>
	{/if}
{/if}

<!-- Add Play Modal -->
{#if showAddPlay}
	<div class="modal-backdrop" onclick={() => showAddPlay = false}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Log a Play</h2>
				<button class="modal-close" onclick={() => showAddPlay = false}>×</button>
			</div>
			
			<form onsubmit={(e) => { e.preventDefault(); handleAddPlay(); }}>
				<div class="form-group">
					<label for="game">Game</label>
					<select id="game" bind:value={selectedGameId}>
						<option value={null}>-- Or type new game below --</option>
						{#each games as game}
							<option value={game.id}>{game.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="newGame">New Game Name</label>
					<input 
						id="newGame" 
						type="text" 
						bind:value={newGameName} 
						placeholder="Type new game name..."
						disabled={selectedGameId !== null}
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="date">Date</label>
						<input id="date" type="date" bind:value={playDate} required />
					</div>

					<div class="form-group">
						<label for="players">Players</label>
						<input id="players" type="number" min="1" max="20" bind:value={playerCount} required />
					</div>
				</div>

				<div class="form-group">
					<label>Result</label>
					<div class="result-options">
						<label class="result-option" class:selected={playResult === 'won'}>
							<input type="radio" name="result" value="won" bind:group={playResult} />
							<span>Won</span>
						</label>
						<label class="result-option" class:selected={playResult === 'lost'}>
							<input type="radio" name="result" value="lost" bind:group={playResult} />
							<span>Lost</span>
						</label>
						<label class="result-option" class:selected={playResult === 'none'}>
							<input type="radio" name="result" value="none" bind:group={playResult} />
							<span>No winner</span>
						</label>
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick={() => showAddPlay = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Save Play
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Loading State */
	.loading {
		text-align: center;
		padding: 3rem 1rem;
		color: #64748b;
		font-size: 1.125rem;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 20px;
	}

	.stat-card {
		background: white;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		line-height: 1;
		margin-bottom: 6px;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
	}

	/* Primary Action Button */
	.btn-add-play {
		width: 100%;
		padding: 18px;
		background: #6366f1;
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-bottom: 20px;
		box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);
		transition: all 0.2s;
	}

	.btn-add-play:active {
		transform: scale(0.98);
		box-shadow: 0 2px 4px rgba(99, 102, 241, 0.25);
	}

	.plus {
		font-size: 1.5rem;
		line-height: 1;
	}

	/* Search */
	.search-container {
		position: relative;
		margin-bottom: 20px;
	}

	.search-input {
		width: 100%;
		padding: 14px 40px 14px 16px;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		font-size: 1rem;
		background: white;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.search-input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.search-clear {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 32px;
		height: 32px;
		border: none;
		background: #e2e8f0;
		border-radius: 50%;
		font-size: 1.5rem;
		line-height: 1;
		color: #64748b;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-clear:active {
		background: #cbd5e1;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #64748b;
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	/* Plays List */
	.plays-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.play-item {
		background: white;
		border-radius: 12px;
		padding: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.play-content {
		flex: 1;
		min-width: 0;
	}

	.play-game {
		font-size: 1.0625rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 6px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.play-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		color: #64748b;
	}

	.play-result {
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 0.75rem;
	}

	.play-result.won {
		background: #d1fae5;
		color: #065f46;
	}

	.play-result.lost {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn-delete {
		padding: 8px 16px;
		background: #fee2e2;
		color: #991b1b;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.2s;
	}

	.btn-delete:active {
		background: #fecaca;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		z-index: 1000;
		animation: fadeIn 0.2s;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal {
		background: white;
		width: 100%;
		border-radius: 20px 20px 0 0;
		padding: 24px;
		max-height: 90vh;
		overflow-y: auto;
		animation: slideUp 0.3s;
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #1e293b;
	}

	.modal-close {
		width: 36px;
		height: 36px;
		border: none;
		background: #f1f5f9;
		border-radius: 50%;
		font-size: 1.5rem;
		line-height: 1;
		color: #64748b;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:active {
		background: #e2e8f0;
	}

	/* Form */
	.form-group {
		margin-bottom: 20px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		color: #1e293b;
	}

	input[type="text"],
	input[type="date"],
	input[type="number"],
	select {
		width: 100%;
		padding: 12px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		background: white;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #6366f1;
	}

	input:disabled {
		background: #f8fafc;
		color: #94a3b8;
	}

	/* Result Options */
	.result-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.result-option {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.result-option input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.result-option.selected {
		border-color: #6366f1;
		background: #eef2ff;
		color: #6366f1;
	}

	/* Modal Actions */
	.modal-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 24px;
	}

	.btn {
		padding: 14px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #6366f1;
		color: white;
	}

	.btn-primary:active {
		background: #4f46e5;
	}

	.btn-secondary {
		background: #f1f5f9;
		color: #475569;
	}

	.btn-secondary:active {
		background: #e2e8f0;
	}

	/* Desktop Adjustments */
	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.modal-backdrop {
			align-items: center;
			justify-content: center;
		}

		.modal {
			width: 100%;
			max-width: 500px;
			border-radius: 20px;
			max-height: none;
			animation: scaleIn 0.3s;
		}

		@keyframes scaleIn {
			from { 
				opacity: 0;
				transform: scale(0.95);
			}
			to { 
				opacity: 1;
				transform: scale(1);
			}
		}
	}
</style>
