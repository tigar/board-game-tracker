import { formatDate, formatPlace, h } from '../utils.js';

/**
 * Create a play item element
 * @param {import('../types.js').PlayWithGame} play
 * @param {(id: string) => void} onDelete
 * @returns {HTMLElement}
 */
function PlayItem(play, onDelete) {
	const placeText = formatPlace(play.place, play.game_co_op);
	const isWin = play.game_co_op ? play.place === 1 : play.place === 1;
	const isLoss = play.game_co_op && play.place === -1;

	const metaItems = [
		h('span', {}, formatDate(play.date_played)),
		h('span', {}, '•'),
		h('span', {}, `${play.number_of_players}p`),
	];

	if (placeText) {
		metaItems.push(h('span', {}, '•'));
		metaItems.push(
			h(
				'span',
				{
					className: `font-semibold px-2 py-0.5 rounded text-xs ${
						isWin
							? 'bg-green-100 text-green-800'
							: isLoss
								? 'bg-red-100 text-red-800'
								: 'bg-slate-100 text-slate-600'
					}`,
				},
				placeText
			)
		);
	}

	return h(
		'div',
		{
			className: 'bg-white rounded-xl p-4 shadow-sm flex justify-between items-center gap-3',
		},
		h(
			'div',
			{ className: 'flex-1 min-w-0' },
			h(
				'div',
				{
					className: 'text-base font-semibold text-slate-900 mb-1 truncate',
				},
				play.game_name
			),
			h('div', { className: 'flex items-center gap-2 text-sm text-slate-500' }, ...metaItems)
		),
		h(
			'button',
			{
				className:
					'px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors whitespace-nowrap',
				onclick: () => onDelete(play.id),
			},
			'Delete'
		)
	);
}

/**
 * Create empty state element
 * @param {string} searchQuery
 * @returns {HTMLElement}
 */
function EmptyState(searchQuery) {
	const message = searchQuery
		? `No plays found matching "${searchQuery}"`
		: 'No plays yet. Tap "Log Play" to get started';

	return h('div', { className: 'text-center py-12 text-slate-500' }, h('p', {}, message));
}

/**
 * Create play list component
 * @param {import('../types.js').PlayWithGame[]} plays
 * @param {string} searchQuery
 * @param {(id: string) => void} onDelete
 * @returns {HTMLElement}
 */
export function PlayList(plays, searchQuery, onDelete) {
	if (plays.length === 0) {
		return EmptyState(searchQuery);
	}

	return h(
		'div',
		{ className: 'flex flex-col gap-3' },
		...plays.map((play) => PlayItem(play, onDelete))
	);
}
