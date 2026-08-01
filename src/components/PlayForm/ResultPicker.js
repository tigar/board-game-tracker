import { h } from '../../utils.js';

/**
 * @typedef {Object} ResultPickerProps
 * @property {import('../../types.js').PlayResult | null} result - Current result
 * @property {(result: import('../../types.js').PlayResult | null) => void} onChange
 */

const RESULTS = [
	['win', 'Win'],
	['loss', 'Loss'],
	['draw', 'Draw'],
];

/**
 * Win/loss/draw picker. Every game produces one of these, so it is the only
 * result control most plays ever need — exact placement lives in advanced
 * options. Clicking the selected option deselects it, since "no result
 * recorded" is a legitimate answer.
 * @param {ResultPickerProps} props
 * @returns {HTMLElement}
 */
export function ResultPicker({ result, onChange }) {
	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2' }, 'Result'));

	const options = h('div', { className: 'grid grid-cols-3 gap-1.5' });

	for (const [value, text] of RESULTS) {
		const isSelected = result === value;
		options.appendChild(
			h(
				'button',
				{
					type: 'button',
					className: `toggle px-3 py-2 ${isSelected ? 'toggle--on' : ''}`,
					'aria-pressed': String(isSelected),
					onclick: () => onChange(isSelected ? null : value),
				},
				text
			)
		);
	}

	wrapper.appendChild(options);
	return wrapper;
}
