import * as kv from './kv';
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
 * Simple API key authentication (for future use)
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
		// For initial development, we'll skip auth. Add back later with OAuth.
		// if (!authenticateRequest(request, env)) {
		// 	return errorResponse('Unauthorized', 401);
		// }

		try {
			// Games endpoints
			if (path === '/api/games' && request.method === 'GET') {
				const games = await kv.getAllGames(env.KV);
				return jsonResponse(games);
			}

			// Get expansions for a game
			if (path.match(/^\/api\/games\/[^/]+\/expansions$/) && request.method === 'GET') {
				const id = path.split('/')[3];
				const expansions = await kv.getExpansionsForGame(env.KV, id);
				return jsonResponse(expansions);
			}

			if (path.match(/^\/api\/games\/[^/]+$/) && request.method === 'GET') {
				const id = path.split('/').pop() || '';
				const game = await kv.getGameById(env.KV, id);
				if (!game) {
					return errorResponse('Game not found', 404);
				}
				return jsonResponse(game);
			}

			if (path === '/api/games' && request.method === 'POST') {
				const { name, is_expansion, parent_game_id, co_op } = (await request.json()) as {
					name: string;
					is_expansion?: boolean;
					parent_game_id?: string;
					co_op?: boolean;
				};

				if (!name?.trim()) {
					return errorResponse('Game name is required');
				}

				// For base games, check if it already exists
				if (!is_expansion) {
					const existing = await kv.getGameByName(env.KV, name.trim());
					if (existing) {
						return jsonResponse({ id: existing.id }, 200);
					}
				}

				const id = await kv.createGame(env.KV, {
					name: name.trim(),
					is_expansion: is_expansion || false,
					parent_game_id,
					co_op: co_op || false,
				});
				return jsonResponse({ id }, 201);
			}

			if (path.match(/^\/api\/games\/[^/]+$/) && request.method === 'PUT') {
				const id = path.split('/').pop() || '';
				const game = (await request.json()) as Partial<Game>;
				await kv.updateGame(env.KV, id, game);
				return jsonResponse({ success: true });
			}

			if (path.match(/^\/api\/games\/[^/]+$/) && request.method === 'DELETE') {
				const id = path.split('/').pop() || '';
				await kv.deleteGame(env.KV, id);
				return jsonResponse({ success: true });
			}

			// Plays endpoints
			if (path === '/api/plays' && request.method === 'GET') {
				const gameId = url.searchParams.get('game_id') || undefined;
				const plays = await kv.getAllPlays(env.KV, gameId);
				return jsonResponse(plays);
			}

			if (path.match(/^\/api\/plays\/[^/]+$/) && request.method === 'GET') {
				const id = path.split('/').pop() || '';
				const play = await kv.getPlayById(env.KV, id);
				if (!play) {
					return errorResponse('Play not found', 404);
				}
				return jsonResponse(play);
			}

			if (path === '/api/plays' && request.method === 'POST') {
				const play = (await request.json()) as Omit<Play, 'id' | 'created_at' | 'updated_at'>;
				const id = await kv.createPlay(env.KV, play);
				return jsonResponse({ id }, 201);
			}

			if (path.match(/^\/api\/plays\/[^/]+$/) && request.method === 'PUT') {
				const id = path.split('/').pop() || '';
				const play = (await request.json()) as Partial<Play>;
				await kv.updatePlay(env.KV, id, play);
				return jsonResponse({ success: true });
			}

			if (path.match(/^\/api\/plays\/[^/]+$/) && request.method === 'DELETE') {
				const id = path.split('/').pop() || '';
				await kv.deletePlay(env.KV, id);
				return jsonResponse({ success: true });
			}

		// Stats endpoint
		if (path === '/api/stats' && request.method === 'GET') {
			const stats = await kv.getPlayStats(env.KV);
			return jsonResponse(stats);
		}

		// Seed endpoint - loads games from seed-data.json
		if (path === '/api/seed' && request.method === 'POST') {
			const body = (await request.json().catch(() => ({}))) as { mode?: 'replace' | 'merge' };
			const mode = body.mode === 'replace' ? 'replace' : 'merge';
			const result = await kv.seedGamesFromCollection(env.KV, mode);
			return jsonResponse({
				success: true,
				mode,
				...result,
			});
		}

		// 404 for unknown routes
		return errorResponse('Not found', 404);
		} catch (error) {
			console.error('Worker error:', error);
			return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
		}
	},
};
