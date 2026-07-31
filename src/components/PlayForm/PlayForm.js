import { h } from '../../utils.js';
import { getFormState, updateFormState, resetFormState } from './formState.js';
import { selectGame, handleSubmit } from './formActions.js';
import { GameAutocomplete } from './GameAutocomplete.js';
import { ExpansionPicker } from './ExpansionPicker.js';
import { ResultPicker } from './ResultPicker.js';
import { PlayerCountPicker } from './PlayerCountPicker.js';

/**
 * @typedef {Object} PlayFormSubmitData
 * @property {string} game_id
 * @property {string} date_played
 * @property {number | undefined} place
 * @property {number} number_of_players
 * @property {string[] | undefined} expansion_ids
 */

/**
 * Create the play form modal
 * @param {import('../../types.js').Game[]} games - Base games only
 * @param {import('../../types.js').PlayWithGame[]} plays - All plays for calculating most played
 * @param {() => void} onClose
 * @param {(data: PlayFormSubmitData) => Promise<void>} onSubmit
 * @param {boolean} [isRerender=false] - If true, don't reset form state (used for re-renders)
 * @returns {HTMLElement}
 */
export function PlayForm(games, plays, onClose, onSubmit, isRerender = false) {
	// Reset form state only on initial open, not on re-renders
	if (!isRerender) {
		resetFormState();
	}

	const formState = getFormState();

	const backdrop = h('div', {
		'data-modal': '',
		className:
			'fixed inset-0 bg-black/55 flex items-end sm:items-center justify-center z-50 animate-fadeIn',
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
		'data-modal-panel': '',
		className:
			'relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-paper border-y-2 sm:border-2 border-ink',
	});
	backdrop.appendChild(modal);

	// Header
	const header = h(
		'div',
		{ className: 'sticky top-0 z-10 flex items-center justify-between bg-ink px-3 py-2.5 text-paper' },
		h('h2', { className: 'font-mono text-[11px] font-bold uppercase tracking-[0.16em]' }, 'Log a play'),
		h(
			'button',
			{
				type: 'button',
				className: 'font-mono text-xs font-bold text-paper hover:text-accent',
				'aria-label': 'Close',
				onclick: onClose,
			},
			'[×]'
		)
	);
	modal.appendChild(header);

	// Form
	const form = h('form', {
		className: 'p-4',
		onsubmit: async (e) => {
			e.preventDefault();
			await handleSubmit(onSubmit, onClose);
		},
	});
	modal.appendChild(form);

	/**
	 * Re-render the form content (preserving modal structure)
	 */
	const rerenderForm = () => {
		const modal = form.parentElement;
		const activeInput = document.activeElement;
		const wasGameInputFocused = activeInput && activeInput.id === 'game';
		const cursorPosition = wasGameInputFocused ? activeInput.selectionStart : null;

		// Remove old form
		form.remove();

		// Create new form and append to modal (pass true to preserve state)
		const tempBackdrop = PlayForm(games, plays, onClose, onSubmit, true);
		const newModal = tempBackdrop.querySelector('[data-modal-panel]');
		const newForm = newModal.querySelector('form');

		modal.appendChild(newForm);

		// Rebuilding the form drops focus; restore it so typing isn't interrupted
		if (wasGameInputFocused) {
			const newGameInput = newForm.querySelector('#game');
			if (newGameInput) {
				newGameInput.focus();
				newGameInput.setSelectionRange(cursorPosition, cursorPosition);
			}
		}
	};

	// Game selection with autocomplete
	const gameAutocomplete = GameAutocomplete({
		games,
		plays,
		onSelect: async (game) => {
			await selectGame(game, rerenderForm);
		},
		onClear: rerenderForm,
	});
	form.appendChild(gameAutocomplete);

	// Co-op toggle (only for new games)
	if (!formState.selectedGameId) {
		const coopGroup = h('div', { className: 'mb-5' });
		coopGroup.appendChild(h('label', { className: 'label mb-2' }, 'Game Type'));
		const coopOptions = h('div', { className: 'flex gap-2' });

		const competitiveBtn = h(
			'button',
			{
				type: 'button',
				className: `toggle flex-1 ${!formState.newGameCoOp ? 'toggle--on' : ''}`,
				onclick: () => {
					updateFormState({
						newGameCoOp: false,
						isCoOp: false,
						place: null,
					});
					rerenderForm();
				},
			},
			'Competitive'
		);
		coopOptions.appendChild(competitiveBtn);

		const coopBtn = h(
			'button',
			{
				type: 'button',
				className: `toggle flex-1 ${formState.newGameCoOp ? 'toggle--on' : ''}`,
				onclick: () => {
					updateFormState({
						newGameCoOp: true,
						isCoOp: true,
						place: null,
					});
					rerenderForm();
				},
			},
			'Co-op'
		);
		coopOptions.appendChild(coopBtn);

		coopGroup.appendChild(coopOptions);
		form.appendChild(coopGroup);
	}

	// Expansions (if available)
	const expansionPicker = ExpansionPicker({
		expansions: formState.availableExpansions,
		selectedIds: formState.selectedExpansionIds,
		onChange: (selectedIds) => {
			updateFormState({ selectedExpansionIds: selectedIds });
			rerenderForm();
		},
	});
	if (expansionPicker) {
		form.appendChild(expansionPicker);
	}

	// Date and Players row
	const rowGroup = h('div', { className: 'grid grid-cols-2 gap-3 mb-5' });

	// Date input
	const dateGroup = h('div', {});
	dateGroup.appendChild(h('label', { className: 'label mb-2', for: 'date' }, 'Date'));
	dateGroup.appendChild(
		h('input', {
			id: 'date',
			type: 'date',
			className: 'field',
			value: formState.dateValue,
			required: true,
			onchange: (e) => {
				updateFormState({ dateValue: e.target.value });
			},
		})
	);
	rowGroup.appendChild(dateGroup);

	// Player count picker
	const selectedGame = games.find((g) => g.id === formState.selectedGameId);
	const minPlayers = selectedGame?.min_players ?? 1;
	const maxPlayers = selectedGame?.max_players ?? 8;

	const playerCountPicker = PlayerCountPicker({
		min: minPlayers,
		max: maxPlayers,
		value: formState.numberOfPlayers,
		onChange: (value) => {
			const currentState = getFormState();
			// Reset place if it's now invalid
			let place = currentState.place;
			if (place !== null && place > value) {
				place = null;
			}
			updateFormState({ numberOfPlayers: value, place });
			rerenderForm();
		},
	});
	rowGroup.appendChild(playerCountPicker);

	form.appendChild(rowGroup);

	// Result picker
	const resultPicker = ResultPicker({
		isCoOp: formState.isCoOp,
		numberOfPlayers: formState.numberOfPlayers,
		place: formState.place,
		onChange: (place) => {
			updateFormState({ place });
			rerenderForm();
		},
	});
	form.appendChild(resultPicker);

	// Actions — the two buttons share the divider between them
	const actions = h('div', { className: 'mt-6 -mx-4 -mb-4 grid grid-cols-2 border-t border-ink' });
	actions.appendChild(
		h('button', { type: 'button', className: 'btn btn-flush', onclick: onClose }, 'Cancel')
	);
	actions.appendChild(
		h('button', { type: 'submit', className: 'btn btn-accent btn-flush' }, 'Save Play')
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
