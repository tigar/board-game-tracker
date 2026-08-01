import { h } from '../../utils.js';
import { getFormState, updateFormState } from './formState.js';

/**
 * @typedef {Object} PeoplePickerProps
 * @property {import('../../types.js').Person[]} people - Everyone on record
 * @property {string[]} playerNames - Currently selected names
 * @property {(names: string[]) => void} onChange
 */

/**
 * Build the dropdown entries for the current query: everyone not already at
 * the table, plus an explicit row to add a name that doesn't exist yet.
 * @param {import('../../types.js').Person[]} people
 * @param {string[]} playerNames
 * @param {string} query
 * @returns {{name: string, isNew: boolean}[]}
 */
function getOptions(people, playerNames, query) {
	const taken = new Set(playerNames.map((n) => n.toLowerCase()));
	const wanted = query.trim().toLowerCase();

	const matches = people
		.filter((p) => !taken.has(p.name.toLowerCase()))
		.filter((p) => !wanted || p.name.toLowerCase().includes(wanted))
		.map((p) => ({ name: p.name, isNew: false }));

	// A multi-select has no submit moment to fall back on, so creating someone
	// new has to be an explicit row rather than an implicit side effect.
	const isExact =
		wanted && [...taken].concat(people.map((p) => p.name.toLowerCase())).includes(wanted);
	if (wanted && !isExact) {
		matches.push({ name: query.trim(), isNew: true });
	}

	return matches;
}

/**
 * Who was at the table. Attendance only — the result fields still describe
 * your own play, not everyone else's.
 * @param {PeoplePickerProps} props
 * @returns {HTMLElement}
 */
export function PeoplePicker({ people, playerNames, onChange }) {
	const formState = getFormState();

	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2', for: 'people' }, 'Who was playing?'));

	// Selected people
	if (playerNames.length > 0) {
		const chips = h('div', { className: 'mb-2 flex flex-wrap gap-1.5' });
		for (const name of playerNames) {
			chips.appendChild(
				h(
					'span',
					{ className: 'chip' },
					name,
					h(
						'button',
						{
							type: 'button',
							className: 'chip-remove',
							'aria-label': `Remove ${name}`,
							onclick: () => onChange(playerNames.filter((n) => n !== name)),
						},
						'×'
					)
				)
			);
		}
		wrapper.appendChild(chips);
	}

	const autocompleteWrapper = h('div', { className: 'relative' });
	const dropdownContainer = h('div', { id: 'people-dropdown-container' });

	/**
	 * Add a name and clear the query, ready for the next person
	 * @param {string} name
	 */
	const addPerson = (name) => {
		const current = getFormState();
		const trimmed = name.trim();
		if (!trimmed) return;
		if (current.playerNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return;

		updateFormState({
			personInputText: '',
			personShowDropdown: false,
			personHighlightedIndex: -1,
		});
		onChange([...current.playerNames, trimmed]);
	};

	/**
	 * Update the dropdown content without rerendering the form
	 */
	const updateDropdown = () => {
		const current = getFormState();
		dropdownContainer.innerHTML = '';

		const options = getOptions(people, current.playerNames, current.personInputText);
		if (!current.personShowDropdown || options.length === 0) {
			return;
		}

		// -mt-px so the dropdown shares the input's bottom rule instead of doubling it
		const dropdown = h('div', {
			className: 'absolute z-20 w-full -mt-px max-h-48 overflow-y-auto border border-ink bg-paper',
		});

		const optionClassName = (isHighlighted) =>
			`w-full border-t border-ink first:border-t-0 px-3 py-2 text-left font-mono text-xs ${
				isHighlighted ? 'bg-ink text-paper' : 'text-ink hover:bg-raised'
			}`;

		for (let i = 0; i < options.length; i++) {
			const option = options[i];
			dropdown.appendChild(
				h(
					'button',
					{
						type: 'button',
						className: optionClassName(i === current.personHighlightedIndex),
						onmousedown: (e) => {
							e.preventDefault(); // Prevent blur before click
							addPerson(option.name);
						},
						onmouseenter: () => {
							updateFormState({ personHighlightedIndex: i });
							// Restyle in place rather than rebuilding the dropdown: replacing the
							// hovered button mid-hover retriggers mouseenter on its replacement,
							// causing a rebuild loop that swallows the eventual click.
							for (const [j, child] of [...dropdown.children].entries()) {
								child.className = optionClassName(j === i);
							}
						},
					},
					option.isNew ? `Add “${option.name}”` : option.name
				)
			);
		}

		dropdownContainer.appendChild(dropdown);
	};

	const personInput = h('input', {
		id: 'people',
		type: 'text',
		className: 'field',
		placeholder: 'Search or add a person…',
		value: formState.personInputText,
		autocomplete: 'off',
		oninput: (e) => {
			updateFormState({
				personInputText: e.target.value,
				personShowDropdown: true,
				personHighlightedIndex: -1,
			});
			updateDropdown();
		},
		onfocus: () => {
			updateFormState({ personShowDropdown: true });
			updateDropdown();
		},
		onblur: () => {
			// Delay hiding dropdown to allow click events to fire
			setTimeout(() => {
				updateFormState({ personShowDropdown: false });
				updateDropdown();
			}, 150);
		},
		onkeydown: (e) => {
			const current = getFormState();
			const options = getOptions(people, current.playerNames, current.personInputText);

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				updateFormState({
					personHighlightedIndex: Math.min(current.personHighlightedIndex + 1, options.length - 1),
				});
				updateDropdown();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				updateFormState({
					personHighlightedIndex: Math.max(current.personHighlightedIndex - 1, -1),
				});
				updateDropdown();
			} else if (e.key === 'Enter') {
				// Always swallow Enter here. Letting it through would submit the
				// play, which is never what naming someone means.
				e.preventDefault();
				const picked =
					current.personHighlightedIndex >= 0
						? options[current.personHighlightedIndex]?.name
						: current.personInputText;
				if (picked) addPerson(picked);
			} else if (e.key === 'Escape') {
				updateFormState({ personShowDropdown: false });
				updateDropdown();
				e.target.blur();
			}
		},
	});

	autocompleteWrapper.appendChild(personInput);
	autocompleteWrapper.appendChild(dropdownContainer);

	// Restore the dropdown after a rerender
	if (formState.personShowDropdown) {
		updateDropdown();
	}

	wrapper.appendChild(autocompleteWrapper);
	return wrapper;
}
