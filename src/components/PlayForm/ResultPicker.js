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
 * Create one result option button
 * @param {string} text
 * @param {boolean} isSelected
 * @param {() => void} onClick
 * @returns {HTMLElement}
 */
function ResultOption(text, isSelected, onClick) {
	return h(
		'button',
		{
			type: 'button',
			className: `toggle px-3 py-2 ${isSelected ? 'toggle--on' : ''}`,
			onclick: onClick,
		},
		text
	);
}

/**
 * Result/place picker for competitive or co-op games
 * @param {ResultPickerProps} props
 * @returns {HTMLElement}
 */
export function ResultPicker({ isCoOp, numberOfPlayers, place, onChange }) {
	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2' }, 'Result'));

	const resultOptions = h('div', {
		className: isCoOp ? 'grid grid-cols-3 gap-1.5' : 'flex flex-wrap gap-1.5',
	});

	if (isCoOp) {
		resultOptions.appendChild(ResultOption('Won', place === 1, () => onChange(1)));
		resultOptions.appendChild(ResultOption('Lost', place === -1, () => onChange(-1)));
		resultOptions.appendChild(ResultOption('No result', place === null, () => onChange(null)));
	} else {
		for (let i = 1; i <= numberOfPlayers; i++) {
			resultOptions.appendChild(
				ResultOption(`${i}${getOrdinalSuffix(i)}`, place === i, () => onChange(i))
			);
		}
		resultOptions.appendChild(ResultOption('None', place === null, () => onChange(null)));
	}

	wrapper.appendChild(resultOptions);
	return wrapper;
}
