/**
 * @typedef {Object} Game
 * @property {string} id - UUID
 * @property {string} name
 * @property {boolean} is_expansion
 * @property {string} [parent_game_id]
 * @property {boolean} co_op - Is this a cooperative game?
 * @property {string} created_at - ISO date
 */

/**
 * @typedef {Object} Play
 * @property {string} id - UUID
 * @property {string} game_id
 * @property {string} date_played - ISO date (renamed from played_at)
 * @property {number} [place] - 1=1st, 2=2nd, etc. For co-op: 1=won, -1=lost
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
 * @property {number} total_wins - 1st place finishes or co-op wins
 * @property {number} total_losses - Co-op losses only
 */

/**
 * @typedef {Play & { game_name: string, game_co_op: boolean }} PlayWithGame
 */

export {};
