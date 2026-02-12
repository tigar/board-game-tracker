import { gamesApi } from '../api.js';
import { getTodayISO, h } from '../utils.js';

/**
 * @typedef {Object} PlayFormState
 * @property {string | null} selectedGameId
 * @property {string} gameInputText - Text in the autocomplete input
 * @property {boolean} showDropdown - Whether to show the autocomplete dropdown
 * @property {number} highlightedIndex - Index of highlighted item in dropdown for keyboard navigation
 * @property {boolean} newGameCoOp
 * @property {import('../types.js').Game[]} availableExpansions
 * @property {string[]} selectedExpansionIds
 * @property {string} dateValue
 * @property {number} numberOfPlayers
 * @property {number | null} place - 1=1st, 2=2nd, etc. or 1=won, -1=lost for co-op
 * @property {boolean} isCoOp
 */

/** @type {PlayFormState} */
let formState = {
	selectedGameId: null,
	gameInputText: '',
	showDropdown: false,
	highlightedIndex: -1,
	newGameCoOp: false,
	availableExpansions: [],
	selectedExpansionIds: [],
	dateValue: getTodayISO(),
	numberOfPlayers: 2,
	place: null,
	isCoOp: false,
};

/**
 * Reset form state
 */
export function resetFormState() {
	formState = {
		selectedGameId: null,
		gameInputText: '',
		showDropdown: false,
		highlightedIndex: -1,
		newGameCoOp: false,
		availableExpansions: [],
		selectedExpansionIds: [],
		dateValue: getTodayISO(),
		numberOfPlayers: 2,
		place: null,
		isCoOp: false,
	};
}

/**
 * Get the most played games from the plays data
 * @param {import('../types.js').PlayWithGame[]} plays
 * @param {import('../types.js').Game[]} games
 * @param {number} limit
 * @returns {import('../types.js').Game[]}
 */
function getMostPlayedGames(plays, games, limit = 3) {
	/** @type {Record<string, number>} */
	const playCounts = {};
	for (const play of plays) {
		playCounts[play.game_id] = (playCounts[play.game_id] || 0) + 1;
	}

	return games
		.filter((g) => playCounts[g.id] > 0)
		.sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
		.slice(0, limit);
}

/**
 * Select a game from the autocomplete
 * @param {import('../types.js').Game} game
 * @param {import('../types.js').Game[]} games
 * @param {HTMLFormElement} form
 * @param {import('../types.js').PlayWithGame[]} plays
 * @param {(data: {game_id: string, date_played: string, place: number | undefined, number_of_players: number, expansion_ids: string[] | undefined}) => Promise<void>} onSubmit
 * @param {() => void} onClose
 */
async function selectGame(game, games, form, plays, onSubmit, onClose) {
	formState.selectedGameId = game.id;
	formState.gameInputText = game.name;
	formState.showDropdown = false;
	formState.highlightedIndex = -1;
	formState.selectedExpansionIds = [];
	formState.isCoOp = game.co_op || false;
	formState.place = null;

	// Reset numberOfPlayers if out of range for new game
	const minPlayers = game.min_players ?? 1;
	const maxPlayers = game.max_players ?? 8;
	if (formState.numberOfPlayers < minPlayers || formState.numberOfPlayers > maxPlayers) {
		formState.numberOfPlayers = minPlayers;
	}

	// Load expansions
	try {
		formState.availableExpansions = await gamesApi.getExpansions(game.id);
	} catch (err) {
		console.error('Failed to load expansions:', err);
		formState.availableExpansions = [];
	}

	rerenderForm(form, games, plays, onSubmit, onClose);
}

/**
 * Create the play form modal
 * @param {import('../types.js').Game[]} games - Base games only
 * @param {import('../types.js').PlayWithGame[]} plays - All plays for calculating most played
 * @param {() => void} onClose
 * @param {(data: {game_id: string, date_played: string, place: number | undefined, number_of_players: number, expansion_ids: string[] | undefined}) => Promise<void>} onSubmit
 * @param {boolean} [isRerender=false] - If true, don't reset form state (used for re-renders)
 * @returns {HTMLElement}
 */
