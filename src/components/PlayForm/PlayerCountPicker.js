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
	wrapper.appendChild(h('label', { className: 'label mb-2' }, 'Players'));

	const playerOptions = h('div', { className: 'flex flex-wrap gap-1.5' });

	for (let i = min; i <= max; i++) {
		const btn = h(
			'button',
			{
				type: 'button',
				className: `toggle px-3 py-2 ${value === i ? 'toggle--on' : ''}`,
				onclick: () => onChange(i),
			},
			String(i)
		);
		playerOptions.appendChild(btn);
	}

	wrapper.appendChild(playerOptions);
	return wrapper;
}
