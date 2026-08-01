import { h } from '../../utils.js';

/**
 * @typedef {Object} SidePickerProps
 * @property {string[] | null | undefined} sides - The game's named roles
 * @property {string | null} side - Currently selected side
 * @property {(side: string | null) => void} onChange
 */

/**
 * Which side was played, for asymmetric games like Whitehall Mystery
 * (Jack vs Investigators) or Not Alone (Creature vs Hunted). Symmetric games —
 * including team games, where 2v2 collapses into plain win/loss — have no
 * sides and get no picker.
 * @param {SidePickerProps} props
 * @returns {HTMLElement | null}
 */
export function SidePicker({ sides, side, onChange }) {
	if (!sides || sides.length === 0) return null;

	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2' }, 'Side'));

	const options = h('div', { className: 'flex flex-wrap gap-1.5' });

	for (const name of sides) {
		const isSelected = side === name;
		options.appendChild(
			h(
				'button',
				{
					type: 'button',
					className: `toggle px-3 py-2 normal-case tracking-normal ${isSelected ? 'toggle--on' : ''}`,
					'aria-pressed': String(isSelected),
					onclick: () => onChange(isSelected ? null : name),
				},
				name
			)
		);
	}

	wrapper.appendChild(options);
	return wrapper;
}
