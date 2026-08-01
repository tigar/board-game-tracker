import { getTodayISO } from '../../utils.js';

/**
 * @typedef {Object} PlayFormState
 * @property {string | null} selectedGameId
 * @property {string} gameInputText - Text in the autocomplete input
 * @property {boolean} showDropdown - Whether to show the autocomplete dropdown
 * @property {number} highlightedIndex - Index of highlighted item in dropdown for keyboard navigation
 * @property {boolean} newGameCoOp
 * @property {import('../../types.js').Game[]} availableExpansions
 * @property {string[]} selectedExpansionIds
 * @property {string} dateValue
 * @property {number} numberOfPlayers
 * @property {import('../../types.js').PlayResult | null} result - How the play ended
 * @property {number | null} place - Exact finish, 1=1st. Competitive games only.
 * @property {string | null} side - Which of the game's sides was played
 * @property {string[]} playerNames - Who was at the table
 * @property {boolean} isCoOp
 * @property {boolean} advancedOpen - Whether the advanced options are disclosed
 * @property {string} personInputText - Text in the people autocomplete
 * @property {boolean} personShowDropdown
 * @property {number} personHighlightedIndex
 */

/**
 * Create a fresh form state object
 * @returns {PlayFormState}
 */
export function createFormState() {
	return {
		selectedGameId: null,
		gameInputText: '',
		showDropdown: false,
		highlightedIndex: -1,
		newGameCoOp: false,
		availableExpansions: [],
		selectedExpansionIds: [],
		dateValue: getTodayISO(),
		numberOfPlayers: 2,
		result: null,
		place: null,
		side: null,
		playerNames: [],
		isCoOp: false,
		advancedOpen: false,
		personInputText: '',
		personShowDropdown: false,
		personHighlightedIndex: -1,
	};
}

/** @type {PlayFormState} */
let formState = createFormState();

/**
 * Get the current form state
 * @returns {PlayFormState}
 */
export function getFormState() {
	return formState;
}

/**
 * Update form state with partial updates
 * @param {Partial<PlayFormState>} updates
 */
export function updateFormState(updates) {
	formState = { ...formState, ...updates };
}

/**
 * Reset form state to initial values
 */
export function resetFormState() {
	formState = createFormState();
}
