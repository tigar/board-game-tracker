import { h } from '../../utils.js';
import { AdvancedOptions } from './AdvancedOptions.js';
import { ExpansionPicker } from './ExpansionPicker.js';
import { handleSubmit, selectGame } from './formActions.js';
import { getFormState, resetFormState, updateFormState } from './formState.js';
import { GameAutocomplete } from './GameAutocomplete.js';
import { PeoplePicker } from './PeoplePicker.js';
import { PlacementPicker } from './PlacementPicker.js';
import { PlayerCountPicker } from './PlayerCountPicker.js';
import { ResultPicker } from './ResultPicker.js';
import { SidePicker } from './SidePicker.js';

/**
 * @typedef {import('./formActions.js').PlayData} PlayFormSubmitData
 */

/**
 * The form rebuilds itself on every change, so an ESC listener registered per
 * build would accumulate. Keeping the live one here means there is only ever
 * one, however many times the form re-renders.
 * @type {((e: KeyboardEvent) => void) | null}
 */
let escapeHandler = null;

/**
 * @param {() => void} onEscape
 */
function bindEscape(onEscape) {
	unbindEscape();
	escapeHandler = (e) => {
		if (e.key !== 'Escape') return;
		unbindEscape();
		onEscape();
	};
	document.addEventListener('keydown', escapeHandler);
}

function unbindEscape() {
	if (!escapeHandler) return;
	document.removeEventListener('keydown', escapeHandler);
	escapeHandler = null;
}

/**
 * Capture which field the user is in, so rebuilding the form doesn't
 * interrupt typing. Text inputs also keep their caret.
 * @param {HTMLElement} form
 * @returns {{id: string, start: number | null, end: number | null} | null}
 */
function captureFocus(form) {
	const active = document.activeElement;
	if (!active || !active.id || !form.contains(active)) return null;

	const isTextInput = active.tagName === 'INPUT' && active.type === 'text';
	return {
		id: active.id,
		start: isTextInput ? active.selectionStart : null,
		end: isTextInput ? active.selectionEnd : null,
	};
}

/**
 * @param {HTMLElement} form
 * @param {{id: string, start: number | null, end: number | null} | null} focus
 */
function restoreFocus(form, focus) {
	if (!focus) return;
	const field = form.querySelector(`#${CSS.escape(focus.id)}`);
	if (!field) return;

	field.focus();
	if (focus.start !== null) {
		field.setSelectionRange(focus.start, focus.end);
	}
}

/**
 * Create the play form modal
 * @param {import('../../types.js').Game[]} games - Base games only
 * @param {import('../../types.js').PlayWithGame[]} plays - All plays for calculating most played
 * @param {import('../../types.js').Person[]} people - Everyone on record
 * @param {() => void} onClose
 * @param {(data: PlayFormSubmitData) => Promise<void>} onSubmit
 * @param {boolean} [isRerender=false] - If true, don't reset form state (used for re-renders)
 * @returns {HTMLElement}
 */
export function PlayForm(games, plays, people, onClose, onSubmit, isRerender = false) {
	// Reset form state only on initial open, not on re-renders
	if (!isRerender) {
		resetFormState();
	}

	const formState = getFormState();

	const closeForm = () => {
		unbindEscape();
		onClose();
	};

	const backdrop = h('div', {
		'data-modal': '',
		className:
			'fixed inset-0 bg-black/55 flex items-end sm:items-center justify-center z-50 animate-fadeIn',
	});

	// Backdrop close button (invisible, covers backdrop but behind modal)
	const backdropClose = h('button', {
		type: 'button',
		className: 'absolute inset-0 w-full h-full cursor-pointer z-0',
		onclick: closeForm,
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
		{
			className:
				'sticky top-0 z-10 flex items-center justify-between bg-ink px-3 py-2.5 text-paper',
		},
		h(
			'h2',
			{ className: 'font-mono text-[11px] font-bold uppercase tracking-[0.16em]' },
			'Log a play'
		),
		h(
			'button',
			{
				type: 'button',
				className: 'font-mono text-xs font-bold text-paper hover:text-accent',
				'aria-label': 'Close',
				onclick: closeForm,
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
			await handleSubmit(onSubmit, closeForm);
		},
	});
	modal.appendChild(form);

	/**
	 * Re-render the form content (preserving modal structure)
	 */
	const rerenderForm = () => {
		const modal = form.parentElement;
		const focus = captureFocus(form);

		// Remove old form
		form.remove();

		// Create new form and append to modal (pass true to preserve state)
		const tempBackdrop = PlayForm(games, plays, people, onClose, onSubmit, true);
		const newModal = tempBackdrop.querySelector('[data-modal-panel]');
		const newForm = newModal.querySelector('form');

		modal.appendChild(newForm);
		restoreFocus(newForm, focus);
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
					updateFormState({ newGameCoOp: false, isCoOp: false });
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
					// A co-op has no finishing positions to record
					updateFormState({ newGameCoOp: true, isCoOp: true, place: null });
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

	// Result — the only outcome field most plays need
	const resultPicker = ResultPicker({
		result: formState.result,
		onChange: (result) => {
			// A placement is a more specific claim than the result it implies,
			// so it can't outlive the result being cleared or contradicted.
			updateFormState({ result, place: result === null ? null : getFormState().place });
			rerenderForm();
		},
	});
	form.appendChild(resultPicker);

	const advanced = AdvancedOptions({
		open: formState.advancedOpen,
		onToggle: () => {
			updateFormState({ advancedOpen: !getFormState().advancedOpen });
			rerenderForm();
		},
		children: [
			formState.isCoOp
				? null
				: PlacementPicker({
						numberOfPlayers: formState.numberOfPlayers,
						place: formState.place,
						onChange: (place) => {
							// Finishing first is a win; anything else isn't
							updateFormState({
								place,
								result: place === null ? getFormState().result : place === 1 ? 'win' : 'loss',
							});
							rerenderForm();
						},
					}),
			SidePicker({
				sides: selectedGame?.sides,
				side: formState.side,
				onChange: (side) => {
					updateFormState({ side });
					rerenderForm();
				},
			}),
			PeoplePicker({
				people,
				playerNames: formState.playerNames,
				onChange: (playerNames) => {
					// Naming people can only raise the headcount — logging 2 of the 5
					// who were there shouldn't quietly rewrite the count to 2.
					const current = getFormState();
					const numberOfPlayers = Math.min(
						Math.max(current.numberOfPlayers, playerNames.length),
						maxPlayers
					);
					updateFormState({ playerNames, numberOfPlayers });
					rerenderForm();
				},
			}),
		],
	});
	if (advanced) {
		form.appendChild(advanced);
	}

	// Actions — the two buttons share the divider between them
	const actions = h('div', { className: 'mt-6 -mx-4 -mb-4 grid grid-cols-2 border-t border-ink' });
	actions.appendChild(
		h('button', { type: 'button', className: 'btn btn-flush', onclick: closeForm }, 'Cancel')
	);
	actions.appendChild(
		h('button', { type: 'submit', className: 'btn btn-accent btn-flush' }, 'Save Play')
	);
	form.appendChild(actions);

	bindEscape(onClose);

	return backdrop;
}
