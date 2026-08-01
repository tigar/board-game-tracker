import { getOrdinalSuffix, h } from '../../utils.js';

/**
 * @typedef {Object} PlacementPickerProps
 * @property {number} numberOfPlayers - Upper bound on the finishing positions
 * @property {number | null} place - Current placement
 * @property {(place: number | null) => void} onChange
 */

/**
 * Exact finishing position, for the plays where it was worth recording.
 * Whether a game *can* be ranked is a judgement made per play rather than a
 * property of the game, so this is always offered for competitive games and
 * simply left alone when it doesn't apply.
 * @param {PlacementPickerProps} props
 * @returns {HTMLElement}
 */
export function PlacementPicker({ numberOfPlayers, place, onChange }) {
	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2' }, 'Exact placement'));

	const options = h('div', { className: 'flex flex-wrap gap-1.5' });

	for (let i = 1; i <= numberOfPlayers; i++) {
		const isSelected = place === i;
		options.appendChild(
			h(
				'button',
				{
					type: 'button',
					className: `toggle px-3 py-2 ${isSelected ? 'toggle--on' : ''}`,
					'aria-pressed': String(isSelected),
					onclick: () => onChange(isSelected ? null : i),
				},
				`${i}${getOrdinalSuffix(i)}`
			)
		);
	}

	wrapper.appendChild(options);
	return wrapper;
}
