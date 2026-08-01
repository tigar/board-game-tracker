import { h } from '../../utils.js';
import { getFormState, updateFormState } from './formState.js';
import { getMostPlayedGames } from './formUtils.js';

/**
 * @typedef {Object} GameAutocompleteProps
 * @property {import('../../types.js').Game[]} games - Available games to search
 * @property {import('../../types.js').PlayWithGame[]} plays - All plays for calculating most played
 * @property {(game: import('../../types.js').Game) => Promise<void>} onSelect - Called when a game is selected
 * @property {() => void} onClear - Called when the input no longer matches the selected game
 */

/**
 * Game autocomplete input with dropdown and quick pick suggestions
 * @param {GameAutocompleteProps} props
 * @returns {HTMLElement}
 */
export function GameAutocomplete({ games, plays, onSelect, onClear }) {
	const formState = getFormState();

	const wrapper = h('div', { className: 'mb-5' });
	wrapper.appendChild(h('label', { className: 'label mb-2', for: 'game' }, 'Game'));

	// Autocomplete wrapper
	const autocompleteWrapper = h('div', { className: 'relative' });

	// Dropdown container (always present, content updated dynamically)
	const dropdownContainer = h('div', { id: 'game-dropdown-container' });

	/**
	 * Update the dropdown content without rerendering the form
	 */
	const updateDropdown = () => {
		const currentState = getFormState();
		// Clear existing dropdown
		dropdownContainer.innerHTML = '';

		const inputText = currentState.gameInputText.trim().toLowerCase();
		const filteredGames = inputText
			? games.filter((g) => g.name.toLowerCase().includes(inputText))
			: games;

		if (!currentState.showDropdown || filteredGames.length === 0) {
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

		for (let i = 0; i < filteredGames.length; i++) {
			const game = filteredGames[i];
			const option = h(
				'button',
				{
					type: 'button',
					className: optionClassName(i === currentState.highlightedIndex),
					onmousedown: async (e) => {
						e.preventDefault(); // Prevent blur before click
						await onSelect(game);
					},
					onmouseenter: () => {
						updateFormState({ highlightedIndex: i });
						// Restyle in place rather than rebuilding the dropdown: replacing the
						// hovered button mid-hover retriggers mouseenter on its replacement,
						// causing a rebuild loop that swallows the eventual click.
						for (const [j, child] of [...dropdown.children].entries()) {
							child.className = optionClassName(j === i);
						}
					},
				},
				game.name
			);
			dropdown.appendChild(option);
		}

		dropdownContainer.appendChild(dropdown);
	};

	// Game input
	const gameInput = h('input', {
		id: 'game',
		type: 'text',
		className: 'field',
		placeholder: 'Search or add a game…',
		value: formState.gameInputText,
		autocomplete: 'off',
		oninput: (e) => {
			const currentState = getFormState();
			updateFormState({
				gameInputText: e.target.value,
				showDropdown: true,
				highlightedIndex: -1,
			});

			// Clear selection when typing a different value
			if (currentState.selectedGameId) {
				const selectedGame = games.find((g) => g.id === currentState.selectedGameId);
				if (selectedGame && selectedGame.name !== e.target.value) {
					updateFormState({
						selectedGameId: null,
						availableExpansions: [],
						selectedExpansionIds: [],
						isCoOp: currentState.newGameCoOp,
					});
					// Selection cleared: re-render the whole form so the co-op toggle
					// and other game-dependent fields reappear, not just the dropdown.
					onClear();
					return;
				}
			}
			updateDropdown();
		},
		onfocus: () => {
			updateFormState({ showDropdown: true });
			updateDropdown();
		},
		onblur: () => {
			// Delay hiding dropdown to allow click events to fire
			setTimeout(() => {
				updateFormState({ showDropdown: false });
				updateDropdown();
			}, 150);
		},
		onkeydown: async (e) => {
			const currentState = getFormState();
			const inputText = currentState.gameInputText.trim().toLowerCase();
			const currentFiltered = inputText
				? games.filter((g) => g.name.toLowerCase().includes(inputText))
				: games;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				updateFormState({
					highlightedIndex: Math.min(currentState.highlightedIndex + 1, currentFiltered.length - 1),
				});
				updateDropdown();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				updateFormState({
					highlightedIndex: Math.max(currentState.highlightedIndex - 1, -1),
				});
				updateDropdown();
			} else if (e.key === 'Enter') {
				if (currentState.highlightedIndex >= 0) {
					e.preventDefault();
					const selectedGame = currentFiltered[currentState.highlightedIndex];
					if (selectedGame) {
						await onSelect(selectedGame);
					}
				}
			} else if (e.key === 'Escape') {
				updateFormState({ showDropdown: false });
				updateDropdown();
				e.target.blur();
			}
		},
	});

	autocompleteWrapper.appendChild(gameInput);
	autocompleteWrapper.appendChild(dropdownContainer);

	// Initialize dropdown if it should be visible
	if (formState.showDropdown) {
		updateDropdown();
	}

	wrapper.appendChild(autocompleteWrapper);

	// Most played suggestions
	const mostPlayed = getMostPlayedGames(plays, games, 3);
	if (mostPlayed.length > 0) {
		const suggestionsContainer = h('div', { className: 'mt-2' });
		suggestionsContainer.appendChild(h('span', { className: 'label' }, 'Quick picks'));

		const suggestionsButtons = h('div', { className: 'mt-1.5 flex flex-wrap gap-1.5' });
		for (const game of mostPlayed) {
			const btn = h(
				'button',
				{
					type: 'button',
					className: 'toggle px-2 py-1 normal-case tracking-normal',
					onclick: async () => {
						await onSelect(game);
					},
				},
				game.name
			);
			suggestionsButtons.appendChild(btn);
		}
		suggestionsContainer.appendChild(suggestionsButtons);
		wrapper.appendChild(suggestionsContainer);
	}

	return wrapper;
}
