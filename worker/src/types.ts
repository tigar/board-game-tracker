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
	sides?: string[] | null; // Named asymmetric roles, e.g. ['Jack', 'Investigators']
	owned?: boolean; // Shelf inventory only — absent means owned. Does not affect logging;
	// traded-away games are still playable at a friend's table
	min_players?: number | null;
	max_players?: number | null;
	playing_time?: number | null;
	year_published?: number | null;
	created_at: string;
}

/**
 * A person who plays games
 */
export interface Person {
	id: string; // UUID
	name: string;
	created_at: string;
}

/**
 * How a play ended, from the perspective of the person keeping the log
 */
export type PlayResult = 'win' | 'loss' | 'draw';

/**
 * A recorded play of a board game.
 *
 * `result` is the primitive — every game produces one. `place` is an optional
 * refinement for the games where finishing position was worth recording.
 */
export interface Play {
	id: string; // UUID
	game_id: string;
	date_played: string; // Renamed from played_at
	result?: PlayResult | null;
	place?: number | null; // 1=1st, 2=2nd. Competitive games only.
	side?: string | null; // Which of the game's sides was played
	player_ids?: string[]; // Who was at the table
	number_of_players: number; // Renamed from player_count
	expansion_ids?: string[]; // Array of expansion IDs
	notes?: string;
	duration_minutes?: number;
	created_at: string;
	updated_at: string;
}

/**
 * Play with joined game and people data
 */
export interface PlayWithGame extends Play {
	game_name: string;
	game_co_op: boolean;
	game_sides?: string[] | null;
	player_names: string[];
}

/**
 * Stats response
 */
export interface Stats {
	total_plays: number;
	total_games_played: number;
	total_wins: number;
	total_losses: number;
}

/**
 * Data stored in KV
 */
export interface UserData {
	games: Game[];
	plays: Play[];
	people: Person[];
}
