import type { Game, Play, PlayWithGame, Stats, UserData } from './types';

/**
 * Default user ID (will be replaced with OAuth later)
 */
const DEFAULT_USER_ID = 'default';

/**
 * Get the KV key for user data
 */
function getUserKey(userId: string = DEFAULT_USER_ID): string {
	return `user:${userId}`;
}

/**
 * Get user data from KV
 */
export async function getUserData(kv: KVNamespace, userId?: string): Promise<UserData> {
	const data = await kv.get(getUserKey(userId), 'json');
	return (data as UserData) || { games: [], plays: [] };
}

/**
 * Save user data to KV
 */
export async function saveUserData(
	kv: KVNamespace,
	data: UserData,
	userId?: string
): Promise<void> {
	await kv.put(getUserKey(userId), JSON.stringify(data));
}

/**
 * Generate a UUID
 */
function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
function now(): string {
	return new Date().toISOString();
}

// ============ Games ============

/**
 * Get all games
 */
export async function getAllGames(kv: KVNamespace): Promise<Game[]> {
	const data = await getUserData(kv);
	return data.games.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a game by ID
 */
export async function getGameById(kv: KVNamespace, id: string): Promise<Game | null> {
	const data = await getUserData(kv);
	return data.games.find((g) => g.id === id) || null;
}

/**
 * Get a game by name (base games only)
 */
export async function getGameByName(kv: KVNamespace, name: string): Promise<Game | null> {
	const data = await getUserData(kv);
	return (
		data.games.find((g) => g.name.toLowerCase() === name.toLowerCase() && !g.is_expansion) || null
	);
}

/**
 * Get expansions for a game
 */
export async function getExpansionsForGame(kv: KVNamespace, gameId: string): Promise<Game[]> {
	const data = await getUserData(kv);
	return data.games
		.filter((g) => g.parent_game_id === gameId)
		.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create a new game
 */
export async function createGame(
	kv: KVNamespace,
	game: Omit<Game, 'id' | 'created_at'>
): Promise<string> {
	const data = await getUserData(kv);
	const newGame: Game = {
		...game,
		id: generateId(),
		created_at: now(),
	};
	data.games.push(newGame);
	await saveUserData(kv, data);
	return newGame.id;
}

/**
 * Update an existing game
 */
export async function updateGame(kv: KVNamespace, id: string, updates: Partial<Game>): Promise<void> {
	const data = await getUserData(kv);
	const index = data.games.findIndex((g) => g.id === id);
	if (index !== -1) {
		data.games[index] = { ...data.games[index], ...updates };
		await saveUserData(kv, data);
	}
}

/**
 * Delete a game
 */
export async function deleteGame(kv: KVNamespace, id: string): Promise<void> {
	const data = await getUserData(kv);
	data.games = data.games.filter((g) => g.id !== id);
	// Also delete plays for this game
	data.plays = data.plays.filter((p) => p.game_id !== id);
	await saveUserData(kv, data);
}

// ============ Plays ============

/**
 * Get all plays with game info, optionally filtered by game_id
 */
export async function getAllPlays(kv: KVNamespace, gameId?: string): Promise<PlayWithGame[]> {
	const data = await getUserData(kv);
	const gameMap = new Map(data.games.map((g) => [g.id, g]));

	let plays = data.plays;
	if (gameId) {
		plays = plays.filter((p) => p.game_id === gameId);
	}

	return plays
		.map((p) => {
			const game = gameMap.get(p.game_id);
			return {
				...p,
				game_name: game?.name || 'Unknown Game',
				game_co_op: game?.co_op || false,
			};
		})
		.sort((a, b) => new Date(b.date_played).getTime() - new Date(a.date_played).getTime());
}

/**
 * Get a play by ID
 */
export async function getPlayById(kv: KVNamespace, id: string): Promise<Play | null> {
	const data = await getUserData(kv);
	return data.plays.find((p) => p.id === id) || null;
}

/**
 * Create a new play
 */
export async function createPlay(
	kv: KVNamespace,
	play: Omit<Play, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
	const data = await getUserData(kv);
	const timestamp = now();
	const newPlay: Play = {
		...play,
		id: generateId(),
		created_at: timestamp,
		updated_at: timestamp,
	};
	data.plays.push(newPlay);
	await saveUserData(kv, data);
	return newPlay.id;
}

/**
 * Update an existing play
 */
export async function updatePlay(kv: KVNamespace, id: string, updates: Partial<Play>): Promise<void> {
	const data = await getUserData(kv);
	const index = data.plays.findIndex((p) => p.id === id);
	if (index !== -1) {
		data.plays[index] = {
			...data.plays[index],
			...updates,
			updated_at: now(),
		};
		await saveUserData(kv, data);
	}
}

/**
 * Delete a play
 */
export async function deletePlay(kv: KVNamespace, id: string): Promise<void> {
	const data = await getUserData(kv);
	data.plays = data.plays.filter((p) => p.id !== id);
	await saveUserData(kv, data);
}

// ============ Stats ============

/**
 * Get play statistics
 */
export async function getPlayStats(kv: KVNamespace): Promise<Stats> {
	const data = await getUserData(kv);
	const gameMap = new Map(data.games.map((g) => [g.id, g]));

	const uniqueGames = new Set(data.plays.map((p) => p.game_id));

	let wins = 0;
	let losses = 0;

	for (const play of data.plays) {
		if (play.place === undefined || play.place === null) continue;

		const game = gameMap.get(play.game_id);
		if (game?.co_op) {
			// Co-op: 1 = won, -1 = lost
			if (play.place === 1) wins++;
			else if (play.place === -1) losses++;
		} else {
			// Competitive: 1st place = win
			if (play.place === 1) wins++;
		}
	}

	return {
		total_plays: data.plays.length,
		total_games_played: uniqueGames.size,
		total_wins: wins,
		total_losses: losses,
	};
}
