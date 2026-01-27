import * as db from './db';
import type { Env, Game, Play } from './types';

/**
 * CORS headers for API responses
 */
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
	return new Response(null, {
		headers: corsHeaders,
	});
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}

/**
 * Create error response
 */
function errorResponse(message: string, status = 400): Response {
	return jsonResponse({ error: message }, status);
}

/**
 * Simple API key authentication
 */
function _authenticateRequest(request: Request, env: Env): boolean {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) return false;

	const token = authHeader.replace('Bearer ', '');
	return token === env.API_KEY;
}

/**
 * Main worker request handler
 */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return handleOptions();
		}

		// Public endpoints (no auth required)
		if (path === '/health') {
			return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
		}

		// Protected endpoints - require authentication
		// For initial development, we'll skip auth. Add back later.
		// if (!authenticateRequest(request, env)) {
		// 	return errorResponse('Unauthorized', 401);
		// }

		try {
			// Games endpoints
			if (path === '/api/games' && request.method === 'GET') {
				const games = await db.getAllGames(env.DB);
				return jsonResponse(games);
			}

			// Get expansions for a game
			if (path.match(/^\/api\/games\/\d+\/expansions$/) && request.method === 'GET') {
				const id = Number.parseInt(path.split('/')[3], 10);
				const expansions = await db.getExpansionsForGame(env.DB, id);
				return jsonResponse(expansions);
			}

			if (path.startsWith('/api/games/') && request.method === 'GET') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				const game = await db.getGameById(env.DB, id);
				if (!game) {
					return errorResponse('Game not found', 404);
				}
				return jsonResponse(game);
			}

			if (path === '/api/games' && request.method === 'POST') {
				const { name, is_expansion, parent_game_id } = (await request.json()) as {
					name: string;
					is_expansion?: boolean;
					parent_game_id?: number;
				};

				if (!name?.trim()) {
					return errorResponse('Game name is required');
				}

				// For base games, check if it already exists
				if (!is_expansion) {
					const existing = await db.getGameByName(env.DB, name.trim());
					if (existing) {
						return jsonResponse({ id: existing.id }, 200);
					}
				}

				const id = await db.createGame(env.DB, {
					name: name.trim(),
					is_expansion: is_expansion || false,
					parent_game_id,
				});
				return jsonResponse({ id }, 201);
			}

			if (path.startsWith('/api/games/') && request.method === 'PUT') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				const game = (await request.json()) as Partial<Game>;
				await db.updateGame(env.DB, id, game);
				return jsonResponse({ success: true });
			}

			if (path.startsWith('/api/games/') && request.method === 'DELETE') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				await db.deleteGame(env.DB, id);
				return jsonResponse({ success: true });
			}

			// Plays endpoints
			if (path === '/api/plays' && request.method === 'GET') {
				const gameId = url.searchParams.get('game_id');
				const plays = await db.getAllPlays(
					env.DB,
					gameId ? Number.parseInt(gameId, 10) : undefined
				);
				return jsonResponse(plays);
			}

			if (path.startsWith('/api/plays/') && request.method === 'GET') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				const play = await db.getPlayById(env.DB, id);
				if (!play) {
					return errorResponse('Play not found', 404);
				}
				return jsonResponse(play);
			}

			if (path === '/api/plays' && request.method === 'POST') {
				const play = (await request.json()) as Play;
				const id = await db.createPlay(env.DB, play);
				return jsonResponse({ id }, 201);
			}

			if (path.startsWith('/api/plays/') && request.method === 'PUT') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				const play = (await request.json()) as Partial<Play>;
				await db.updatePlay(env.DB, id, play);
				return jsonResponse({ success: true });
			}

			if (path.startsWith('/api/plays/') && request.method === 'DELETE') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				await db.deletePlay(env.DB, id);
				return jsonResponse({ success: true });
			}

			// Stats endpoint
			if (path === '/api/stats' && request.method === 'GET') {
				const stats = await db.getPlayStats(env.DB);
				return jsonResponse(stats);
			}

			// 404 for unknown routes
			return errorResponse('Not found', 404);
		} catch (error) {
			console.error('Worker error:', error);
			return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
		}
	},
};
