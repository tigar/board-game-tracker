import { h } from '../../utils.js';

/**
 * @typedef {Object} AdvancedOptionsProps
 * @property {boolean} open
 * @property {() => void} onToggle
 * @property {(HTMLElement | null)[]} children - Fields to disclose
 */

/**
 * Disclosure for the fields most plays don't need. Keeping exact placement,
 * side and attendance behind one click is what lets the common case stay three
 * taps: game, players, result.
 * @param {AdvancedOptionsProps} props
 * @returns {HTMLElement | null}
 */
export function AdvancedOptions({ open, onToggle, children }) {
	const fields = children.filter(Boolean);
	if (fields.length === 0) return null;

	const wrapper = h('div', { className: 'mb-5' });

	wrapper.appendChild(
		h(
			'button',
			{
				type: 'button',
				className: 'label flex w-full items-center gap-2 py-1 text-left hover:text-ink',
				'aria-expanded': String(open),
				onclick: onToggle,
			},
			h('span', { className: 'font-mono text-[11px] leading-none' }, open ? '[−]' : '[+]'),
			'Advanced options'
		)
	);

	if (open) {
		const panel = h('div', { className: 'mt-3 border-l-2 border-ink pl-3' }, ...fields);
		wrapper.appendChild(panel);
	}

	return wrapper;
}