export function PlayForm(games, plays, onClose, onSubmit, isRerender = false) {
	// Reset form state only on initial open, not on re-renders
	if (!isRerender) {
		resetFormState();
	}

	const backdrop = h('div', {
		className:
			'fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fadeIn',
	});

	// Backdrop close button (invisible, covers backdrop but behind modal)
	const backdropClose = h('button', {
		type: 'button',
		className: 'absolute inset-0 w-full h-full cursor-pointer z-0',
		onclick: onClose,
		'aria-label': 'Close modal',
	});
	backdrop.appendChild(backdropClose);

	const modal = h('div', {
		className:
			'relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto z-10',
	});
	backdrop.appendChild(modal);

	// Header
	const header = h(
		'div',
		{ className: 'flex justify-between items-center mb-6' },
		h('h2', { className: 'text-2xl font-bold text-slate-900' }, 'Log a Play'),
		h(
			'button',
			{
				className:
					'w-9 h-9 bg-slate-100 rounded-full text-xl text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors',
				onclick: onClose,
			},
			'×'
		)
	);
	modal.appendChild(header);

	// Form
	const form = h('form', {
		onsubmit: async (e) => {
			e.preventDefault();
			await handleSubmit(onSubmit, onClose);
		},
	});
	modal.appendChild(form);

	// Game selection with autocomplete
	const gameGroup = h('div', { className: 'mb-5' });
	gameGroup.appendChild(
		h(
			'label',
			{ className: 'block mb-2 text-sm font-semibold text-slate-900', for: 'game' },
			'Game'
		)
	);

	// Autocomplete wrapper
	const autocompleteWrapper = h('div', { className: 'relative' });

	// Dropdown container (always present, content updated dynamically)
	const dropdownContainer = h('div', { id: 'game-dropdown-container' });

	/**
	 * Update the dropdown content without rerendering the form
	 */
	const updateDropdown = () => {
		// Clear existing dropdown
		dropdownContainer.innerHTML = '';

		const inputText = formState.gameInputText.trim().toLowerCase();
		const filteredGames = inputText
			? games.filter((g) => g.name.toLowerCase().includes(inputText))
			: games;

		if (!formState.showDropdown || filteredGames.length === 0) {
			return;
		}

		const dropdown = h('div', {
			className:
				'absolute z-20 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto',
		});

		for (let i = 0; i < filteredGames.length; i++) {
			const game = filteredGames[i];
			const isHighlighted = i === formState.highlightedIndex;
			const option = h(
				'button',
				{
					type: 'button',
					className: `w-full text-left px-3 py-2 text-sm transition-colors ${
						isHighlighted
							? 'bg-primary-50 text-primary-600'
							: 'hover:bg-slate-50 text-slate-700'
					}`,
					onmousedown: async (e) => {
						e.preventDefault(); // Prevent blur before click
						await selectGame(game, games, form, plays, onSubmit, onClose);
					},
					onmouseenter: () => {
						formState.highlightedIndex = i;
						updateDropdown();
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
		className:
			'w-full p-3 border-2 border-slate-200 rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 transition-colors',
		placeholder: 'Search or add a game...',
		value: formState.gameInputText,
		autocomplete: 'off',
		oninput: (e) => {
			formState.gameInputText = e.target.value;
			formState.showDropdown = true;
			formState.highlightedIndex = -1;
			// Clear selection when typing a different value
			if (formState.selectedGameId) {
				const selectedGame = games.find((g) => g.id === formState.selectedGameId);
				if (selectedGame && selectedGame.name !== e.target.value) {
					formState.selectedGameId = null;
					formState.availableExpansions = [];
					formState.selectedExpansionIds = [];
					formState.isCoOp = formState.newGameCoOp;
				}
			}
			updateDropdown();
		},
		onfocus: () => {
			formState.showDropdown = true;
			updateDropdown();
		},
		onblur: () => {
			// Delay hiding dropdown to allow click events to fire
			setTimeout(() => {
				formState.showDropdown = false;
				updateDropdown();
			}, 150);
		},
		onkeydown: async (e) => {
			const inputText = formState.gameInputText.trim().toLowerCase();
			const currentFiltered = inputText
				? games.filter((g) => g.name.toLowerCase().includes(inputText))
				: games;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				formState.highlightedIndex = Math.min(
					formState.highlightedIndex + 1,
					currentFiltered.length - 1
				);
				updateDropdown();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				formState.highlightedIndex = Math.max(formState.highlightedIndex - 1, -1);
				updateDropdown();
			} else if (e.key === 'Enter') {
				if (formState.highlightedIndex >= 0) {
					e.preventDefault();
					const selectedGame = currentFiltered[formState.highlightedIndex];
					if (selectedGame) {
						await selectGame(selectedGame, games, form, plays, onSubmit, onClose);
					}
				}
			} else if (e.key === 'Escape') {
				formState.showDropdown = false;
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

	gameGroup.appendChild(autocompleteWrapper);

	// Most played suggestions
	const mostPlayed = getMostPlayedGames(plays, games, 3);
	if (mostPlayed.length > 0) {
		const suggestionsContainer = h('div', { className: 'mt-2' });
		const suggestionsLabel = h(
			'span',
			{ className: 'text-xs text-slate-500' },
			'Quick picks: '
		);
		suggestionsContainer.appendChild(suggestionsLabel);

		const suggestionsButtons = h('div', { className: 'flex flex-wrap gap-1 mt-1' });
		for (const game of mostPlayed) {
			const btn = h(
				'button',
				{
					type: 'button',
					className:
						'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors',
					onclick: async () => {
						await selectGame(game, games, form, plays, onSubmit, onClose);
					},
				},
				game.name
			);
			suggestionsButtons.appendChild(btn);
		}
		suggestionsContainer.appendChild(suggestionsButtons);
		gameGroup.appendChild(suggestionsContainer);
	}

	form.appendChild(gameGroup);

	// Co-op toggle (only for new games)
	if (!formState.selectedGameId) {
		const coopGroup = h('div', { className: 'mb-5' });
		coopGroup.appendChild(
			h('label', { className: 'block mb-2 text-sm font-semibold text-slate-900' }, 'Game Type')
		);
		const coopOptions = h('div', { className: 'flex gap-2' });

		const competitiveBtn = h(
			'button',
			{
				type: 'button',
				className: `flex-1 py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					!formState.newGameCoOp
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.newGameCoOp = false;
					formState.isCoOp = false;
					formState.place = null;
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			'Competitive'
		);
		coopOptions.appendChild(competitiveBtn);

		const coopBtn = h(
			'button',
			{
				type: 'button',
				className: `flex-1 py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					formState.newGameCoOp
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.newGameCoOp = true;
					formState.isCoOp = true;
					formState.place = null;
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			'Co-op'
		);
		coopOptions.appendChild(coopBtn);

		coopGroup.appendChild(coopOptions);
		form.appendChild(coopGroup);
	}

	// Expansions (if available)
	if (formState.availableExpansions.length > 0) {
		const expGroup = h('div', { className: 'mb-5' });
		expGroup.appendChild(
			h(
				'label',
				{ className: 'block mb-2 text-sm font-semibold text-slate-900' },
				'Expansions Used'
			)
		);
		const expOptions = h('div', { className: 'flex flex-col gap-2' });

		for (const exp of formState.availableExpansions) {
			const isSelected = formState.selectedExpansionIds.includes(exp.id);
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
							formState.selectedExpansionIds = formState.selectedExpansionIds.filter(
								(id) => id !== exp.id
							);
						} else {
							formState.selectedExpansionIds = [...formState.selectedExpansionIds, exp.id];
						}
						rerenderForm(form, games, plays, onSubmit, onClose);
					},
				}),
				h('span', { className: 'font-medium text-sm' }, exp.name)
			);
			expOptions.appendChild(expLabel);
		}

		expGroup.appendChild(expOptions);
		form.appendChild(expGroup);
	}

	// Date and Players row
	const rowGroup = h('div', { className: 'grid grid-cols-2 gap-3 mb-5' });

	const dateGroup = h('div', {});
	dateGroup.appendChild(
		h(
			'label',
			{ className: 'block mb-2 text-sm font-semibold text-slate-900', for: 'date' },
			'Date'
		)
	);
	dateGroup.appendChild(
		h('input', {
			id: 'date',
			type: 'date',
			className:
				'w-full p-3 border-2 border-slate-200 rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 transition-colors',
			value: formState.dateValue,
			required: true,
			onchange: (e) => {
				formState.dateValue = e.target.value;
			},
		})
	);
	rowGroup.appendChild(dateGroup);

	const playersGroup = h('div', {});
	playersGroup.appendChild(
		h(
			'label',
			{ className: 'block mb-2 text-sm font-semibold text-slate-900' },
			'Players'
		)
	);

	// Get min/max players from selected game, or default for new games
	const selectedGame = games.find((g) => g.id === formState.selectedGameId);
	const minPlayers = selectedGame?.min_players ?? 1;
	const maxPlayers = selectedGame?.max_players ?? 8;

	const playerOptions = h('div', { className: 'flex flex-wrap gap-2' });
	for (let i = minPlayers; i <= maxPlayers; i++) {
		const btn = h(
			'button',
			{
				type: 'button',
				className: `py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
					formState.numberOfPlayers === i
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.numberOfPlayers = i;
					// Reset place if it's now invalid
					if (formState.place !== null && formState.place > i) {
						formState.place = null;
					}
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			String(i)
		);
		playerOptions.appendChild(btn);
	}
	playersGroup.appendChild(playerOptions);
	rowGroup.appendChild(playersGroup);

	form.appendChild(rowGroup);

	// Result/Place selection
	const resultGroup = h('div', { className: 'mb-5' });
	resultGroup.appendChild(
		h('label', { className: 'block mb-2 text-sm font-semibold text-slate-900' }, 'Result')
	);

	if (formState.isCoOp) {
		// Co-op: Won / Lost / No result
		const resultOptions = h('div', { className: 'grid grid-cols-3 gap-2' });

		const wonBtn = h(
			'button',
			{
				type: 'button',
				className: `py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					formState.place === 1
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.place = 1;
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			'Won'
		);
		resultOptions.appendChild(wonBtn);

		const lostBtn = h(
			'button',
			{
				type: 'button',
				className: `py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					formState.place === -1
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.place = -1;
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			'Lost'
		);
		resultOptions.appendChild(lostBtn);

		const noneBtn = h(
			'button',
			{
				type: 'button',
				className: `py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
					formState.place === null
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.place = null;
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			'No result'
		);
		resultOptions.appendChild(noneBtn);

		resultGroup.appendChild(resultOptions);
	} else {
		// Competitive: 1st, 2nd, 3rd, ... up to number of players, plus "No result"
		const resultOptions = h('div', { className: 'flex flex-wrap gap-2' });

		// Generate place buttons
		for (let i = 1; i <= formState.numberOfPlayers; i++) {
			const suffix = getOrdinalSuffix(i);
			const btn = h(
				'button',
				{
					type: 'button',
					className: `py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
						formState.place === i
							? 'border-primary-500 bg-primary-50 text-primary-600'
							: 'border-slate-200 text-slate-600'
					}`,
					onclick: () => {
						formState.place = i;
						rerenderForm(form, games, plays, onSubmit, onClose);
					},
				},
				`${i}${suffix}`
			);
			resultOptions.appendChild(btn);
		}

		// No result button
		const noneBtn = h(
			'button',
			{
				type: 'button',
				className: `py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
					formState.place === null
						? 'border-primary-500 bg-primary-50 text-primary-600'
						: 'border-slate-200 text-slate-600'
				}`,
				onclick: () => {
					formState.place = null;
					rerenderForm(form, games, plays, onSubmit, onClose);
				},
			},
			'None'
		);
		resultOptions.appendChild(noneBtn);

		resultGroup.appendChild(resultOptions);
	}

	form.appendChild(resultGroup);

	// Actions
	const actions = h('div', { className: 'grid grid-cols-2 gap-3 mt-6' });
	actions.appendChild(
		h(
			'button',
			{
				type: 'button',
				className:
					'py-3.5 px-4 bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-slate-200 transition-colors',
				onclick: onClose,
			},
			'Cancel'
		)
	);
	actions.appendChild(
		h(
			'button',
			{
				type: 'submit',
				className:
					'py-3.5 px-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors',
			},
			'Save Play'
		)
	);
	form.appendChild(actions);

	// ESC key to close
	const handleKeydown = (e) => {
		if (e.key === 'Escape') {
			onClose();
			document.removeEventListener('keydown', handleKeydown);
		}
	};
	document.addEventListener('keydown', handleKeydown);

	return backdrop;
}

/**
 * Re-render the form content (preserving modal structure)
 * @param {HTMLFormElement} form
 * @param {import('../types.js').Game[]} games
 * @param {import('../types.js').PlayWithGame[]} plays
 * @param {(data: {game_id: string, date_played: string, place: number | undefined, number_of_players: number, expansion_ids: string[] | undefined}) => Promise<void>} onSubmit
 * @param {() => void} onClose
 */
function rerenderForm(form, games, plays, onSubmit, onClose) {
	const modal = form.parentElement;
	const backdrop = modal.parentElement;

	// Remove old form
	form.remove();

	// Create new form and append to modal (pass true to preserve state)
	const tempBackdrop = PlayForm(games, plays, onClose, onSubmit, true);
	const newModal = tempBackdrop.querySelector('.bg-white');
	const newForm = newModal.querySelector('form');

	modal.appendChild(newForm);
}

/**
 * Handle form submission
 */
async function handleSubmit(onSubmit, onClose) {
	try {
		let gameId = formState.selectedGameId;

		// Create new game if needed (when text is entered but no game is selected)
		if (!gameId && formState.gameInputText.trim()) {
			const result = await gamesApi.create(
				formState.gameInputText.trim(),
				false,
				undefined,
				formState.newGameCoOp
			);
			gameId = result.id;
		}

		if (!gameId) {
			alert('Please select or enter a game');
			return;
		}

		// Capture form data before resetting
		const playData = {
			game_id: gameId,
			date_played: formState.dateValue,
			place: formState.place ?? undefined,
			number_of_players: formState.numberOfPlayers,
			expansion_ids:
				formState.selectedExpansionIds.length > 0 ? formState.selectedExpansionIds : undefined,
		};

		// Close modal and reset state BEFORE submitting to prevent re-render showing empty form
		resetFormState();
		onClose();

		// Now submit the data (this triggers loadData which re-renders, but modal is already closed)
		await onSubmit(playData);
	} catch (err) {
		console.error('Failed to save play:', err);
		alert('Failed to save play. Please try again.');
	}
}

/**
 * Get ordinal suffix for a number
 * @param {number} n
 * @returns {string}
 */
function getOrdinalSuffix(n) {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}
