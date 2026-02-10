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
 * Create stats grid component
 * @param {import('../types.js').Stats} stats
 * @returns {HTMLElement}
 */
export function Stats(stats) {
	return h(
		'div',
		{
			className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5',
		},
		StatCard(String(stats.total_plays), 'Plays'),
		StatCard(String(stats.total_games_played), 'Games'),
		StatCard(String(stats.total_wins), 'Wins'),
		StatCard(String(stats.total_losses), 'Losses')
	);
}
