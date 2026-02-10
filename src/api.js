/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * API error class for handling HTTP errors
 */
export class ApiError extends Error {
	/**
	 * @param {string} message
	 * @param {number} status
	 */
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

/**
 * Make an API request with error handling
 * @template T
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
async function request(endpoint, options = {}) {
	const url = `${API_BASE_URL}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new ApiError(
			errorData.error || `HTTP ${response.status}: ${response.statusText}`,
			response.status
		);
	}

	return response.json();
}

/**
 * Games API
 */
export const gamesApi = {
	/**
	 * Get all games
	 * @returns {Promise<import('./types.js').Game[]>}
	 */
	getAll: () => request('/api/games'),

	/**
	 * Get a game by ID
	 * @param {string} id
	 * @returns {Promise<import('./types.js').Game>}
	 */
	getById: (id) => request(`/api/games/${id}`),

	/**
	 * Create a new game
	 * @param {string} name
	 * @param {boolean} [isExpansion]
	 * @param {string} [parentGameId]
	 * @param {boolean} [coOp]
	 * @returns {Promise<{id: string}>}
	 */
	create: (name, isExpansion = false, parentGameId, coOp = false) =>
		request('/api/games', {
			method: 'POST',
			body: JSON.stringify({
				name,
				is_expansion: isExpansion,
				parent_game_id: parentGameId,
				co_op: coOp,
			}),
		}),

	/**
	 * Get expansions for a game
	 * @param {string} gameId
	 * @returns {Promise<import('./types.js').Game[]>}
	 */
	getExpansions: (gameId) => request(`/api/games/${gameId}/expansions`),

	/**
	 * Update a game
	 * @param {string} id
	 * @param {Partial<import('./types.js').Game>} game
	 * @returns {Promise<{success: boolean}>}
	 */
	update: (id, game) =>
		request(`/api/games/${id}`, {
			method: 'PUT',
			body: JSON.stringify(game),
		}),

	/**
	 * Delete a game
	 * @param {string} id
	 * @returns {Promise<{success: boolean}>}
	 */
	delete: (id) =>
		request(`/api/games/${id}`, {
			method: 'DELETE',
		}),
};

/**
 * Plays API
 */
export const playsApi = {
	/**
	 * Get all plays, optionally filtered by game
	 * @param {string} [gameId]
	 * @returns {Promise<import('./types.js').PlayWithGame[]>}
	 */
	getAll: (gameId) => {
		const params = gameId ? `?game_id=${gameId}` : '';
		return request(`/api/plays${params}`);
	},

	/**
	 * Get a play by ID
	 * @param {string} id
	 * @returns {Promise<import('./types.js').Play>}
	 */
	getById: (id) => request(`/api/plays/${id}`),

	/**
	 * Create a new play
	 * @param {Omit<import('./types.js').Play, 'id' | 'created_at' | 'updated_at'>} play
	 * @returns {Promise<{id: string}>}
	 */
	create: (play) =>
		request('/api/plays', {
			method: 'POST',
			body: JSON.stringify(play),
		}),

	/**
	 * Update a play
	 * @param {string} id
	 * @param {Partial<import('./types.js').Play>} play
	 * @returns {Promise<{success: boolean}>}
	 */
	update: (id, play) =>
		request(`/api/plays/${id}`, {
			method: 'PUT',
			body: JSON.stringify(play),
		}),

	/**
	 * Delete a play
	 * @param {string} id
	 * @returns {Promise<{success: boolean}>}
	 */
	delete: (id) =>
		request(`/api/plays/${id}`, {
			method: 'DELETE',
		}),
};

/**
 * Stats API
 */
export const statsApi = {
	/**
	 * Get play statistics
	 * @returns {Promise<import('./types.js').Stats>}
	 */
	get: () => request('/api/stats'),
};

/**
 * Health check API
 */
export const healthApi = {
	/**
	 * Check API health status
	 * @returns {Promise<{status: string, timestamp: string}>}
	 */
	check: () => request('/health'),
};
