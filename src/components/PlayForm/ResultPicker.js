import { h } from '../../utils.js';
import { getOrdinalSuffix } from './formUtils.js';

/**
 * @typedef {Object} ResultPickerProps
 * @property {boolean} isCoOp - Whether the game is cooperative
 * @property {number} numberOfPlayers - Number of players (for competitive place options)
 * @property {number | null} place - Current place value
 * @property {(place: number | null) => void} onChange - Called when place changes
 */

/**
 * Result/place picker for competitive or co-op games
 * @param {ResultPickerProps} props
 * @returns {HTMLElement}
 */
export function ResultPicker({ isCoOp, numberOfPlayers, place, onChange }) {
	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(
		h('label', { className: 'block mb-2 text-sm font-semibold text-slate-900' }, 'Result')
	);

	if (isCoOp) {
		// Co-op: Won / Lost / No result
		const resultOptions = h('div', { className: 'grid grid-cols-3 gap-2' });

		const wonBtn = h(
			'button',
			{
				type: 'button',
				className: `py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					place === 1
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => onChange(1),
			},
			'Won'
		);
		resultOptions.appendChild(wonBtn);

		const lostBtn = h(
			'button',
			{
				type: 'button',
				className: `py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					place === -1
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => onChange(-1),
			},
			'Lost'
		);
		resultOptions.appendChild(lostBtn);

		const noneBtn = h(
			'button',
			{
				type: 'button',
				className: `py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					place === null
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => onChange(null),
			},
			'No result'
		);
		resultOptions.appendChild(noneBtn);

		wrapper.appendChild(resultOptions);
	} else {
		// Competitive: 1st, 2nd, 3rd, ... up to number of players, plus "No result"
		const resultOptions = h('div', { className: 'flex flex-wrap gap-2' });

		// Generate place buttons
		for (let i = 1; i <= numberOfPlayers; i++) {
			const suffix = getOrdinalSuffix(i);
			const btn = h(
				'button',
				{
					type: 'button',
					className: `py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
						place === i
							? 'border-primary-500 bg-primary-50 text-primary-600'
							: 'border-slate-200 text-slate-600'
					}`,
					onclick: () => onChange(i),
				},
				`${i}${suffix}`
			);
			resultOptions.appendChild(btn);
		}

		// No result button
		const noneBtn = h(
			'button',
			{
				type: 'button',
				className: `py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
					place === null
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => onChange(null),
			},
			'None'
		);
		resultOptions.appendChild(noneBtn);

		wrapper.appendChild(resultOptions);
	}

	return wrapper;
}
