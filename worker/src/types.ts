/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
	DB: D1Database;
	API_KEY: string;
}

/**
 * Board game from BoardGameGeek collection export
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
 * A recorded play of a board game
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
 * Sync metadata for tracking device synchronization
 */
export interface SyncMetadata {
	id?: number;
	device_id: string;
	table_name: string;
	last_sync: string;
	created_at?: string;
	updated_at?: string;
}

/**
 * User for multi-user support (future)
 */
export interface User {
	id?: number;
	email: string;
	api_key: string;
	created_at?: string;
	updated_at?: string;
}

/**
 * BGG collection CSV row
 */
export interface BGGCollectionRow {
	objectname: string;
	objectid: string;
	rating: string;
	numplays: string;
	own: string;
	minplayers: string;
	maxplayers: string;
	playingtime: string;
	yearpublished: string;
	average: string;
	avgweight: string;
	rank: string;
	itemtype: string;
	bggrecplayers: string;
	bggbestplayers: string;
	imageid: string;
}
