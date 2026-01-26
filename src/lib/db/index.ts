import type { EntityTable } from 'dexie';
import Dexie from 'dexie';

/**
 * Board game interface matching backend schema
 */
export interface Game {
	id?: number;
	bgg_id: number;
	name: string;
	image_url?: string;
	thumbnail_url?: string;
	min_players?: number;
	max_players?: number;
	playing_time?: number;
	year_published?: number;
	description?: string;
	user_rating?: number;
	bgg_rating?: number;
	complexity?: number;
	bgg_rank?: number;
	item_type?: 'standalone' | 'expansion';
	recommended_players?: string;
	best_players?: string;
	last_synced_at?: string;
	created_at?: string;
	updated_at?: string;
}

/**
 * Play record interface matching backend schema
 */
export interface Play {
	id?: number;
	game_id: number;
	played_at: string;
	won?: boolean;
	player_count: number;
	notes?: string;
	duration_minutes?: number;
	created_at?: string;
	updated_at?: string;
}

/**
 * Sync queue for offline changes
 */
export interface SyncQueueItem {
	id?: number;
	operation: 'create' | 'update' | 'delete';
	table: 'games' | 'plays';
	record_id?: number;
	data?: unknown;
	created_at: string;
	synced: boolean;
}

/**
 * IndexedDB database using Dexie
 */
class BoardGameDatabase extends Dexie {
	games!: EntityTable<Game, 'id'>;
	plays!: EntityTable<Play, 'id'>;
	syncQueue!: EntityTable<SyncQueueItem, 'id'>;

	constructor() {
		super('BoardGameTracker');

		this.version(2).stores({
			games: '++id, bgg_id, name, item_type, user_rating, created_at',
			plays: '++id, game_id, played_at, created_at',
			syncQueue: '++id, synced, created_at',
		});
	}
}

// Create database instance
export const db = new BoardGameDatabase();

/**
 * Helper functions for common operations
 */

/**
 * Get all games
 */
export async function getAllGames(): Promise<Game[]> {
	return db.games.orderBy('name').toArray();
}

/**
 * Get game by ID
 */
export async function getGameById(id: number): Promise<Game | undefined> {
	return db.games.get(id);
}

/**
 * Get game by BGG ID
 */
export async function getGameByBGGId(bggId: number): Promise<Game | undefined> {
	return db.games.where('bgg_id').equals(bggId).first();
}

/**
 * Add or update game
 */
export async function upsertGame(game: Game): Promise<number> {
	if (game.id) {
		await db.games.update(game.id, game);
		return game.id;
	}

	// Check if game with this BGG ID exists
	const existing = await getGameByBGGId(game.bgg_id);
	if (existing?.id) {
		await db.games.update(existing.id, game);
		return existing.id;
	}

	return db.games.add(game);
}

/**
 * Delete game
 */
export async function deleteGame(id: number): Promise<void> {
	await db.games.delete(id);
	// Also delete associated plays
	await db.plays.where('game_id').equals(id).delete();
}

/**
 * Get all plays, optionally filtered by game
 */
export async function getAllPlays(gameId?: number): Promise<Play[]> {
	if (gameId) {
		return db.plays.where('game_id').equals(gameId).reverse().sortBy('played_at');
	}
	return db.plays.orderBy('played_at').reverse().toArray();
}

/**
 * Get play by ID
 */
export async function getPlayById(id: number): Promise<Play | undefined> {
	return db.plays.get(id);
}

/**
 * Add play
 */
export async function addPlay(play: Play): Promise<number> {
	play.created_at = new Date().toISOString();
	play.updated_at = play.created_at;
	return db.plays.add(play);
}

/**
 * Update play
 */
export async function updatePlay(id: number, play: Partial<Play>): Promise<void> {
	play.updated_at = new Date().toISOString();
	await db.plays.update(id, play);
}

/**
 * Delete play
 */
export async function deletePlay(id: number): Promise<void> {
	await db.plays.delete(id);
}

/**
 * Get play statistics
 */
export async function getPlayStats(): Promise<{
	total_plays: number;
	total_games_played: number;
	total_wins: number;
	total_losses: number;
}> {
	const plays = await db.plays.toArray();

	const total_plays = plays.length;
	const gameIds = new Set(plays.map((p) => p.game_id));
	const total_games_played = gameIds.size;
	const total_wins = plays.filter((p) => p.won === true).length;
	const total_losses = plays.filter((p) => p.won === false).length;

	return {
		total_plays,
		total_games_played,
		total_wins,
		total_losses,
	};
}

/**
 * Queue an operation for sync
 */
export async function queueSync(
	operation: 'create' | 'update' | 'delete',
	table: 'games' | 'plays',
	recordId?: number,
	data?: unknown
): Promise<void> {
	await db.syncQueue.add({
		operation,
		table,
		record_id: recordId,
		data,
		created_at: new Date().toISOString(),
		synced: false,
	});
}

/**
 * Get pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
	return db.syncQueue.where('synced').equals(false).toArray();
}

/**
 * Mark sync item as completed
 */
export async function markSyncComplete(id: number): Promise<void> {
	await db.syncQueue.update(id, { synced: true });
}

/**
 * Clear synced items older than 7 days
 */
export async function clearOldSyncItems(): Promise<void> {
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	const cutoff = sevenDaysAgo.toISOString();

	await db.syncQueue
		.where('synced')
		.equals(true)
		.and((item) => item.created_at < cutoff)
		.delete();
}
