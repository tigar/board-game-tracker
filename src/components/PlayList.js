import { formatDate, formatResult, h } from '../utils.js';

/**
 * Create the result chip for a play
 * @param {string} text
 * @param {import('../types.js').PlayResult | null | undefined} result
 * @param {boolean} isCoOp
 * @returns {HTMLElement}
 */
function ResultChip(text, result, isCoOp) {
	let tone = 'border-ink text-ink';
	if (result === 'win') {
		tone = isCoOp ? 'border-ok bg-ok text-raised' : 'border-ink bg-accent text-ink';
	} else if (result === 'loss' && isCoOp) {
		tone = 'border-bad bg-bad text-raised';
	}

	return h(
		'span',
		{
			className: `inline-block border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${tone}`,
		},
		text
	);
}

/**
 * Create a play row element
 * @param {import('../types.js').PlayWithGame} play
 * @param {(id: string) => void} onDelete
 * @returns {HTMLElement}
 */
function PlayItem(play, onDelete) {
	const resultText = formatResult(play);
	const playerNames = play.player_names || [];

	return h(
		'div',
		{ className: 'ledger-row border-b border-ink last:border-b-0 hover:bg-raised' },
		h(
			'div',
			{ className: 'ledger-date font-mono text-xs tabular-nums text-muted' },
			formatDate(play.date_played)
		),
		h(
			'div',
			{ className: 'ledger-game' },
			h(
				'span',
				{
					className:
						'block truncate font-display text-[19px] font-bold leading-tight [font-stretch:82%]',
				},
				play.game_name
			),
			playerNames.length > 0
				? h(
						'span',
						{ className: 'mt-0.5 block truncate font-mono text-[10px] text-muted' },
						`with ${playerNames.join(', ')}`
					)
				: null
		),
		h(
			'div',
			{ className: 'ledger-players font-mono text-xs tabular-nums text-muted' },
			`${play.number_of_players}P`
		),
		h(
			'div',
			{ className: 'ledger-result' },
			resultText
				? ResultChip(resultText, play.result, play.game_co_op)
				: h('span', { className: 'font-mono text-[10px] text-muted' }, '—')
		),
		h(
			'div',
			{ className: 'ledger-delete' },
			h('button', { type: 'button', className: 'link', onclick: () => onDelete(play.id) }, 'delete')
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
		? `No records match "${searchQuery}"`
		: 'No records yet — log a play to start the ledger';

	return h(
		'div',
		{ className: 'px-4 py-16 font-mono text-xs uppercase tracking-[0.16em] text-muted' },
		message
	);
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

	return h('div', {}, ...plays.map((play) => PlayItem(play, onDelete)));
}
