import { h } from '../utils.js';

/**
 * Create search bar component, with the record count as a readout alongside it
 * @param {string} value
 * @param {(value: string) => void} onChange
 * @param {number} shown
 * @param {number} total
 * @returns {HTMLElement}
 */
export function SearchBar(value, onChange, shown, total) {
	const input = h('input', {
		type: 'text',
		className:
			'min-w-0 flex-1 border-0 bg-transparent px-3 py-3 font-mono text-sm text-ink placeholder:text-muted',
		placeholder: 'Filter by game…',
		'aria-label': 'Filter plays by game',
		value,
		oninput: (e) => onChange(e.target.value),
	});

	const field = h(
		'div',
		{ className: 'flex min-w-0 flex-1 items-center' },
		h(
			'span',
			{
				className:
					'self-stretch border-r border-ink px-3 py-3 font-mono text-[10px] font-bold tracking-[0.16em] text-muted',
			},
			'SEARCH ▸'
		),
		input
	);

	if (value) {
		field.appendChild(
			h(
				'button',
				{
					type: 'button',
					className:
						'self-stretch border-l border-ink px-3 font-mono text-xs text-ink hover:bg-ink hover:text-paper',
					'aria-label': 'Clear search',
					onclick: () => {
						onChange('');
						input.value = '';
					},
				},
				'×'
			)
		);
	}

	return h(
		'div',
		{ className: 'flex flex-col border-b border-ink sm:flex-row' },
		field,
		h(
			'div',
			{
				className:
					'flex items-center border-t border-ink px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted sm:border-l sm:border-t-0 sm:py-0',
			},
			`Showing ${shown} of ${total}`
		)
	);
}
