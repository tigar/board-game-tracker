import { h } from '../../utils.js';

/**
 * @typedef {Object} ExpansionPickerProps
 * @property {import('../../types.js').Game[]} expansions - Available expansions
 * @property {string[]} selectedIds - Currently selected expansion IDs
 * @property {(selectedIds: string[]) => void} onChange - Called when selection changes
 */

/**
 * Expansion picker with checkboxes
 * @param {ExpansionPickerProps} props
 * @returns {HTMLElement | null}
 */
export function ExpansionPicker({ expansions, selectedIds, onChange }) {
	if (expansions.length === 0) {
		return null;
	}

	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2' }, 'Expansions Used'));

	// Rows stack into one block, sharing each divider rather than doubling it
	const optionsContainer = h('div', { className: 'flex flex-col' });

	for (const exp of expansions) {
		const isSelected = selectedIds.includes(exp.id);
		const expLabel = h(
			'label',
			{
				className: `flex cursor-pointer items-center gap-3 border border-ink px-3 py-2.5 -mt-px first:mt-0 ${
					isSelected ? 'bg-accent' : ''
				}`,
			},
			h('input', {
				type: 'checkbox',
				className: 'h-4 w-4 cursor-pointer accent-ink',
				checked: isSelected,
				onchange: () => {
					if (isSelected) {
						onChange(selectedIds.filter((id) => id !== exp.id));
					} else {
						onChange([...selectedIds, exp.id]);
					}
				},
			}),
			h('span', { className: 'font-mono text-xs' }, exp.name)
		);
		optionsContainer.appendChild(expLabel);
	}

	wrapper.appendChild(optionsContainer);
	return wrapper;
}
