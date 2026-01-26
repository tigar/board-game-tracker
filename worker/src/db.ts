import type { Game, Play, SyncMetadata } from './types';

/**
 * Database operations for Cloudflare D1
 */

/**
 * Get all games from the database
 */
export async function getAllGames(db: D1Database): Promise<Game[]> {
	const result = await db.prepare('SELECT * FROM games ORDER BY name ASC').all<Game>();
	return result.results || [];
}

/**
 * Get a game by ID
 */
export async function getGameById(db: D1Database, id: number): Promise<Game | null> {
	const result = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first<Game>();
	return result;
}

/**
 * Get a game by BGG ID
 */
export async function getGameByBGGId(db: D1Database, bggId: number): Promise<Game | null> {
	const result = await db.prepare('SELECT * FROM games WHERE bgg_id = ?').bind(bggId).first<Game>();
	return result;
}

/**
 * Create a new game
 */
export async function createGame(db: D1Database, game: Game): Promise<number> {
	const result = await db
		.prepare(
			`INSERT INTO games (bgg_id, name, image_url, thumbnail_url, min_players, max_players, playing_time, year_published, description, user_rating, bgg_rating, complexity, bgg_rank, item_type, recommended_players, best_players)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			game.bgg_id,
			game.name,
			game.image_url || null,
			game.thumbnail_url || null,
			game.min_players || null,
			game.max_players || null,
			game.playing_time || null,
			game.year_published || null,
			game.description || null,
			game.user_rating || null,
			game.bgg_rating || null,
			game.complexity || null,
			game.bgg_rank || null,
			game.item_type || 'standalone',
			game.recommended_players || null,
			game.best_players || null
		)
		.run();

	return result.meta.last_row_id as number;
}

/**
 * Update an existing game
 */
export async function updateGame(db: D1Database, id: number, game: Partial<Game>): Promise<void> {
	await db
		.prepare(
			`UPDATE games SET
				name = COALESCE(?, name),
				image_url = COALESCE(?, image_url),
				thumbnail_url = COALESCE(?, thumbnail_url),
				min_players = COALESCE(?, min_players),
				max_players = COALESCE(?, max_players),
				playing_time = COALESCE(?, playing_time),
				year_published = COALESCE(?, year_published),
				description = COALESCE(?, description),
				user_rating = COALESCE(?, user_rating),
				bgg_rating = COALESCE(?, bgg_rating),
				complexity = COALESCE(?, complexity),
				bgg_rank = COALESCE(?, bgg_rank),
				item_type = COALESCE(?, item_type),
				recommended_players = COALESCE(?, recommended_players),
				best_players = COALESCE(?, best_players),
				last_synced_at = CURRENT_TIMESTAMP
			WHERE id = ?`
		)
		.bind(
			game.name || null,
			game.image_url || null,
			game.thumbnail_url || null,
			game.min_players || null,
			game.max_players || null,
			game.playing_time || null,
			game.year_published || null,
			game.description || null,
			game.user_rating || null,
			game.bgg_rating || null,
			game.complexity || null,
			game.bgg_rank || null,
			game.item_type || null,
			game.recommended_players || null,
			game.best_players || null,
			id
		)
		.run();
}

/**
 * Delete a game
 */
export async function deleteGame(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM games WHERE id = ?').bind(id).run();
}

/**
 * Get all plays, optionally filtered by game_id
 */
export async function getAllPlays(
	db: D1Database,
	gameId?: number
): Promise<(Play & { game_name: string })[]> {
	let query = `
		SELECT plays.*, games.name as game_name
		FROM plays
		JOIN games ON plays.game_id = games.id
	`;

	if (gameId) {
		query += ' WHERE plays.game_id = ?';
		const result = await db
			.prepare(`${query} ORDER BY plays.played_at DESC`)
			.bind(gameId)
			.all<Play & { game_name: string }>();
		return result.results || [];
	}

	const result = await db
		.prepare(`${query} ORDER BY plays.played_at DESC`)
		.all<Play & { game_name: string }>();
	return result.results || [];
}

/**
 * Get a play by ID
 */
export async function getPlayById(db: D1Database, id: number): Promise<Play | null> {
	const result = await db.prepare('SELECT * FROM plays WHERE id = ?').bind(id).first<Play>();
	return result;
}

/**
 * Create a new play record
 */
export async function createPlay(db: D1Database, play: Play): Promise<number> {
	const result = await db
		.prepare(
			`INSERT INTO plays (game_id, played_at, won, player_count, notes, duration_minutes)
			VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(
			play.game_id,
			play.played_at,
			play.won !== undefined ? (play.won ? 1 : 0) : null,
			play.player_count,
			play.notes || null,
			play.duration_minutes || null
		)
		.run();

	return result.meta.last_row_id as number;
}

/**
 * Update an existing play
 */
export async function updatePlay(db: D1Database, id: number, play: Partial<Play>): Promise<void> {
	await db
		.prepare(
			`UPDATE plays SET
				played_at = COALESCE(?, played_at),
				won = COALESCE(?, won),
				player_count = COALESCE(?, player_count),
				notes = COALESCE(?, notes),
				duration_minutes = COALESCE(?, duration_minutes)
			WHERE id = ?`
		)
		.bind(
			play.played_at || null,
			play.won !== undefined ? (play.won ? 1 : 0) : null,
			play.player_count || null,
			play.notes || null,
			play.duration_minutes || null,
			id
		)
		.run();
}

/**
 * Delete a play
 */
export async function deletePlay(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM plays WHERE id = ?').bind(id).run();
}

/**
 * Get sync metadata for a device and table
 */
export async function getSyncMetadata(
	db: D1Database,
	deviceId: string,
	tableName: string
): Promise<SyncMetadata | null> {
	const result = await db
		.prepare('SELECT * FROM sync_metadata WHERE device_id = ? AND table_name = ?')
		.bind(deviceId, tableName)
		.first<SyncMetadata>();
	return result;
}

/**
 * Update or create sync metadata
 */
export async function upsertSyncMetadata(
	db: D1Database,
	deviceId: string,
	tableName: string
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO sync_metadata (device_id, table_name, last_sync)
			VALUES (?, ?, CURRENT_TIMESTAMP)
			ON CONFLICT(device_id, table_name) DO UPDATE SET last_sync = CURRENT_TIMESTAMP`
		)
		.bind(deviceId, tableName)
		.run();
}

/**
 * Get play statistics
 */
export async function getPlayStats(db: D1Database): Promise<{
	total_plays: number;
	total_games_played: number;
	total_wins: number;
	total_losses: number;
}> {
	const result = await db
		.prepare(
			`SELECT
				COUNT(*) as total_plays,
				COUNT(DISTINCT game_id) as total_games_played,
				SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as total_wins,
				SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) as total_losses
			FROM plays`
		)
		.first<{
			total_plays: number;
			total_games_played: number;
			total_wins: number;
			total_losses: number;
		}>();

	return (
		result || {
			total_plays: 0,
			total_games_played: 0,
			total_wins: 0,
			total_losses: 0,
		}
	);
}
