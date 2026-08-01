/**
 * @typedef {Object} Game
 * @property {string} id - UUID
 * @property {string} name
 * @property {boolean} is_expansion
 * @property {string} [parent_game_id]
 * @property {boolean} co_op - Is this a cooperative game?
 * @property {string[] | null} [sides] - Named asymmetric roles, e.g. ['Jack', 'Investigators']
 * @property {boolean} [owned] - Shelf inventory only; absent means owned. Not a logging filter
 * @property {number | null} [min_players]
 * @property {number | null} [max_players]
 * @property {string} created_at - ISO date
 */

/**
 * @typedef {Object} Person
 * @property {string} id - UUID
 * @property {string} name
 * @property {string} created_at
 */

/**
 * @typedef {'win' | 'loss' | 'draw'} PlayResult
 */

/**
 * A recorded play. `result` is the primitive — every game produces one.
 * `place` is an optional refinement for games where the finish was worth noting.
 *
 * @typedef {Object} Play
 * @property {string} id - UUID
 * @property {string} game_id
 * @property {string} date_played - ISO date (renamed from played_at)
 * @property {PlayResult | null} [result]
 * @property {number | null} [place] - 1=1st, 2=2nd. Competitive games only.
 * @property {string | null} [side] - Which of the game's sides was played
 * @property {string[]} [player_ids] - Who was at the table
 * @property {number} number_of_players - (renamed from player_count)
 * @property {string[]} [expansion_ids] - Array of expansion IDs
 * @property {string} [notes]
 * @property {number} [duration_minutes]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Stats
 * @property {number} total_plays
 * @property {number} total_games_played
 * @property {number} total_wins
 * @property {number} total_losses
 */

/**
 * @typedef {Play & {
 *   game_name: string,
 *   game_co_op: boolean,
 *   game_sides?: string[] | null,
 *   player_names: string[]
 * }} PlayWithGame
 */

export {};
