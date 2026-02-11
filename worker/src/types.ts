/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
	KV: KVNamespace;
	API_KEY: string;
}

/**
 * A board game or expansion
 */
export interface Game {
	id: string; // UUID
	bgg_id?: number; // BoardGameGeek ID
	name: string;
	is_expansion: boolean;
	parent_game_id?: string | null;
	co_op: boolean; // Is this a cooperative game?
	min_players?: number | null;
	max_players?: number | null;
	playing_time?: number | null;
	year_published?: number | null;
	created_at: string;
}

/**
 * A recorded play of a board game
 */
export interface Play {
	id: string; // UUID
	game_id: string;
	date_played: string; // Renamed from played_at
	place?: number; // 1=1st, 2=2nd, etc. For co-op: 1=won, -1=lost
	number_of_players: number; // Renamed from player_count
	expansion_ids?: string[]; // Array of expansion IDs
	notes?: string;
	duration_minutes?: number;
	created_at: string;
	updated_at: string;
}

/**
 * Play with joined game data
 */
export interface PlayWithGame extends Play {
	game_name: string;
	game_co_op: boolean;
}

/**
 * Stats response
 */
export interface Stats {
	total_plays: number;
	total_games_played: number;
	total_wins: number; // 1st place or co-op wins
	total_losses: number; // co-op losses
}

/**
 * Data stored in KV
 */
export interface UserData {
	games: Game[];
	plays: Play[];
}
