import { h } from '../../utils.js';

/**
 * @typedef {Object} PlayerCountPickerProps
 * @property {number} min - Minimum number of players
 * @property {number} max - Maximum number of players
 * @property {number} value - Current selected value
 * @property {(value: number) => void} onChange - Called when value changes
 */

/**
 * Player count picker with numbered buttons
 * @param {PlayerCountPickerProps} props
 * @returns {HTMLElement}
 */
export function PlayerCountPicker({ min, max, value, onChange }) {
	const wrapper = h('div', {});
	wrapper.appendChild(
		h(
			'label',
			{ className: 'block mb-2 text-sm font-semibold text-slate-900' },
			'Players'
		)
	);

	const playerOptions = h('div', { className: 'flex flex-wrap gap-2' });

	for (let i = min; i <= max; i++) {
		const btn = h(
			'button',
			{
				type: 'button',
				className: `py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
					value === i
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => onChange(i),
			},
			String(i)
		);
		playerOptions.appendChild(btn);
	}

	wrapper.appendChild(playerOptions);
	return wrapper;
}
