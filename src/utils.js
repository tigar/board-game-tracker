/**
 * Format a date string for display
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDate(isoDate) {
	const date = new Date(isoDate);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (date.toDateString() === today.toDateString()) return 'Today';
	if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayISO() {
	return new Date().toISOString().split('T')[0];
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} n
 * @returns {string}
 */
export function getOrdinalSuffix(n) {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Format a play's outcome for display. An exact placement is more specific than
 * the win/loss it implies, so it wins when both are recorded.
 * @param {import('./types.js').Play} play
 * @returns {string}
 */
export function formatResult(play) {
	let text = '';
	if (play.place) {
		text = `${play.place}${getOrdinalSuffix(play.place)}`;
	} else if (play.result === 'win') {
		text = 'Won';
	} else if (play.result === 'loss') {
		text = 'Lost';
	} else if (play.result === 'draw') {
		text = 'Draw';
	}

	if (!play.side) return text;
	return text ? `${text} (as ${play.side})` : `As ${play.side}`;
}

/**
 * Create an HTML element with attributes and children
 * @param {string} tag
 * @param {Record<string, any>} attrs
 * @param {...(string | Node)} children
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
	const el = document.createElement(tag);

	for (const [key, value] of Object.entries(attrs)) {
		if (key === 'className') {
			el.className = value;
		} else if (key.startsWith('on') && typeof value === 'function') {
			el.addEventListener(key.slice(2), value);
		} else if (key === 'dataset') {
			for (const [dataKey, dataValue] of Object.entries(value)) {
				el.dataset[dataKey] = dataValue;
			}
		} else if (value !== undefined && value !== null && value !== false) {
			el.setAttribute(key, value);
		}
	}

	for (const child of children) {
		if (typeof child === 'string') {
			el.appendChild(document.createTextNode(child));
		} else if (child) {
			el.appendChild(child);
		}
	}

	return el;
}

/**
 * Shorthand for createElement
 */
export const h = createElement;
