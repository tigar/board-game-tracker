/**
 * Get the most played games from the plays data
 * @param {import('../../types.js').PlayWithGame[]} plays
 * @param {import('../../types.js').Game[]} games
 * @param {number} limit
 * @returns {import('../../types.js').Game[]}
 */
export function getMostPlayedGames(plays, games, limit = 3) {
	/** @type {Record<string, number>} */
	const playCounts = {};
	for (const play of plays) {
		playCounts[play.game_id] = (playCounts[play.game_id] || 0) + 1;
	}

	return games
		.filter((g) => playCounts[g.id] > 0)
		.sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
		.slice(0, limit);
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} n
 * @returns {string}
 */
export function getOrdinalSuffix(n) {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}
