import { h } from '../utils.js';

/**
 * Create a stat card element
 * @param {string} value
 * @param {string} label
 * @returns {HTMLElement}
 */
function StatCard(value, label) {
	return h(
		'div',
		{
			className: 'bg-white p-5 rounded-xl shadow-sm text-center',
		},
		h('div', { className: 'text-3xl font-bold text-slate-900 mb-1' }, value),
		h('div', { className: 'text-sm font-medium text-slate-500' }, label)
	);
}

/**
 * Get unique game count within a number of days
 * @param {import('../types.js').PlayWithGame[]} plays
 * @param {number} days
 * @returns {number}
 */
function getUniqueGamesInDays(plays, days) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	const cutoffStr = cutoff.toISOString().split('T')[0];

	const gameIds = new Set();
	for (const play of plays) {
		if (play.date_played >= cutoffStr) {
			gameIds.add(play.game_id);
		}
	}
	return gameIds.size;
}

/**
 * Create unique games stat card with 30/90/365 day breakdown
 * @param {import('../types.js').PlayWithGame[]} plays
 * @returns {HTMLElement}
 */
function UniqueGamesCard(plays) {
	const unique30 = getUniqueGamesInDays(plays, 30);
	const unique90 = getUniqueGamesInDays(plays, 90);
	const unique365 = getUniqueGamesInDays(plays, 365);

	return h(
		'div',
		{
			className: 'bg-white p-5 rounded-xl shadow-sm text-center',
		},
		h(
			'div',
			{ className: 'text-3xl font-bold mb-1' },
			h('span', { className: 'text-red-500' }, String(unique30)),
			' / ',
			h('span', { className: 'text-green-500' }, String(unique90)),
			' / ',
			h('span', { className: 'text-blue-500' }, String(unique365))
		),
		h('div', { className: 'text-sm font-medium text-slate-500' }, 'Unique (30/90/365d)')
	);
}

/**
 * Create stats grid component
 * @param {import('../types.js').Stats} stats
 * @param {import('../types.js').PlayWithGame[]} plays
 * @returns {HTMLElement}
 */
export function Stats(stats, plays) {
	return h(
		'div',
		{
			className: 'grid grid-cols-3 gap-3 mb-5',
		},
		StatCard(String(stats.total_plays), 'Plays'),
		StatCard(String(stats.total_games_played), 'Games'),
		UniqueGamesCard(plays)
	);
}
