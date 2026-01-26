import { parseCollectionCSV } from './bgg';
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

		// Import collection from BGG CSV export
		if (path === '/api/collection/import' && request.method === 'POST') {
			try {
				const csvText = await request.text();
				if (!csvText.trim()) {
					return errorResponse('CSV data is required');
				}

				const games = parseCollectionCSV(csvText);
				if (games.length === 0) {
					return errorResponse('No valid games found in CSV');
				}

				let imported = 0;
				let updated = 0;

				for (const game of games) {
					const existing = await db.getGameByBGGId(env.DB, game.bgg_id);
					if (existing) {
						await db.updateGame(env.DB, existing.id as number, game);
						updated++;
					} else {
						await db.createGame(env.DB, game);
						imported++;
					}
				}

				return jsonResponse({ imported, updated, total: games.length });
			} catch (error) {
				return errorResponse(
					error instanceof Error ? error.message : 'Failed to import collection',
					500
				);
			}
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

			if (path.startsWith('/api/games/') && request.method === 'GET') {
				const id = Number.parseInt(path.split('/').pop() || '0', 10);
				const game = await db.getGameById(env.DB, id);
				if (!game) {
					return errorResponse('Game not found', 404);
				}
				return jsonResponse(game);
			}

			if (path === '/api/games' && request.method === 'POST') {
				const game = (await request.json()) as Game;
				const id = await db.createGame(env.DB, game);
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

			// Sync metadata endpoints
			if (path === '/api/sync' && request.method === 'POST') {
				const { device_id, table_name } = (await request.json()) as {
					device_id: string;
					table_name: string;
				};
				await db.upsertSyncMetadata(env.DB, device_id, table_name);
				return jsonResponse({ success: true });
			}

			// 404 for unknown routes
			return errorResponse('Not found', 404);
		} catch (error) {
			console.error('Worker error:', error);
			return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
		}
	},
};
