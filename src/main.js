import { gamesApi, playsApi, statsApi } from './api.js';
import { LogPlayButton } from './components/LogPlayButton.js';
import { PlayForm } from './components/PlayForm/index.js';
import { PlayList } from './components/PlayList.js';
import { SearchBar } from './components/SearchBar.js';
import { Stats } from './components/Stats.js';
import { getFilteredPlays, getState, setState, subscribe } from './state.js';

/**
 * Load all data from API
 */
async function loadData() {
	try {
		const [gamesData, playsData, statsData] = await Promise.all([
			gamesApi.getAll(),
			playsApi.getAll(),
			statsApi.get(),
		]);

		// Filter to only show base games (not expansions)
		const baseGames = gamesData.filter((g) => !g.is_expansion);

		setState({
			games: baseGames,
			plays: playsData,
			stats: statsData,
			loading: false,
		});
	} catch (err) {
		console.error('Failed to load data:', err);
		setState({ loading: false });
	}
}

/**
 * Handle adding a new play
 * @param {{game_id: string, date_played: string, place: number | undefined, number_of_players: number, expansion_ids: string[] | undefined}} data
 */
async function handleAddPlay(data) {
	await playsApi.create(data);
	await loadData();
}

/**
 * Handle deleting a play
 * @param {string} id
 */
async function handleDeletePlay(id) {
	if (!confirm('Delete this play?')) return;

	try {
		await playsApi.delete(id);
		await loadData();
	} catch (err) {
		console.error('Failed to delete play:', err);
		alert('Failed to delete play. Please try again.');
	}
}

/**
 * Handle search query change
 * @param {string} query
 */
function handleSearch(query) {
	setState({ searchQuery: query });
}

/**
 * Show add play modal
 */
function showAddPlayModal() {
	setState({ showAddPlayModal: true });
}

/**
 * Hide add play modal
 */
function hideAddPlayModal() {
	setState({ showAddPlayModal: false });
}

/**
 * Render the main content
 * @param {HTMLElement} container
 */
function render(container) {
	const state = getState();
	const headerAction = document.getElementById('header-action');
	const headerSlug = document.getElementById('header-slug');

	// Clear container
	container.innerHTML = '';
	headerAction.innerHTML = '';

	// Loading state
	if (state.loading) {
		container.innerHTML =
			'<div class="px-4 py-16 font-mono text-xs tracking-[0.16em] text-muted">LOADING…</div>';
		headerSlug.textContent = '';
		return;
	}

	// The masthead carries the record count and the primary action
	headerSlug.textContent = `REC. ${state.plays.length}`;
	headerAction.appendChild(LogPlayButton(showAddPlayModal));

	// Stats
	container.appendChild(Stats(state.stats, state.plays));

	// Search bar
	const filteredPlays = getFilteredPlays();
	container.appendChild(
		SearchBar(state.searchQuery, handleSearch, filteredPlays.length, state.plays.length)
	);

	// Play list
	container.appendChild(PlayList(filteredPlays, state.searchQuery, handleDeletePlay));

	// Modal (if open)
	if (state.showAddPlayModal) {
		const modal = PlayForm(state.games, state.plays, hideAddPlayModal, handleAddPlay);
		document.body.appendChild(modal);
	}
}

/**
 * Initialize the app
 */
function init() {
	const main = document.getElementById('main');
	if (!main) {
		console.error('Main element not found');
		return;
	}

	// Subscribe to state changes
	subscribe((state) => {
		render(main);

		// Handle modal cleanup when closed
		const existingModal = document.querySelector('[data-modal]');
		if (!state.showAddPlayModal && existingModal) {
			existingModal.remove();
		}
	});

	// Load initial data
	loadData();
}

// Start the app
init();
