import { gamesApi } from '../../api.js';
import { getFormState, resetFormState, updateFormState } from './formState.js';

/**
 * @typedef {Object} PlayData
 * @property {string} game_id
 * @property {string} date_played
 * @property {import('../../types.js').PlayResult | null} result
 * @property {number | undefined} place
 * @property {string | undefined} side
 * @property {string[] | undefined} player_names - Resolved to people server-side
 * @property {number} number_of_players
 * @property {string[] | undefined} expansion_ids
 */

/**
 * Select a game from the autocomplete and load its expansions
 * @param {import('../../types.js').Game} game
 * @param {() => void} onRerender - Called after state update to trigger re-render
 */
export async function selectGame(game, onRerender) {
	const formState = getFormState();

	// Reset numberOfPlayers if out of range for new game
	const minPlayers = game.min_players ?? 1;
	const maxPlayers = game.max_players ?? 8;
	let numberOfPlayers = formState.numberOfPlayers;
	if (numberOfPlayers < minPlayers || numberOfPlayers > maxPlayers) {
		numberOfPlayers = minPlayers;
	}

	// Placement and side belong to the game that was selected, not the next one
	updateFormState({
		selectedGameId: game.id,
		gameInputText: game.name,
		showDropdown: false,
		highlightedIndex: -1,
		selectedExpansionIds: [],
		isCoOp: game.co_op || false,
		place: null,
		side: null,
		numberOfPlayers,
	});

	// Load expansions
	try {
		const expansions = await gamesApi.getExpansions(game.id);
		updateFormState({ availableExpansions: expansions });
	} catch (err) {
		console.error('Failed to load expansions:', err);
		updateFormState({ availableExpansions: [] });
	}

	onRerender();
}

/**
 * Handle form submission - creates game if needed and submits play data
 * @param {(data: PlayData) => Promise<void>} onSubmit - Callback to submit the play
 * @param {() => void} onClose - Callback to close the modal
 */
export async function handleSubmit(onSubmit, onClose) {
	const formState = getFormState();

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
		/** @type {PlayData} */
		const playData = {
			game_id: gameId,
			date_played: formState.dateValue,
			result: formState.result,
			// A finishing position only means something in a competitive game
			place: formState.isCoOp ? undefined : (formState.place ?? undefined),
			side: formState.side ?? undefined,
			player_names: formState.playerNames.length > 0 ? formState.playerNames : undefined,
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
