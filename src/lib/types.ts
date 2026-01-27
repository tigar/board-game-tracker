/**
 * A board game
 */
export interface Game {
	id?: number;
	name: string;
	created_at?: string;
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
