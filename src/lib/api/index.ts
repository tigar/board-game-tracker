import type { Game, Play } from '../db';

/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * API error class for handling HTTP errors
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/**
 * Make an API request with error handling
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
	 */
	getAll: (): Promise<Game[]> => request('/api/games'),

	/**
	 * Get a game by ID
	 */
	getById: (id: number): Promise<Game> => request(`/api/games/${id}`),

	/**
	 * Create a new game
	 */
	create: (game: Omit<Game, 'id'>): Promise<{ id: number }> =>
		request('/api/games', {
			method: 'POST',
			body: JSON.stringify(game),
		}),

	/**
	 * Update a game
	 */
	update: (id: number, game: Partial<Game>): Promise<{ success: boolean }> =>
		request(`/api/games/${id}`, {
			method: 'PUT',
			body: JSON.stringify(game),
		}),

	/**
	 * Delete a game
	 */
	delete: (id: number): Promise<{ success: boolean }> =>
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
	 */
	getAll: (gameId?: number): Promise<(Play & { game_name: string })[]> => {
		const params = gameId ? `?game_id=${gameId}` : '';
		return request(`/api/plays${params}`);
	},

	/**
	 * Get a play by ID
	 */
	getById: (id: number): Promise<Play> => request(`/api/plays/${id}`),

	/**
	 * Create a new play
	 */
	create: (play: Omit<Play, 'id'>): Promise<{ id: number }> =>
		request('/api/plays', {
			method: 'POST',
			body: JSON.stringify(play),
		}),

	/**
	 * Update a play
	 */
	update: (id: number, play: Partial<Play>): Promise<{ success: boolean }> =>
		request(`/api/plays/${id}`, {
			method: 'PUT',
			body: JSON.stringify(play),
		}),

	/**
	 * Delete a play
	 */
	delete: (id: number): Promise<{ success: boolean }> =>
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
	 */
	get: (): Promise<{
		total_plays: number;
		total_games_played: number;
		total_wins: number;
		total_losses: number;
	}> => request('/api/stats'),
};

/**
 * Collection import API
 */
export const collectionApi = {
	/**
	 * Import games from BGG CSV export
	 */
	importCSV: async (
		csvContent: string
	): Promise<{
		imported: number;
		updated: number;
		total: number;
	}> => {
		const url = `${API_BASE_URL}/api/collection/import`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/csv',
			},
			body: csvContent,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				errorData.error || `HTTP ${response.status}: ${response.statusText}`,
				response.status
			);
		}

		return response.json();
	},
};

/**
 * Health check API
 */
export const healthApi = {
	/**
	 * Check API health status
	 */
	check: (): Promise<{ status: string; timestamp: string }> => request('/health'),
};
