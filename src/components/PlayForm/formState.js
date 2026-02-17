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
 * @property {number | null} place - 1=1st, 2=2nd, etc. or 1=won, -1=lost for co-op
 * @property {boolean} isCoOp
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
		place: null,
		isCoOp: false,
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
