/**
 * A board game or expansion
 */
export interface Game {
	id?: number;
	name: string;
	is_expansion: boolean;
	parent_game_id?: number;
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
	expansion_ids?: string;
	notes?: string;
	duration_minutes?: number;
	created_at?: string;
	updated_at?: string;
}
