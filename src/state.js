/**
 * Simple reactive state management using pub/sub pattern
 */

/**
 * @typedef {Object} AppState
 * @property {boolean} loading
 * @property {import('./types.js').Game[]} games
 * @property {import('./types.js').PlayWithGame[]} plays
 * @property {import('./types.js').Stats} stats
 * @property {string} searchQuery
 * @property {boolean} showAddPlayModal
 */

/** @type {AppState} */
const initialState = {
	loading: true,
	games: [],
	plays: [],
	stats: {
		total_plays: 0,
		total_games_played: 0,
		total_wins: 0,
		total_losses: 0,
	},
	searchQuery: '',
	showAddPlayModal: false,
};

/** @type {AppState} */
let state = { ...initialState };

/** @type {Set<(state: AppState) => void>} */
const subscribers = new Set();

/**
 * Get current state (readonly)
 * @returns {Readonly<AppState>}
 */
export function getState() {
	return state;
}

/**
 * Update state and notify subscribers
 * @param {Partial<AppState>} updates
 */
export function setState(updates) {
	state = { ...state, ...updates };
	notifySubscribers();
}

/**
 * Subscribe to state changes
 * @param {(state: AppState) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(callback) {
	subscribers.add(callback);
	// Immediately call with current state
	callback(state);
	return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
	for (const callback of subscribers) {
		callback(state);
	}
}

/**
 * Get filtered plays based on search query
 * @returns {import('./types.js').PlayWithGame[]}
 */
export function getFilteredPlays() {
	const { plays, searchQuery } = state;
	if (!searchQuery.trim()) {
		return plays;
	}
	const query = searchQuery.toLowerCase();
	return plays.filter((p) => p.game_name.toLowerCase().includes(query));
}

/**
 * Reset state to initial values
 */
export function resetState() {
	state = { ...initialState };
	notifySubscribers();
}
