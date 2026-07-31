import { h } from '../utils.js';

/**
 * Create a stat cell. The label sits in a filled block above the figure.
 * @param {HTMLElement | string} value
 * @param {string} label
 * @param {string} blockClassName - Fill for the label block
 * @param {string} [cellClassName] - Extra layout classes for this cell
 * @returns {HTMLElement}
 */
function StatCell(value, label, blockClassName, cellClassName = '') {
	return h(
		'div',
		{ className: `border-l border-ink first:border-l-0 pb-4 ${cellClassName}` },
		h('div', { className: `label mb-3 px-4 py-1.5 ${blockClassName}` }, label),
		h(
			'div',
			{
				className:
					'px-4 font-display font-extrabold leading-[0.92] tracking-tight tabular-nums [font-stretch:66%] text-[clamp(2.5rem,7vw,4.75rem)]',
			},
			value
		)
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
 * Create unique games stat cell with 30/90/365 day breakdown
 * @param {import('../types.js').PlayWithGame[]} plays
 * @returns {HTMLElement}
 */
function UniqueGamesCell(plays) {
	const separator = () => h('span', { className: 'text-muted font-normal text-[0.62em]' }, '/');

	return StatCell(
		h(
			'span',
			{},
			h('span', { className: 'text-accent' }, String(getUniqueGamesInDays(plays, 30))),
			separator(),
			String(getUniqueGamesInDays(plays, 90)),
			separator(),
			String(getUniqueGamesInDays(plays, 365))
		),
		'Unique 30 / 90 / 365d',
		'bg-accent text-ink',
		// Its label is the longest, so it takes a full row of its own on mobile
		'col-span-2 border-l-0 border-t border-ink sm:col-span-1 sm:border-l sm:border-t-0'
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
		{ className: 'grid grid-cols-2 border-b border-ink sm:grid-cols-3' },
		StatCell(String(stats.total_plays), 'Total plays', 'bg-accent text-ink'),
		StatCell(String(stats.total_games_played), 'Games played', 'bg-ink text-paper'),
		UniqueGamesCell(plays)
	);
}
