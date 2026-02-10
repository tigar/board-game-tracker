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
 * Format place/result for display
 * @param {number | undefined} place
 * @param {boolean} isCoOp
 * @returns {string}
 */
export function formatPlace(place, isCoOp) {
	if (place === undefined || place === null) return '';

	if (isCoOp) {
		return place === 1 ? 'Won' : place === -1 ? 'Lost' : '';
	}

	// Competitive game - show placement
	const suffixes = ['th', 'st', 'nd', 'rd'];
	const v = place % 100;
	return place + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
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
		} else if (key === 'onclick' || key === 'onchange' || key === 'onsubmit' || key === 'oninput') {
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
