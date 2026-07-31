import { h } from '../utils.js';

/**
 * Create the primary "Log Play" button
 * @param {() => void} onClick
 * @returns {HTMLElement}
 */
export function LogPlayButton(onClick) {
	return h(
		'button',
		{ type: 'button', className: 'btn btn-accent w-full sm:w-auto', onclick: onClick },
		'+ Log Play'
	);
}
