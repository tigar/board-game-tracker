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
	wrapper.appendChild(
		h(
			'label',
			{ className: 'block mb-2 text-sm font-semibold text-slate-900' },
			'Expansions Used'
		)
	);

	const optionsContainer = h('div', { className: 'flex flex-col gap-2' });

	for (const exp of expansions) {
		const isSelected = selectedIds.includes(exp.id);
		const expLabel = h(
			'label',
			{
				className: `flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
					isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200'
				}`,
			},
			h('input', {
				type: 'checkbox',
				className: 'w-5 h-5 cursor-pointer',
				checked: isSelected,
				onchange: () => {
					if (isSelected) {
						onChange(selectedIds.filter((id) => id !== exp.id));
					} else {
						onChange([...selectedIds, exp.id]);
					}
				},
			}),
			h('span', { className: 'font-medium text-sm' }, exp.name)
		);
		optionsContainer.appendChild(expLabel);
	}

	wrapper.appendChild(optionsContainer);
	return wrapper;
}
